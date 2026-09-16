import { stripHtml } from '../lib/sanitize.js';
import {
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Page,
  Question,
  Solution,
  Subject,
} from '../models/index.js';
import { escapeRegex } from '../utils/slug.js';
import { getTerms, term } from './terms.js';
import { urls } from './urls.js';

const STOP_WORDS = new Set([
  'maths', 'math', 'mathematics', 'ncert', 'solution', 'solutions', 'class', 'chapter', 'exercise', 'ex',
  'question', 'q', 'the', 'of', 'for', 'and', 'in', 'to', 'गणित', 'हल', 'कक्षा', 'अध्याय', 'प्रश्नावली',
  'प्रश्न', 'का', 'की', 'के', 'में',
]);

const TYPE_WEIGHT = { class: 60, chapter: 50, exercise: 45, formula: 35, note: 30, importantQuestion: 25, question: 22, solution: 15, page: 10 };

export function parseQuery(raw) {
  let text = ` ${String(raw || '').slice(0, 200)} `;
  const take = (re) => {
    const m = text.match(re);
    if (!m) return null;
    text = text.replace(m[0], ' ');
    return m[1];
  };
  const classNumber = take(/(?:class|कक्षा|cls)\s*-?\s*(\d{1,2})(?!\d|\.\d)/i);
  const exerciseNumber = take(/(?:exercise|ex|प्रश्नावली)\s*[.:-]?\s*(\d{1,2}\.\d{1,2})/i) || take(/(?:^|\s)(\d{1,2}\.\d{1,2})(?=\s)/);
  const chapterNumber = take(/(?:chapter|ch|अध्याय|adhyay)\s*[.:-]?\s*(\d{1,2})(?!\d|\.\d)/i);
  const questionNumber = take(/(?:question|प्रश्न|q)\s*[.:-]?\s*(\d{1,3})(?!\d)/i);
  const terms = text
    .split(/[\s,;:!?()"'`]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
    .slice(0, 6);
  return {
    classNumber: classNumber ? Number(classNumber) : null,
    chapterNumber: chapterNumber ? Number(chapterNumber) : null,
    exerciseNumber,
    questionNumber,
    terms,
  };
}

function snippetOf(text, terms) {
  const clean = stripHtml(text || '');
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const idx = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, idx - 60);
  return `${start > 0 ? '…' : ''}${clean.slice(start, start + 170)}${start + 170 < clean.length ? '…' : ''}`;
}

const textFilter = (terms) => (terms.length ? { $and: terms.map((t) => ({ searchText: { $regex: escapeRegex(t), $options: 'i' } })) } : {});

async function contextMaps() {
  const [classes, subjects] = await Promise.all([
    ClassLevel.find(ClassLevel.publicFilter()).select('number name slug subjects').lean(),
    Subject.find({ ...Subject.publicFilter(), isPublic: true }).select('name slug').lean(),
  ]);
  return {
    classById: new Map(classes.map((c) => [String(c._id), c])),
    subjectById: new Map(subjects.map((s) => [String(s._id), s])),
    classes,
  };
}

export async function search({ q, type, classNumber: classFilter, page = 1, limit = 20 }) {
  const parsed = parseQuery(q);
  const terms = await getTerms();
  if (!parsed.terms.length && !parsed.classNumber && !parsed.chapterNumber && !parsed.exerciseNumber && !parsed.questionNumber) {
    return { query: parsed, results: [], total: 0, page, pages: 0 };
  }

  const { classById, subjectById, classes } = await contextMaps();
  const classNum = classFilter ? Number(classFilter) : parsed.classNumber;
  const classIds = classNum ? classes.filter((c) => c.number === classNum).map((c) => c._id) : null;
  if (classNum && !classIds.length) return { query: parsed, results: [], total: 0, page, pages: 0 };
  const classScope = classIds ? { class: { $in: classIds } } : {};
  const want = (t) => !type || type === t;
  const PER_TYPE = 40;
  const results = [];
  const tf = textFilter(parsed.terms);

  let chapterIds = null;
  if (parsed.chapterNumber) {
    const chs = await Chapter.find(Chapter.publicFilter({ ...classScope, number: parsed.chapterNumber })).select('_id').lean();
    chapterIds = chs.map((c) => c._id);
  }
  const chapterScope = chapterIds ? { chapter: { $in: chapterIds } } : {};

  const chapterCache = new Map();
  const getChapter = async (id) => {
    const key = String(id);
    if (!chapterCache.has(key)) chapterCache.set(key, await Chapter.findById(id).select('number title slug class subject').lean());
    return chapterCache.get(key);
  };
  const exerciseCache = new Map();
  const getExercise = async (id) => {
    const key = String(id);
    if (!exerciseCache.has(key)) exerciseCache.set(key, await Exercise.findById(id).select('number slug chapter title').lean());
    return exerciseCache.get(key);
  };
  const ctxLabels = (cls, chapter, exercise) => ({
    class: cls ? { number: cls.number, label: term(terms, 'class', cls.number) } : null,
    chapter: chapter ? { number: chapter.number, title: chapter.title, label: term(terms, 'chapter', chapter.number) } : null,
    exercise: exercise ? { number: exercise.number, label: term(terms, 'exercise', exercise.number) } : null,
  });

  const onlyStructured = !parsed.terms.length;

  if (want('class') && !parsed.chapterNumber && !parsed.exerciseNumber && !parsed.questionNumber) {
    const filter = onlyStructured ? { _id: { $in: classIds || [] } } : { ...tf, ...(classIds ? { _id: { $in: classIds } } : {}) };
    const items = await ClassLevel.find(ClassLevel.publicFilter(filter)).select('+searchText number name slug description subjects').limit(PER_TYPE).lean();
    for (const c of items) {
      const subject = c.subjects.map((id) => subjectById.get(String(id))).find(Boolean);
      results.push({
        type: 'class',
        id: c._id,
        title: c.name?.hi || c.name?.en ? c.name : term(terms, 'class', c.number),
        snippet: snippetOf(c.description?.en || c.description?.hi, parsed.terms),
        ...ctxLabels(c),
        url: subject ? urls.subject(c, subject) : urls.class(c),
        score: TYPE_WEIGHT.class + (classNum === c.number ? 30 : 0),
      });
    }
  }

  if (want('chapter') && !parsed.exerciseNumber && !parsed.questionNumber && (!onlyStructured || parsed.chapterNumber || classIds)) {
    const filter = { ...classScope, ...tf, ...(parsed.chapterNumber ? { number: parsed.chapterNumber } : {}) };
    const items = await Chapter.find(Chapter.publicFilter(filter)).select('+searchText number title slug shortDescription class subject').sort({ number: 1 }).limit(PER_TYPE).lean();
    for (const ch of items) {
      const cls = classById.get(String(ch.class));
      const subject = subjectById.get(String(ch.subject));
      if (!cls || !subject) continue;
      results.push({
        type: 'chapter',
        id: ch._id,
        title: ch.title,
        snippet: snippetOf(ch.shortDescription?.hi || ch.shortDescription?.en || ch.searchText, parsed.terms),
        ...ctxLabels(cls, ch),
        url: urls.chapter(cls, subject, ch),
        score: TYPE_WEIGHT.chapter + (parsed.chapterNumber === ch.number ? 25 : 0) + (onlyStructured && !parsed.chapterNumber ? -20 : 0),
      });
    }
  }

  if (want('exercise') && !parsed.questionNumber && (!onlyStructured || parsed.exerciseNumber || parsed.chapterNumber)) {
    const filter = { ...classScope, ...chapterScope, ...tf, ...(parsed.exerciseNumber ? { number: parsed.exerciseNumber } : {}) };
    const items = await Exercise.find(Exercise.publicFilter(filter)).select('+searchText number title slug description chapter class subject').limit(PER_TYPE).lean();
    for (const ex of items) {
      const cls = classById.get(String(ex.class));
      const subject = subjectById.get(String(ex.subject));
      const chapter = await getChapter(ex.chapter);
      if (!cls || !subject || !chapter) continue;
      results.push({
        type: 'exercise',
        id: ex._id,
        title: term(terms, 'exercise', ex.number),
        snippet: snippetOf(chapter.title?.hi ? `${chapter.title.hi} (${chapter.title.en || ''})` : ex.searchText, parsed.terms),
        ...ctxLabels(cls, chapter, ex),
        url: urls.exercise(cls, subject, chapter, ex),
        score: TYPE_WEIGHT.exercise + (parsed.exerciseNumber === ex.number ? 40 : 0),
      });
    }
  }

  if (want('question') && (!onlyStructured || parsed.questionNumber)) {
    let exerciseScope = {};
    if (parsed.exerciseNumber) {
      const exs = await Exercise.find(Exercise.publicFilter({ ...classScope, ...chapterScope, number: parsed.exerciseNumber })).select('_id').lean();
      exerciseScope = { exercise: { $in: exs.map((e) => e._id) } };
    }
    const filter = { ...classScope, ...chapterScope, ...exerciseScope, ...tf, ...(parsed.questionNumber ? { number: parsed.questionNumber } : {}) };
    const items = await Question.find(Question.publicFilter(filter)).select('+searchText number slug text exercise chapter class subject').limit(PER_TYPE).lean();
    for (const qn of items) {
      const cls = classById.get(String(qn.class));
      const subject = subjectById.get(String(qn.subject));
      const [chapter, exercise] = await Promise.all([getChapter(qn.chapter), getExercise(qn.exercise)]);
      if (!cls || !subject || !chapter || !exercise) continue;
      results.push({
        type: 'question',
        id: qn._id,
        title: term(terms, 'question', qn.number),
        snippet: snippetOf(qn.text?.hi || qn.text?.en || qn.text?.mixed, parsed.terms),
        ...ctxLabels(cls, chapter, exercise),
        url: urls.question(cls, subject, chapter, exercise, qn),
        score: TYPE_WEIGHT.question + (parsed.questionNumber === qn.number ? 40 : 0) + (parsed.exerciseNumber ? 10 : 0),
      });
    }
  }

  if (!onlyStructured) {
    if (want('formula')) {
      const or = parsed.terms.flatMap((t) => {
        const re = { $regex: escapeRegex(t), $options: 'i' };
        return [{ 'formulas.latex': re }, { 'formulas.title.en': re }, { 'formulas.title.hi': re }];
      });
      const items = await Chapter.find(Chapter.publicFilter({ ...classScope, $or: or })).select('number title slug class subject formulas').limit(20).lean();
      for (const ch of items) {
        const cls = classById.get(String(ch.class));
        const subject = subjectById.get(String(ch.subject));
        if (!cls || !subject) continue;
        const formula = ch.formulas.find((f) => parsed.terms.some((t) => `${f.latex} ${f.title?.en} ${f.title?.hi}`.toLowerCase().includes(t)));
        if (!formula) continue;
        results.push({
          type: 'formula',
          id: `${ch._id}-${formula._id}`,
          title: formula.title?.hi || formula.title?.en ? formula.title : term(terms, 'formula'),
          latex: formula.latex,
          ...ctxLabels(cls, ch),
          url: `${urls.chapter(cls, subject, ch)}#formulas`,
          score: TYPE_WEIGHT.formula,
        });
      }
    }

    if (want('solution')) {
      const sols = await Solution.find(tf).select('+searchText question').limit(PER_TYPE).lean();
      const qs = await Question.find(Question.publicFilter({ _id: { $in: sols.map((s) => s.question) }, ...classScope, ...chapterScope }))
        .select('number slug exercise chapter class subject')
        .lean();
      const seenQuestions = new Set(results.filter((r) => r.type === 'question').map((r) => String(r.id)));
      for (const qn of qs) {
        if (seenQuestions.has(String(qn._id))) continue;
        const cls = classById.get(String(qn.class));
        const subject = subjectById.get(String(qn.subject));
        const [chapter, exercise] = await Promise.all([getChapter(qn.chapter), getExercise(qn.exercise)]);
        if (!cls || !subject || !chapter || !exercise) continue;
        const sol = sols.find((s) => String(s.question) === String(qn._id));
        results.push({
          type: 'solution',
          id: sol._id,
          title: term(terms, 'solution'),
          subtitle: term(terms, 'question', qn.number),
          snippet: snippetOf(sol.searchText, parsed.terms),
          ...ctxLabels(cls, chapter, exercise),
          url: urls.question(cls, subject, chapter, exercise, qn),
          score: TYPE_WEIGHT.solution,
        });
      }
    }

    if (want('note')) {
      const items = await Note.find(Note.publicFilter({ ...classScope, ...chapterScope, ...tf })).select('+searchText title summary slug class subject chapter').limit(PER_TYPE).lean();
      for (const n of items) {
        const cls = classById.get(String(n.class));
        const subject = subjectById.get(String(n.subject));
        if (!cls || !subject) continue;
        const chapter = n.chapter ? await getChapter(n.chapter) : null;
        results.push({
          type: 'note',
          id: n._id,
          title: n.title,
          snippet: snippetOf(n.summary?.hi || n.summary?.en || n.searchText, parsed.terms),
          ...ctxLabels(cls, chapter),
          url: urls.note(cls, subject, n),
          score: TYPE_WEIGHT.note,
        });
      }
    }

    if (want('importantQuestion')) {
      const items = await ImportantQuestion.find(ImportantQuestion.publicFilter({ ...classScope, ...chapterScope, ...tf })).select('+searchText text slug class subject chapter marks').limit(PER_TYPE).lean();
      for (const iq of items) {
        const cls = classById.get(String(iq.class));
        const subject = subjectById.get(String(iq.subject));
        if (!cls || !subject) continue;
        const chapter = iq.chapter ? await getChapter(iq.chapter) : null;
        results.push({
          type: 'importantQuestion',
          id: iq._id,
          title: term(terms, 'importantQuestions'),
          snippet: snippetOf(iq.text?.hi || iq.text?.en || iq.text?.mixed, parsed.terms),
          ...ctxLabels(cls, chapter),
          url: `${urls.importantQuestions(cls, subject)}#${iq.slug}`,
          score: TYPE_WEIGHT.importantQuestion,
        });
      }
    }

    if (want('page') && !classIds) {
      const items = await Page.find(Page.publicFilter(tf)).select('+searchText title slug excerpt').limit(10).lean();
      for (const p of items) {
        results.push({ type: 'page', id: p._id, title: p.title, snippet: snippetOf(p.excerpt?.en || p.searchText, parsed.terms), url: urls.page(p), score: TYPE_WEIGHT.page });
      }
    }
  }

  const total = results.length;
  const size = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const sorted = results.sort((a, b) => b.score - a.score || String(a.url).localeCompare(String(b.url)));
  const slice = sorted.slice((page - 1) * size, page * size).map(({ score, ...rest }) => rest);
  return { query: parsed, results: slice, total, page, pages: Math.ceil(total / size) };
}
