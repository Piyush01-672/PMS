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
import { stripHtml } from '../lib/sanitize.js';
import { ApiError } from '../middleware/error.js';
import {
  MEDIA_SELECT,
  VIDEO_SELECT,
  blockPopulate,
  cleanAttachments,
  cleanBlocks,
  cleanVideoRef,
  questionPopulate,
} from './populate.js';
import { getPreview } from './previewStore.js';
import { relatedFor } from './related.js';
import { countsForChapters, countsForExercises } from './stats.js';
import { getTerms, pick, term } from './terms.js';
import { urls } from './urls.js';

const vis = (Model, preview, extra = {}) => (preview ? extra : Model.publicFilter(extra));

function applyOverride(doc, override, entityType) {
  if (!doc || !override || override.entityType !== entityType || String(override.id) !== String(doc._id)) return false;
  doc.set(override.data || {});
  return true;
}

function describe(value, fallback = '') {
  const text = stripHtml(pick(value, 'en') || pick(value, 'hi'));
  return (text || fallback).slice(0, 158);
}

function combine(...parts) {
  return {
    hi: parts.map((p) => (typeof p === 'string' ? p : p?.hi || p?.en || '')).filter(Boolean).join(' '),
    en: parts.map((p) => (typeof p === 'string' ? p : p?.en || p?.hi || '')).filter(Boolean).join(' '),
  };
}

function seoFor(doc, { title, description, url, image }) {
  const s = doc?.seo || {};
  return {
    title: s.title || title,
    description: s.description || description,
    canonical: s.canonical || url,
    robots: s.robots || 'index,follow',
    ogTitle: s.ogTitle || s.title || title,
    ogDescription: s.ogDescription || s.description || description,
    ogImage: s.ogImage?.url || image || null,
    h1: s.h1 && (s.h1.hi || s.h1.en) ? s.h1 : null,
  };
}

async function shapeQuestion(question, { preview, override, base }) {
  const q = question.toObject ? question.toObject() : question;
  let solution = null;
  if (override?.entityType === 'Question' && String(override.id) === String(q._id) && override.solution) {
    const draft = new Solution({ question: q._id, ...override.solution });
    await draft.populate(blockPopulate());
    solution = draft.toObject();
  } else {
    solution = await Solution.findOne({ question: q._id }).populate(blockPopulate()).lean();
  }
  return {
    _id: q._id,
    number: q.number,
    slug: q.slug,
    text: q.text,
    languageMode: q.languageMode,
    attachments: cleanAttachments(q.attachments),
    video: q.video?.video ? { video: cleanVideoRef(q.video.video), placement: q.video.placement } : null,
    hint: q.hint,
    answer: q.answer,
    importantPoint: q.importantPoint,
    difficulty: q.difficulty,
    marks: q.marks,
    tags: q.tags,
    isImportant: q.isImportant,
    status: preview ? q.status : undefined,
    solution: solution ? { blocks: cleanBlocks(solution.blocks), languageMode: solution.languageMode } : null,
    url: `${base}/${q.slug}`,
  };
}

async function loadSubjectContext(segments, preview) {
  const cls = await ClassLevel.findOne(vis(ClassLevel, preview, { slug: segments[0] }))
    .populate({ path: 'thumbnail', select: MEDIA_SELECT })
    .populate({ path: 'seo.ogImage', select: MEDIA_SELECT })
    .lean();
  if (!cls) return null;
  const subjects = await Subject.find({
    _id: { $in: cls.subjects },
    ...(preview ? {} : { ...Subject.publicFilter(), isPublic: true }),
  })
    .sort({ sortOrder: 1 })
    .lean();
  return { cls, subjects };
}

/**
 * Resolves any public URL path to structured page data (+ breadcrumbs, related, SEO).
 * Used by the React site and by the server for SEO meta rendering.
 */
