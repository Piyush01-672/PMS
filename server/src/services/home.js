import { cache } from '../lib/cache.js';
import {
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Question,
  Section,
  Subject,
} from '../models/index.js';
import { MEDIA_SELECT, VIDEO_SELECT } from './populate.js';
import { publicClasses } from './site.js';
import { classStats, countsForChapters } from './stats.js';
import { getTerms, term } from './terms.js';
import { urls } from './urls.js';

const vis = (Model, preview, extra = {}) => (preview ? extra : Model.publicFilter(extra));

async function chapterCards(chapterIds, preview, limit) {
  const filter = chapterIds?.length ? { _id: { $in: chapterIds } } : { featured: true };
  const chapters = await Chapter.find(vis(Chapter, preview, filter))
    .select('number title slug shortDescription class subject image sortOrder')
    .populate({ path: 'image', select: MEDIA_SELECT })
    .limit(limit)
    .lean();
  if (chapterIds?.length) {
    const order = new Map(chapterIds.map((id, i) => [String(id), i]));
    chapters.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
  }
  const [classes, subjects, counts, exercises] = await Promise.all([
    ClassLevel.find({ _id: { $in: chapters.map((c) => c.class) } }).select('number name slug').lean(),
    Subject.find({ _id: { $in: chapters.map((c) => c.subject) } }).select('name slug').lean(),
    countsForChapters(chapters.map((c) => c._id), preview),
    Exercise.find(vis(Exercise, preview, { chapter: { $in: chapters.map((c) => c._id) } }))
      .select('chapter number')
      .sort({ sortOrder: 1, number: 1 })
      .lean(),
  ]);
  const clsById = new Map(classes.map((c) => [String(c._id), c]));
  const subById = new Map(subjects.map((s) => [String(s._id), s]));
  return chapters
    .map((ch) => {
      const cls = clsById.get(String(ch.class));
      const subject = subById.get(String(ch.subject));
      if (!cls || !subject) return null;
      const exNumbers = exercises.filter((e) => String(e.chapter) === String(ch._id)).map((e) => e.number);
      return {
        _id: ch._id,
        number: ch.number,
        title: ch.title,
        shortDescription: ch.shortDescription,
        image: ch.image,
        class: { number: cls.number, name: cls.name },
        exerciseCount: counts.exercises[String(ch._id)] || 0,
        questionCount: counts.questions[String(ch._id)] || 0,
        exerciseRange: exNumbers.length ? [exNumbers[0], exNumbers[exNumbers.length - 1]] : null,
        url: urls.chapter(cls, subject, ch),
      };
    })
    .filter(Boolean);
}

async function importantQuestionCards(ids, preview, limit, terms) {
  const filter = ids?.length ? { _id: { $in: ids } } : {};
  const items = await ImportantQuestion.find(vis(ImportantQuestion, preview, filter))
    .select('text slug marks source difficulty class subject chapter')
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  const [classes, subjects, chapters] = await Promise.all([
    ClassLevel.find({ _id: { $in: items.map((i) => i.class) } }).select('number slug').lean(),
    Subject.find({ _id: { $in: items.map((i) => i.subject) } }).select('slug').lean(),
    Chapter.find({ _id: { $in: items.map((i) => i.chapter).filter(Boolean) } }).select('number title').lean(),
  ]);
  const find = (list, id) => list.find((x) => String(x._id) === String(id));
  return items
    .map((iq) => {
      const cls = find(classes, iq.class);
      const subject = find(subjects, iq.subject);
      if (!cls || !subject) return null;
      const chapter = iq.chapter ? find(chapters, iq.chapter) : null;
      return {
        _id: iq._id,
        text: iq.text,
        marks: iq.marks,
        source: iq.source,
        difficulty: iq.difficulty,
        classLabel: term(terms, 'class', cls.number),
        chapter: chapter ? { number: chapter.number, title: chapter.title } : null,
        url: `${urls.importantQuestions(cls, subject)}#${iq.slug}`,
      };
    })
    .filter(Boolean);
}

