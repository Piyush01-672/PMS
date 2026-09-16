import {
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Page,
  Question,
  RelatedContent,
  Subject,
} from '../models/index.js';
import { term } from './terms.js';
import { urls } from './urls.js';

const vis = (Model, preview, extra = {}) => (preview ? extra : Model.publicFilter(extra));

// Builds a link (title + url) for any relatable document by walking its parents.
async function linkFor(type, id, terms, preview) {
  if (!id) return null;
  const load = async (Model, docId, select) => Model.findOne(vis(Model, preview, { _id: docId })).select(select).lean();

  if (type === 'Page') {
    const page = await load(Page, id, 'title slug');
    return page && { type: 'page', title: page.title, url: urls.page(page) };
  }
  if (type === 'Note') {
    const note = await load(Note, id, 'title slug class subject');
    if (!note) return null;
    const [cls, subject] = await Promise.all([load(ClassLevel, note.class, 'number slug'), load(Subject, note.subject, 'slug')]);
    return cls && subject && { type: 'note', title: note.title, subtitle: term(terms, 'notes'), url: urls.note(cls, subject, note) };
  }
  if (type === 'ImportantQuestion') {
    const iq = await load(ImportantQuestion, id, 'text slug class subject');
    if (!iq) return null;
    const [cls, subject] = await Promise.all([load(ClassLevel, iq.class, 'number slug'), load(Subject, iq.subject, 'slug')]);
    return (
      cls &&
      subject && {
        type: 'importantQuestion',
        title: term(terms, 'importantQuestions'),
        subtitle: term(terms, 'class', cls.number),
        url: `${urls.importantQuestions(cls, subject)}#${iq.slug}`,
      }
    );
  }

  let question;
  let exercise;
  let chapter;
  if (type === 'Question') {
    question = await load(Question, id, 'number slug exercise');
    if (!question) return null;
    exercise = await load(Exercise, question.exercise, 'number slug chapter title');
  } else if (type === 'Exercise') {
    exercise = await load(Exercise, id, 'number slug chapter title');
  }
  if (type === 'Chapter') chapter = await load(Chapter, id, 'number slug title class subject');
  else if (exercise) chapter = await load(Chapter, exercise.chapter, 'number slug title class subject');
  if (!chapter) return null;

  const [cls, subject] = await Promise.all([load(ClassLevel, chapter.class, 'number slug'), load(Subject, chapter.subject, 'slug')]);
  if (!cls || !subject) return null;
  const classLabel = term(terms, 'class', cls.number);
  const chapterLabel = term(terms, 'chapter', chapter.number);

  if (question && exercise) {
    return {
      type: 'question',
      title: term(terms, 'question', question.number),
      subtitle: {
        hi: `${classLabel.hi} · ${chapterLabel.hi} · ${term(terms, 'exercise', exercise.number).hi}`,
        en: `${classLabel.en} · ${chapterLabel.en} · ${term(terms, 'exercise', exercise.number).en}`,
      },
      url: urls.question(cls, subject, chapter, exercise, question),
    };
  }
  if (exercise) {
    return {
      type: 'exercise',
      title: term(terms, 'exercise', exercise.number),
      subtitle: { hi: `${classLabel.hi} · ${chapterLabel.hi}`, en: `${classLabel.en} · ${chapterLabel.en}` },
      url: urls.exercise(cls, subject, chapter, exercise),
    };
  }
  return {
    type: 'chapter',
    title: chapter.title,
    subtitle: { hi: `${classLabel.hi} · ${chapterLabel.hi}`, en: `${classLabel.en} · ${chapterLabel.en}` },
    url: urls.chapter(cls, subject, chapter),
  };
}

async function autoRelated(sourceType, doc, terms, preview) {
  const links = [];
  const add = async (type, id) => {
    const link = await linkFor(type, id, terms, preview);
    if (link) links.push(link);
  };

  if (sourceType === 'Question') {
    const siblings = await Exercise.find(vis(Exercise, preview, { chapter: doc.chapter })).sort({ sortOrder: 1, number: 1 }).select('_id').limit(8).lean();
    for (const s of siblings) await add('Exercise', s._id);
    await add('Chapter', doc.chapter);
  } else if (sourceType === 'Exercise') {
    const siblings = await Exercise.find(vis(Exercise, preview, { chapter: doc.chapter, _id: { $ne: doc._id } }))
      .sort({ sortOrder: 1, number: 1 })
      .select('_id')
      .limit(8)
      .lean();
    for (const s of siblings) await add('Exercise', s._id);
    await add('Chapter', doc.chapter);
    const notes = await Note.find(vis(Note, preview, { chapter: doc.chapter })).select('_id').limit(3).lean();
    for (const n of notes) await add('Note', n._id);
  } else if (sourceType === 'Chapter') {
    const notes = await Note.find(vis(Note, preview, { chapter: doc._id })).select('_id').limit(3).lean();
    for (const n of notes) await add('Note', n._id);
    const others = await Chapter.find(vis(Chapter, preview, { class: doc.class, subject: doc.subject, _id: { $ne: doc._id } }))
      .sort({ sortOrder: 1, number: 1 })
      .select('_id number')
      .lean();
    const nearby = others
      .sort((a, b) => Math.abs(a.number - doc.number) - Math.abs(b.number - doc.number))
      .slice(0, 6)
      .sort((a, b) => a.number - b.number);
    for (const c of nearby) await add('Chapter', c._id);
  } else if (sourceType === 'Note') {
    const others = await Note.find(vis(Note, preview, { class: doc.class, subject: doc.subject, _id: { $ne: doc._id } })).select('_id').limit(6).lean();
    for (const n of others) await add('Note', n._id);
    if (doc.chapter) await add('Chapter', doc.chapter);
  }

  if (doc.tags?.length && sourceType === 'Question') {
    const tagged = await Question.find(vis(Question, preview, { tags: { $in: doc.tags }, _id: { $ne: doc._id }, exercise: { $ne: doc.exercise } }))
      .select('_id')
      .limit(4)
      .lean();
    for (const t of tagged) await add('Question', t._id);
  }
  return links;
}

export async function relatedFor(sourceType, doc, terms, preview = false) {
  const manual = await RelatedContent.findOne({ sourceType, source: doc._id }).lean();
  if (manual && manual.isVisible === false) return [];
  const limit = manual?.limit || 6;
  const links = [];

  for (const item of manual?.items || []) {
    if (item.targetType === 'Url') {
      if (item.url) links.push({ type: 'url', title: item.label, url: item.url });
      continue;
    }
    const link = await linkFor(item.targetType, item.target, terms, preview);
    if (link) links.push(item.label?.en || item.label?.hi ? { ...link, title: item.label } : link);
  }

  if (!manual || manual.autoFill !== false) {
    const seen = new Set(links.map((l) => l.url));
    for (const link of await autoRelated(sourceType, doc, terms, preview)) {
      if (links.length >= limit) break;
      if (!seen.has(link.url)) {
        seen.add(link.url);
        links.push(link);
      }
    }
  }
  return links.slice(0, limit);
}

export { linkFor };