export async function resolvePath(pathname, { preview = false, page = 1, limit = 15, previewToken } = {}) {
  const segments = String(pathname || '/')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s).toLowerCase())
    .slice(0, 6);
  const terms = await getTerms();
  const override = preview ? getPreview(previewToken) : null;
  const home = { label: term(terms, 'home'), url: '/' };

  if (segments.length === 0) return { type: 'home' };

  const ctx = await loadSubjectContext(segments, preview);

  // Static pages: /about-us, /privacy-policy, …
  if (!ctx) {
    if (segments.length !== 1) throw new ApiError(404, 'Page not found');
    const pageDoc = await Page.findOne(vis(Page, preview, { slug: segments[0] })).populate({ path: 'seo.ogImage', select: MEDIA_SELECT });
    if (!pageDoc) throw new ApiError(404, 'Page not found');
    applyOverride(pageDoc, override, 'Page');
    const data = pageDoc.toObject();
    const url = urls.page(data);
    return {
      type: 'page',
      data: { page: data },
      breadcrumbs: [home, { label: data.title, url }],
      seo: seoFor(data, { title: pick(data.title), description: describe(data.excerpt, describe(data.content)), url }),
    };
  }

  const { cls, subjects } = ctx;
  const classLabel = term(terms, 'class', cls.number);
  const classCrumb = { label: classLabel, url: urls.class(cls) };

  if (segments.length === 1) {
    if (subjects.length === 1) return { type: 'redirect', redirect: urls.subject(cls, subjects[0]) };
    return {
      type: 'class',
      data: { class: cls, subjects: subjects.map((s) => ({ ...s, url: urls.subject(cls, s) })) },
      breadcrumbs: [home, classCrumb],
      seo: seoFor(cls, { title: pick(cls.name) || classLabel.en, description: describe(cls.description), url: urls.class(cls) }),
    };
  }

  const subject = subjects.find((s) => s.slug === segments[1]);
  if (!subject) throw new ApiError(404, 'Subject not found');
  const subjectUrl = urls.subject(cls, subject);
  const subjectCrumb = { label: subject.name, url: subjectUrl };
  const crumbsBase = subjects.length === 1 ? [home, { label: classLabel, url: subjectUrl }, subjectCrumb] : [home, classCrumb, subjectCrumb];
  const subjectTitle = combine(classLabel, subject.name);
  const scope = { class: cls._id, subject: subject._id };

  const chapterList = async (withExercises) => {
    const chapters = await Chapter.find(vis(Chapter, preview, scope))
      .sort({ sortOrder: 1, number: 1 })
      .select('number title slug shortDescription image status featured')
      .populate({ path: 'image', select: MEDIA_SELECT })
      .lean();
    const counts = await countsForChapters(chapters.map((c) => c._id), preview);
    let exercisesByChapter = new Map();
    if (withExercises) {
      const exercises = await Exercise.find(vis(Exercise, preview, { chapter: { $in: chapters.map((c) => c._id) } }))
        .sort({ sortOrder: 1, number: 1 })
        .select('number title slug chapter status')
        .lean();
      const qCounts = await countsForExercises(exercises.map((e) => e._id), preview);
      exercisesByChapter = exercises.reduce((map, e) => {
        const key = String(e.chapter);
        const ch = chapters.find((c) => String(c._id) === key);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ ...e, questionCount: qCounts[String(e._id)] || 0, url: urls.exercise(cls, subject, ch, e) });
        return map;
      }, new Map());
    }
    return chapters.map((ch) => ({
      ...ch,
      url: urls.chapter(cls, subject, ch),
      exerciseCount: counts.exercises[String(ch._id)] || 0,
      questionCount: counts.questions[String(ch._id)] || 0,
      exercises: withExercises ? exercisesByChapter.get(String(ch._id)) || [] : undefined,
    }));
  };

  if (segments.length === 2) {
    const [chapters, noteCount, importantCount] = await Promise.all([
      chapterList(true),
      Note.countDocuments(vis(Note, preview, scope)),
      ImportantQuestion.countDocuments(vis(ImportantQuestion, preview, scope)),
    ]);
    return {
      type: 'subject',
      data: {
        class: cls,
        subject,
        chapters,
        noteCount,
        importantCount,
        links: {
          exercises: urls.exercises(cls, subject),
          notes: urls.notes(cls, subject),
          importantQuestions: urls.importantQuestions(cls, subject),
        },
      },
      breadcrumbs: crumbsBase,
      seo: seoFor(cls, {
        title: `NCERT Solutions for Class ${cls.number} Maths | ${pick(subjectTitle, 'hi')}`,
        description: describe(cls.description, `Class ${cls.number} Mathematics अध्याय-wise and प्रश्नावली-wise NCERT solutions in Hindi and English.`),
        url: subjectUrl,
        image: cls.thumbnail?.url,
      }),
    };
  }

  const special = segments[2];
  if (special === 'prashnavali' && segments.length === 3) {
    const url = urls.exercises(cls, subject);
    const label = term(terms, 'exerciseWise');
    return {
      type: 'subjectExercises',
      data: { class: cls, subject, chapters: await chapterList(true) },
      breadcrumbs: [...crumbsBase, { label, url }],
      seo: seoFor(null, { title: `Class ${cls.number} Maths ${label.en}`, description: `Class ${cls.number} Maths प्रश्नावली-wise NCERT solutions.`, url }),
    };
  }

  if (special === 'notes') {
    const listUrl = urls.notes(cls, subject);
    const notesCrumb = { label: term(terms, 'notes'), url: listUrl };
    if (segments.length === 3) {
      const notes = await Note.find(vis(Note, preview, scope))
        .sort({ sortOrder: 1, createdAt: -1 })
        .select('title summary slug chapter tags status')
        .populate({ path: 'chapter', select: 'number title slug' })
        .lean();
      return {
        type: 'notesList',
        data: { class: cls, subject, notes: notes.map((n) => ({ ...n, url: urls.note(cls, subject, n) })) },
        breadcrumbs: [...crumbsBase, notesCrumb],
        seo: seoFor(null, { title: `Class ${cls.number} Maths Notes`, description: `Class ${cls.number} Mathematics notes and formulas in Hindi and English.`, url: listUrl }),
      };
    }
    if (segments.length === 4) {
      const note = await Note.findOne(vis(Note, preview, { ...scope, slug: segments[3] })).populate([
        { path: 'attachments.media', select: MEDIA_SELECT },
        { path: 'video', select: VIDEO_SELECT },
        { path: 'chapter', select: 'number title slug' },
        { path: 'seo.ogImage', select: MEDIA_SELECT },
      ]);
      if (!note) throw new ApiError(404, 'Note not found');
      if (applyOverride(note, override, 'Note')) await note.populate([{ path: 'attachments.media', select: MEDIA_SELECT }, { path: 'video', select: VIDEO_SELECT }]);
      const data = note.toObject();
      const url = urls.note(cls, subject, data);
      data.attachments = cleanAttachments(data.attachments);
      data.video = cleanVideoRef(data.video);
      if (data.chapter) data.chapter.url = urls.chapter(cls, subject, data.chapter);
      return {
        type: 'note',
        data: { class: cls, subject, note: data },
        breadcrumbs: [...crumbsBase, notesCrumb, { label: data.title, url }],
        related: await relatedFor('Note', data, terms, preview),
        seo: seoFor(data, { title: `${pick(data.title)} | Class ${cls.number} Maths Notes`, description: describe(data.summary, describe(data.content)), url }),
      };
    }
    throw new ApiError(404, 'Page not found');
  }

  if (special === 'important-questions' && segments.length === 3) {
    const url = urls.importantQuestions(cls, subject);
    const pageSize = Math.min(Math.max(Number(limit) || 15, 1), 50);
    const filter = vis(ImportantQuestion, preview, scope);
    const [items, total] = await Promise.all([
      ImportantQuestion.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate([
          { path: 'attachments.media', select: MEDIA_SELECT },
          ...blockPopulate(),
          { path: 'chapter', select: 'number title slug' },
        ])
        .lean(),
      ImportantQuestion.countDocuments(filter),
    ]);
    const label = term(terms, 'importantQuestions');
    return {
      type: 'importantQuestions',
      data: {
        class: cls,
        subject,
        items: items.map((iq) => ({
          ...iq,
          attachments: cleanAttachments(iq.attachments),
          blocks: cleanBlocks(iq.blocks),
          chapter: iq.chapter ? { ...iq.chapter, url: urls.chapter(cls, subject, iq.chapter) } : null,
        })),
        pagination: { page, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
      },
      breadcrumbs: [...crumbsBase, { label, url }],
      seo: seoFor(null, { title: `Class ${cls.number} Maths ${label.en}`, description: `Class ${cls.number} Mathematics important questions with step-by-step solutions.`, url }),
    };
  }

  // Chapter → Exercise → Question
  const chapter = await Chapter.findOne(vis(Chapter, preview, { ...scope, slug: segments[2] })).populate([
    { path: 'image', select: MEDIA_SELECT },
    { path: 'featuredImage', select: MEDIA_SELECT },
    { path: 'introVideo', select: VIDEO_SELECT },
    { path: 'seo.ogImage', select: MEDIA_SELECT },
  ]);
  if (!chapter) throw new ApiError(404, 'अध्याय not found');
  if (segments.length === 3 && applyOverride(chapter, override, 'Chapter')) {
    await chapter.populate([
      { path: 'image', select: MEDIA_SELECT },
      { path: 'featuredImage', select: MEDIA_SELECT },
      { path: 'introVideo', select: VIDEO_SELECT },
    ]);
  }
  const ch = chapter.toObject();
  const chapterUrl = urls.chapter(cls, subject, ch);
  const chapterLabel = term(terms, 'chapter', ch.number);
  const chapterCrumb = { label: chapterLabel, url: chapterUrl };

  if (segments.length === 3) {
    const [exercises, notes, importantQuestions] = await Promise.all([
      Exercise.find(vis(Exercise, preview, { chapter: ch._id })).sort({ sortOrder: 1, number: 1 }).select('number title slug description status').lean(),
      Note.find(vis(Note, preview, { chapter: ch._id })).select('title summary slug').lean(),
      ImportantQuestion.countDocuments(vis(ImportantQuestion, preview, { chapter: ch._id })),
    ]);
    const qCounts = await countsForExercises(exercises.map((e) => e._id), preview);
    const siblings = await Chapter.find(vis(Chapter, preview, scope)).sort({ sortOrder: 1, number: 1 }).select('number title slug').lean();
    const index = siblings.findIndex((s) => String(s._id) === String(ch._id));
    const nav = (s) => s && { label: term(terms, 'chapter', s.number), title: s.title, url: urls.chapter(cls, subject, s) };
    return {
      type: 'chapter',
      data: {
        class: cls,
        subject,
        chapter: { ...ch, introVideo: cleanVideoRef(ch.introVideo), url: chapterUrl },
        exercises: exercises.map((e) => ({ ...e, questionCount: qCounts[String(e._id)] || 0, url: urls.exercise(cls, subject, ch, e) })),
        notes: notes.map((n) => ({ ...n, url: urls.note(cls, subject, n) })),
        importantCount: importantQuestions,
        links: { importantQuestions: urls.importantQuestions(cls, subject), notes: urls.notes(cls, subject) },
        prev: nav(siblings[index - 1]),
        next: nav(siblings[index + 1]),
      },
      breadcrumbs: [...crumbsBase, chapterCrumb],
      related: await relatedFor('Chapter', ch, terms, preview),
      seo: seoFor(ch, {
        title: `Class ${cls.number} Maths ${chapterLabel.hi} – ${pick(ch.title, 'hi')} (${pick(ch.title, 'en')})`,
        description: describe(ch.shortDescription, `Class ${cls.number} Maths ${chapterLabel.hi} NCERT solutions, प्रश्नावली-wise step-by-step हल.`),
        url: chapterUrl,
        image: ch.featuredImage?.url || ch.image?.url,
      }),
    };
  }

  const exercise = await Exercise.findOne(vis(Exercise, preview, { chapter: ch._id, slug: segments[3] })).populate([
    { path: 'introVideo', select: VIDEO_SELECT },
    { path: 'seo.ogImage', select: MEDIA_SELECT },
  ]);
  if (!exercise) throw new ApiError(404, 'प्रश्नावली not found');
  if (segments.length === 4 && applyOverride(exercise, override, 'Exercise')) await exercise.populate({ path: 'introVideo', select: VIDEO_SELECT });
  const ex = exercise.toObject();
  const exerciseUrl = urls.exercise(cls, subject, ch, ex);
  const exerciseLabel = term(terms, 'exercise', ex.number);
  const exerciseCrumb = { label: exerciseLabel, url: exerciseUrl };
  const titlePrefix = `Class ${cls.number} Maths ${chapterLabel.hi} ${exerciseLabel.hi}`;

  const siblingExercises = await Exercise.find(vis(Exercise, preview, { chapter: ch._id })).sort({ sortOrder: 1, number: 1 }).select('number slug title').lean();
  const exIndex = siblingExercises.findIndex((s) => String(s._id) === String(ex._id));
  const exNav = (s) => s && { label: term(terms, 'exercise', s.number), url: urls.exercise(cls, subject, ch, s) };

  if (segments.length === 4) {
    const pageSize = Math.min(Math.max(Number(limit) || 15, 1), 50);
    const filter = vis(Question, preview, { exercise: ex._id });
    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ sortOrder: 1, createdAt: 1 }).skip((page - 1) * pageSize).limit(pageSize).populate(questionPopulate).lean(),
      Question.countDocuments(filter),
    ]);
    const shaped = [];
    for (const q of questions) shaped.push(await shapeQuestion(q, { preview, base: exerciseUrl }));
    return {
      type: 'exercise',
      data: {
        class: cls,
        subject,
        chapter: { _id: ch._id, number: ch.number, title: ch.title, slug: ch.slug, url: chapterUrl },
        exercise: { ...ex, introVideo: cleanVideoRef(ex.introVideo), url: exerciseUrl },
        questions: shaped,
        pagination: { page, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
        siblings: siblingExercises.map((s) => ({ _id: s._id, label: term(terms, 'exercise', s.number), url: urls.exercise(cls, subject, ch, s) })),
        prev: exNav(siblingExercises[exIndex - 1]),
        next: exNav(siblingExercises[exIndex + 1]),
      },
      breadcrumbs: [...crumbsBase, chapterCrumb, exerciseCrumb],
      related: await relatedFor('Exercise', ex, terms, preview),
      seo: seoFor(ex, {
        title: `${titlePrefix} NCERT Solutions (${pick(ch.title, 'en')})`,
        description: describe(ex.description, `${titlePrefix} के सभी प्रश्नों के step-by-step हल – Hindi & English medium.`),
        url: exerciseUrl,
      }),
      faq: shaped.slice(0, 10).map((q) => ({ question: describe(q.text), answer: describe(q.answer) })).filter((f) => f.question && f.answer),
    };
  }

  if (segments.length === 5) {
    const question = await Question.findOne(vis(Question, preview, { exercise: ex._id, slug: segments[4] })).populate([
      ...questionPopulate,
      { path: 'seo.ogImage', select: MEDIA_SELECT },
    ]);
    if (!question) throw new ApiError(404, 'Question not found');
    if (applyOverride(question, override, 'Question')) await question.populate(questionPopulate);
    const shaped = await shapeQuestion(question, { preview, override, base: exerciseUrl });
    const siblings = await Question.find(vis(Question, preview, { exercise: ex._id })).sort({ sortOrder: 1, createdAt: 1 }).select('number slug').lean();
    const qIndex = siblings.findIndex((s) => String(s._id) === String(question._id));
    const qNav = (s) => s && { label: term(terms, 'question', s.number), url: `${exerciseUrl}/${s.slug}` };
    const questionLabel = term(terms, 'question', shaped.number);
    const q = question.toObject();
    return {
      type: 'question',
      data: {
        class: cls,
        subject,
        chapter: { _id: ch._id, number: ch.number, title: ch.title, slug: ch.slug, url: chapterUrl },
        exercise: { _id: ex._id, number: ex.number, title: ex.title, slug: ex.slug, url: exerciseUrl },
        question: shaped,
        prev: qNav(siblings[qIndex - 1]),
        next: qNav(siblings[qIndex + 1]),
      },
      breadcrumbs: [...crumbsBase, chapterCrumb, exerciseCrumb, { label: questionLabel, url: shaped.url }],
      related: await relatedFor('Question', q, terms, preview),
      seo: seoFor(q, {
        title: `${titlePrefix} ${questionLabel.hi} Solution`,
        description: describe(shaped.text, `${titlePrefix} ${questionLabel.hi} का step-by-step हल.`),
        url: shaped.url,
        image: shaped.attachments[0]?.media?.url,
      }),
      faq: [{ question: describe(shaped.text), answer: describe(shaped.answer) }].filter((f) => f.question && f.answer),
    };
  }

  throw new ApiError(404, 'Page not found');
}