async function questionCards(ids, preview, terms) {
  if (!ids?.length) return [];
  const questions = await Question.find(vis(Question, preview, { _id: { $in: ids } }))
    .select('number slug text exercise chapter class subject difficulty')
    .lean();
  const cards = [];
  for (const q of questions) {
    const [exercise, chapter, cls, subject] = await Promise.all([
      Exercise.findById(q.exercise).select('number slug').lean(),
      Chapter.findById(q.chapter).select('number slug title').lean(),
      ClassLevel.findById(q.class).select('number slug').lean(),
      Subject.findById(q.subject).select('slug').lean(),
    ]);
    if (!exercise || !chapter || !cls || !subject) continue;
    cards.push({
      _id: q._id,
      text: q.text,
      difficulty: q.difficulty,
      classLabel: term(terms, 'class', cls.number),
      chapter: { number: chapter.number, title: chapter.title },
      exerciseLabel: term(terms, 'exercise', exercise.number),
      questionLabel: term(terms, 'question', q.number),
      url: urls.question(cls, subject, chapter, exercise, q),
    });
  }
  return cards;
}

async function noteCards(ids, preview, limit, terms) {
  const filter = ids?.length ? { _id: { $in: ids } } : {};
  const notes = await Note.find(vis(Note, preview, filter))
    .select('title summary slug class subject chapter tags')
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  const cards = [];
  for (const n of notes) {
    const [cls, subject] = await Promise.all([
      ClassLevel.findById(n.class).select('number slug').lean(),
      Subject.findById(n.subject).select('slug').lean(),
    ]);
    if (!cls || !subject) continue;
    cards.push({ _id: n._id, title: n.title, summary: n.summary, classLabel: term(terms, 'class', cls.number), url: urls.note(cls, subject, n) });
  }
  return cards;
}

async function sectionData(section, preview, terms) {
  const cfg = section.config || {};
  switch (section.type) {
    case 'classGrid': {
      const [classes, stats] = await Promise.all([publicClasses(preview), classStats()]);
      const selected = cfg.classes?.length ? cfg.classes.map((id) => classes.find((c) => String(c._id) === String(id))).filter(Boolean) : classes;
      return {
        classes: selected.map((c) => ({
          ...c,
          stats: {
            chapters: stats.chapters[String(c._id)] || 0,
            exercises: stats.exercises[String(c._id)] || 0,
            questions: stats.questions[String(c._id)] || 0,
          },
        })),
      };
    }
    case 'chapterGrid':
      return { chapters: await chapterCards(cfg.chapters, preview, cfg.limit || 8) };
    case 'questionList':
      return cfg.questions?.length
        ? { questions: await questionCards(cfg.questions, preview, terms) }
        : { importantQuestions: await importantQuestionCards(cfg.importantQuestions, preview, cfg.limit || 6, terms) };
    case 'notes':
      return { notes: await noteCards(cfg.notes, preview, cfg.limit || 6, terms) };
    case 'statistics': {
      if (!cfg.autoStats) return {};
      const filter = (Model) => (preview ? {} : Model.publicFilter());
      const [classes, chapters, exercises, questions] = await Promise.all([
        ClassLevel.countDocuments(filter(ClassLevel)),
        Chapter.countDocuments(filter(Chapter)),
        Exercise.countDocuments(filter(Exercise)),
        Question.countDocuments(filter(Question)),
      ]);
      return { auto: { classes, chapters, exercises, questions } };
    }
    default:
      return {};
  }
}

export async function buildHome(preview = false) {
  const producer = async () => {
    const terms = await getTerms();
    const sections = await Section.find(vis(Section, preview, { page: 'home' }))
      .sort({ sortOrder: 1, createdAt: 1 })
      .populate([
        { path: 'image', select: MEDIA_SELECT },
        { path: 'video', select: VIDEO_SELECT },
        { path: 'items.image', select: MEDIA_SELECT },
        { path: 'config.videos', select: VIDEO_SELECT },
        { path: 'config.gallery', select: MEDIA_SELECT },
      ])
      .lean();

    const out = [];
    for (const section of sections) {
      const { createdBy, updatedBy, ...rest } = section;
      rest.items = (rest.items || []).filter((i) => i.isVisible !== false);
      if (rest.video && rest.video.isVisible === false) rest.video = null;
      if (rest.config?.videos) rest.config.videos = rest.config.videos.filter((v) => v && v.isVisible !== false);
      out.push({ ...rest, data: await sectionData(section, preview, terms) });
    }
    return { sections: out };
  };
  return preview ? producer() : cache.wrap('home', 60_000, producer);
}
