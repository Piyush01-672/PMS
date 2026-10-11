import {
  Book,
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Page,
  Question,
  Resource,
  Solution,
  Subject,
  Topic,
} from '../models/index.js';
import { stripHtml } from '../lib/sanitize.js';
import { ApiError } from '../middleware/error.js';
import {
  BOOK_SELECT,
  MEDIA_SELECT,
  RESOURCE_SELECT,
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

async function shapeTopic(topic, { cls, subject, ch, preview, override, terms, baseCrumbs }) {
  const tp = topic.toObject ? topic.toObject() : topic;
  const topicUrl = urls.topic(cls, subject, ch, tp);
  const chapterUrl = urls.chapter(cls, subject, ch);
  const chapterLabel = term(terms, 'chapter', ch.number);

  // Fetch topic-specific or chapter-level resources and books
  const [resources, books, siblingTopics, exercises] = await Promise.all([
    Resource.find(vis(Resource, preview, { $or: [{ topic: tp._id }, { chapter: ch._id }] }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate([
        { path: 'file', select: MEDIA_SELECT },
        { path: 'thumbnail', select: MEDIA_SELECT },
      ])
      .lean(),
    Book.find(vis(Book, preview, { $or: [{ topic: tp._id }, { chapter: ch._id }, { class: cls._id }] }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate({ path: 'coverImage', select: MEDIA_SELECT })
      .lean(),
    Topic.find(vis(Topic, preview, { chapter: ch._id }))
      .sort({ sortOrder: 1, number: 1 })
      .select('number title slug difficulty estimatedTime shortDescription')
      .lean(),
    Exercise.find(vis(Exercise, preview, { chapter: ch._id }))
      .sort({ sortOrder: 1, number: 1 })
      .select('number title slug')
      .lean(),
  ]);

  const tpIndex = siblingTopics.findIndex((s) => String(s._id) === String(tp._id));
  const prev = tpIndex > 0 ? { ...siblingTopics[tpIndex - 1], label: `Topic ${siblingTopics[tpIndex - 1].number}`, url: urls.topic(cls, subject, ch, siblingTopics[tpIndex - 1]) } : null;
  const next = tpIndex < siblingTopics.length - 1 ? { ...siblingTopics[tpIndex + 1], label: `Topic ${siblingTopics[tpIndex + 1].number}`, url: urls.topic(cls, subject, ch, siblingTopics[tpIndex + 1]) } : null;

  return {
    type: 'topic',
    data: {
      class: cls,
      subject,
      chapter: { _id: ch._id, number: ch.number, title: ch.title, slug: ch.slug, url: chapterUrl },
      topic: {
        ...tp,
        url: topicUrl,
        video: cleanVideoRef(tp.video),
        videos: (tp.videos || []).map(cleanVideoRef).filter(Boolean),
        attachments: cleanAttachments(tp.attachments),
      },
      resources: resources.map((r) => ({
        ...r,
        fileUrl: r.file?.url || r.fileUrl || '',
        fileSize: r.fileSize || (r.file?.bytes ? `${(r.file.bytes / (1024 * 1024)).toFixed(1)} MB` : ''),
        thumbnailUrl: r.thumbnail?.url || '',
      })),
      books: books.map((b) => ({
        ...b,
        coverUrl: b.coverImage?.url || b.coverUrl || '',
      })),
      siblings: siblingTopics.map((s) => ({ ...s, url: urls.topic(cls, subject, ch, s) })),
      exercises: exercises.map((e) => ({ ...e, url: urls.exercise(cls, subject, ch, e) })),
      prev,
      next,
    },
    breadcrumbs: [...baseCrumbs, { label: chapterLabel, url: chapterUrl }, { label: tp.title, url: topicUrl }],
    related: await relatedFor('Topic', tp, terms, preview),
    seo: seoFor(tp, {
      title: `${pick(tp.title, 'hi')} (${pick(tp.title, 'en')}) | Class ${cls.number} Maths ${chapterLabel.hi}`,
      description: describe(tp.shortDescription, describe(tp.notes, `Class ${cls.number} Maths ${chapterLabel.hi} ${pick(tp.title, 'en')} – Video lessons, study notes, formula sheet and practice questions.`)),
      url: topicUrl,
      image: tp.featuredImage?.url || tp.image?.url || ch.featuredImage?.url,
    }),
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

export const STUDY_MATERIAL_CATEGORIES = [
  {
    slug: 'ncert-solutions',
    type: 'ncert-solutions',
    name: { hi: 'NCERT समाधान', en: 'NCERT Solutions' },
    shortDesc: {
      hi: 'कक्षा 6 से 12 तक अध्याय-वार व प्रश्नावली-वार NCERT गणित के विस्तृत हल (Hindi & English medium)।',
      en: 'Complete chapter-wise and exercise-wise step-by-step NCERT Mathematics solutions.',
    },
    icon: 'CheckCircle2',
  },
  {
    slug: 'ncert-books',
    type: 'ncert_books',
    name: { hi: 'NCERT पुस्तकें', en: 'NCERT Books' },
    shortDesc: {
      hi: 'सत्र 2024-25 व 2025-26 की आधिकारिक NCERT गणित पाठ्यपुस्तकें और अध्याय-वार पीडीएफ डाउनलोड।',
      en: 'Download latest NCERT Mathematics textbooks chapter-wise PDF for Classes 6 to 12.',
    },
    icon: 'BookOpen',
  },
  {
    slug: 'ncert-notes',
    type: 'ncert_notes',
    name: { hi: 'NCERT नोट्स व सूत्र', en: 'NCERT Notes & Formulas' },
    shortDesc: {
      hi: 'प्रत्येक अध्याय के मुख्य सूत्र, प्रमेय, परिभाषाएं और त्वरित पुनरीक्षण नोट्स।',
      en: 'Chapter-wise revision notes, formula sheets, and key concept summaries.',
    },
    icon: 'FileText',
  },
  {
    slug: 'cbse-sample-papers',
    type: 'cbse_sample_papers',
    name: { hi: 'CBSE सैंपल पेपर्स व PYQ', en: 'CBSE Sample Papers' },
    shortDesc: {
      hi: 'सीबीएसई बोर्ड परीक्षा के नवीनतम मॉडल प्रश्नपत्र और पिछले वर्षों के हल प्रश्नपत्र।',
      en: 'Official CBSE sample question papers with marking schemes and previous years papers.',
    },
    icon: 'FileSpreadsheet',
  },
  {
    slug: 'extra-questions',
    type: 'extra_questions',
    name: { hi: 'अतिरिक्त अभ्यास प्रश्न', en: 'Extra Practice Questions' },
    shortDesc: {
      hi: 'परीक्षा तैयारी और अवधारणा सुदृढ़ीकरण हेतु अतिरिक्त अभ्यास प्रश्न और हल।',
      en: 'Extra practice questions with step-by-step solutions for deep mathematical clarity.',
    },
    icon: 'HelpCircle',
  },
  {
    slug: 'important-questions',
    type: 'important_questions',
    name: { hi: 'महत्वपूर्ण प्रश्न (बोर्ड)', en: 'Important Questions' },
    shortDesc: {
      hi: 'बोर्ड परीक्षा में बार-बार पूछे जाने वाले उच्च अंक वाले प्रश्न और मॉडल हल।',
      en: 'Most repeated and high-scoring board questions with complete step-by-step solutions.',
    },
    icon: 'Sparkles',
  },
  {
    slug: 'english-summaries',
    type: 'english_summaries',
    name: { hi: 'अंग्रेजी / कॉन्सेप्ट सारांश', en: 'English & Concept Summaries' },
    shortDesc: {
      hi: 'प्रत्येक अध्याय के प्रमुख सिद्धांतों और शब्दावली का द्विभाषी सारांश।',
      en: 'Quick chapter summaries, theorem definitions, and proof guides in English and Hindi.',
    },
    icon: 'AlignLeft',
  },
  {
    slug: 'syllabus',
    type: 'syllabus',
    name: { hi: 'पाठ्यक्रम (CBSE Syllabus)', en: 'CBSE Syllabus' },
    shortDesc: {
      hi: 'नवीनतम सीबीएसई गणित पाठ्यक्रम, हटाए गए विषय और इकाई-वार अंक विभाजन।',
      en: 'Updated CBSE Mathematics syllabus, deleted syllabus details, and unit-wise marks distribution.',
    },
    icon: 'GraduationCap',
  },
];

export const CANONICAL_REFERENCE_BOOKS = [
  {
    slug: 'rs-aggarwal',
    title: { hi: 'आर.एस. अग्रवाल समाधान', en: 'RS Aggarwal Solutions' },
    author: 'R.S. Aggarwal',
    publisher: 'Bharati Bhawan',
    category: 'reference',
    description: {
      hi: 'सीबीएसई कक्षा 6 से 12 के लिए आर.एस. अग्रवाल गणित के अध्याय-वार और प्रश्नावली-वार विस्तृत हल।',
      en: 'Complete chapter-wise and exercise-wise step-by-step solutions for RS Aggarwal Mathematics Classes 6 to 12.',
    },
    classes: [6, 7, 8, 9, 10, 11, 12],
    featured: true,
  },
  {
    slug: 'rd-sharma',
    title: { hi: 'आर.डी. शर्मा समाधान', en: 'RD Sharma Solutions' },
    author: 'Dr. R.D. Sharma',
    publisher: 'Dhanpat Rai Publications',
    category: 'reference',
    description: {
      hi: 'सीबीएसई बोर्ड परीक्षा और प्रतियोगी परीक्षाओं के लिए आर.डी. शर्मा गणित के संपूर्ण हल।',
      en: 'Comprehensive RD Sharma Mathematics solutions with all question steps, formulas, and proofs.',
    },
    classes: [6, 7, 8, 9, 10, 11, 12],
    featured: true,
  },
  {
    slug: 'ml-aggarwal',
    title: { hi: 'एम.एल. अग्रवाल समाधान', en: 'ML Aggarwal Solutions' },
    author: 'M.L. Aggarwal',
    publisher: 'Arya Publications',
    category: 'reference',
    description: {
      hi: 'आईसीएसई / सीबीएसई गणित के लिए एम.एल. अग्रवाल अंडरस्टैंडिंग मैथमेटिक्स के हल।',
      en: 'Step-by-step solutions for ML Aggarwal Understanding Mathematics for middle and secondary classes.',
    },
    classes: [6, 7, 8, 9, 10, 11, 12],
    featured: true,
  },
];

function formatResource(r) {
  if (!r) return null;
  return {
    ...r,
    fileUrl: r.file?.url || r.fileUrl || '',
    fileSize: r.fileSize || (r.file?.bytes ? `${(r.file.bytes / (1024 * 1024)).toFixed(1)} MB` : ''),
    thumbnailUrl: r.thumbnail?.url || '',
    externalUrl: r.externalUrl || '',
    videoUrl: r.videoUrl || '',
  };
}

async function findClassBySegment(segment, preview) {
  if (!segment) return null;
  const numMatch = segment.match(/\d+/);
  const num = numMatch ? Number(numMatch[0]) : null;
  const filter = num !== null ? { $or: [{ slug: segment }, { number: num }] } : { slug: segment };
  return ClassLevel.findOne(vis(ClassLevel, preview, filter))
    .populate({ path: 'thumbnail', select: MEDIA_SELECT })
    .populate({ path: 'subjects', select: 'name slug isPublic' })
    .lean();
}

async function resolveStudyMaterialsPath(segments, { preview, page, limit, terms, home }) {
  const smCrumb = { label: { hi: 'अध्ययन सामग्री', en: 'Study Materials' }, url: urls.studyMaterials() };
  const classes = await ClassLevel.find(vis(ClassLevel, preview))
    .sort({ number: -1 })
    .select('number name slug')
    .lean();

  // 1. Hub page: /study-materials
  if (segments.length === 1) {
    const featuredResources = await Resource.find(vis(Resource, preview, { featured: true }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(8)
      .populate([
        { path: 'class', select: 'number name slug' },
        { path: 'chapter', select: 'number title slug' },
        { path: 'file', select: MEDIA_SELECT },
        { path: 'thumbnail', select: MEDIA_SELECT },
      ])
      .lean();

    return {
      type: 'studyMaterials',
      data: {
        level: 'hub',
        categories: STUDY_MATERIAL_CATEGORIES,
        classes: classes.map((c) => ({ ...c, url: urls.class(c) })),
        featuredResources: featuredResources.map(formatResource),
      },
      breadcrumbs: [home, smCrumb],
      seo: {
        title: 'Study Materials & Reference Solutions for Classes 6 to 12 | Passion Maths Study',
        description: 'Download NCERT Solutions, NCERT Books, Notes, CBSE Sample Papers, Extra Questions, and Syllabus for Classes 6, 7, 8, 9, 10, 11, and 12.',
        canonical: urls.studyMaterials(),
      },
    };
  }

  const categorySlug = segments[1];
  const cat = STUDY_MATERIAL_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) throw new ApiError(404, 'Study material category not found');

  const catCrumb = { label: cat.name, url: urls.studyMaterialCategory(cat.slug) };
  const categoryTypes = [cat.type];
  if (cat.type === 'ncert_notes') categoryTypes.push('notes', 'formula_sheet', 'revision');
  if (cat.type === 'cbse_sample_papers') categoryTypes.push('sample_paper', 'previous_year_paper', 'practice_paper');
  if (cat.type === 'extra_questions') categoryTypes.push('question_bank', 'worksheet', 'assignment');
  if (cat.type === 'important_questions') categoryTypes.push('important_questions');
  if (cat.type === 'ncert_books') categoryTypes.push('ncert_books', 'other');

  // 2. Category list across classes: /study-materials/:categorySlug
  if (segments.length === 2) {
    const resources = await Resource.find(vis(Resource, preview, { resourceType: { $in: categoryTypes } }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate([
        { path: 'class', select: 'number name slug' },
        { path: 'chapter', select: 'number title slug' },
        { path: 'file', select: MEDIA_SELECT },
        { path: 'thumbnail', select: MEDIA_SELECT },
      ])
      .lean();

    return {
      type: 'studyMaterials',
      data: {
        level: 'category',
        category: cat,
        classes: classes.map((c) => ({ ...c, url: urls.studyMaterialCategoryClass(cat.slug, c) })),
        resources: resources.map(formatResource),
        categories: STUDY_MATERIAL_CATEGORIES,
      },
      breadcrumbs: [home, smCrumb, catCrumb],
      seo: {
        title: `${pick(cat.name, 'en')} for Classes 6 to 12 Maths | Passion Maths Study`,
        description: describe(cat.shortDesc, `Download ${pick(cat.name, 'en')} for Classes 6 to 12 Mathematics in Hindi and English medium.`),
        canonical: urls.studyMaterialCategory(cat.slug),
      },
    };
  }

  // 3. Class-specific category page: /study-materials/:categorySlug/class-:number
  if (segments.length === 3) {
    const cls = await findClassBySegment(segments[2], preview);
    if (!cls) throw new ApiError(404, 'Class not found');

    const [chapters, resources, notes] = await Promise.all([
      Chapter.find(vis(Chapter, preview, { class: cls._id, book: null }))
        .sort({ sortOrder: 1, number: 1 })
        .select('number title slug shortDescription image pdfFile pdfUrl')
        .populate([
          { path: 'image', select: MEDIA_SELECT },
          { path: 'pdfFile', select: MEDIA_SELECT },
        ])
        .lean(),
      Resource.find(vis(Resource, preview, { class: cls._id, resourceType: { $in: categoryTypes } }))
        .sort({ sortOrder: 1, createdAt: -1 })
        .populate([
          { path: 'chapter', select: 'number title slug' },
          { path: 'file', select: MEDIA_SELECT },
          { path: 'thumbnail', select: MEDIA_SELECT },
        ])
        .lean(),
      Note.find(vis(Note, preview, { class: cls._id }))
        .sort({ sortOrder: 1, createdAt: -1 })
        .select('title summary slug chapter')
        .populate({ path: 'chapter', select: 'number title slug' })
        .lean(),
    ]);

    const classCrumb = { label: { hi: `कक्षा ${cls.number}`, en: `Class ${cls.number}` }, url: urls.studyMaterialCategoryClass(cat.slug, cls) };

    return {
      type: 'studyMaterials',
      data: {
        level: 'categoryClass',
        category: cat,
        class: cls,
        chapters,
        resources: resources.map(formatResource),
        notes,
        classes: classes.map((c) => ({ ...c, url: urls.studyMaterialCategoryClass(cat.slug, c) })),
        categories: STUDY_MATERIAL_CATEGORIES,
      },
      breadcrumbs: [home, smCrumb, catCrumb, classCrumb],
      seo: {
        title: `Class ${cls.number} Maths ${pick(cat.name, 'en')} | Free PDF & Solutions`,
        description: describe(cat.shortDesc, `Class ${cls.number} Mathematics ${pick(cat.name, 'en')} – Chapter-wise PDF download, solutions, and key revision notes.`),
        canonical: urls.studyMaterialCategoryClass(cat.slug, cls),
      },
    };
  }

  throw new ApiError(404, 'Page not found');
}

async function resolveReferenceSolutionsPath(segments, { preview, page, limit, previewToken, override, terms, home }) {
  const refCrumb = { label: { hi: 'संदर्भ समाधान', en: 'Reference Solutions' }, url: urls.referenceSolutions() };

  // Load registered reference books from DB + canonical list
  const dbBooks = await Book.find(vis(Book, preview, { category: 'reference' }))
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate({ path: 'coverImage', select: MEDIA_SELECT })
    .lean();

  const allBooksMap = new Map();
  for (const b of CANONICAL_REFERENCE_BOOKS) allBooksMap.set(b.slug, { ...b, url: urls.referenceBook(b) });
  for (const b of dbBooks) {
    if (b.slug) allBooksMap.set(b.slug, { ...b, url: urls.referenceBook(b) });
  }
  const allBooks = Array.from(allBooksMap.values());

  const classes = await ClassLevel.find(vis(ClassLevel, preview))
    .sort({ number: -1 })
    .select('number name slug')
    .lean();

  // 1. Hub: /reference-solutions
  if (segments.length === 1) {
    return {
      type: 'referenceSolutions',
      data: {
        level: 'hub',
        books: allBooks,
        classes: classes.map((c) => ({ ...c, url: urls.class(c) })),
      },
      breadcrumbs: [home, refCrumb],
      seo: {
        title: 'Reference Book Solutions: RS Aggarwal, RD Sharma & ML Aggarwal Maths | Passion Maths Study',
        description: 'Free step-by-step solutions for RS Aggarwal, RD Sharma, and ML Aggarwal Mathematics for Classes 6 to 12.',
        canonical: urls.referenceSolutions(),
      },
    };
  }

  const bookSlug = segments[1];
  const book = allBooksMap.get(bookSlug) || {
    slug: bookSlug,
    title: { hi: `${bookSlug.toUpperCase()} समाधान`, en: `${bookSlug.toUpperCase()} Solutions` },
    author: bookSlug.replace(/-/g, ' ').toUpperCase(),
    url: urls.referenceBook(bookSlug),
  };
  const bookCrumb = { label: book.title, url: urls.referenceBook(book) };

  // 2. Book Hub: /reference-solutions/:bookSlug
  if (segments.length === 2) {
    return {
      type: 'referenceSolutions',
      data: {
        level: 'book',
        book,
        classes: classes.map((c) => ({ ...c, url: urls.referenceBookClass(book, c) })),
        books: allBooks,
      },
      breadcrumbs: [home, refCrumb, bookCrumb],
      seo: {
        title: `${pick(book.title, 'en')} for Classes 6 to 12 Maths | Passion Maths Study`,
        description: describe(book.description, `Chapter-wise and exercise-wise solutions for ${pick(book.title, 'en')}.`),
        canonical: urls.referenceBook(book),
      },
    };
  }

  // 3. Book Class page: /reference-solutions/:bookSlug/class-:number
  const cls = await findClassBySegment(segments[2], preview);
  if (!cls) throw new ApiError(404, 'Class not found');
  const classCrumb = { label: { hi: `कक्षा ${cls.number}`, en: `Class ${cls.number}` }, url: urls.referenceBookClass(book, cls) };

  const dbBookDoc = dbBooks.find((b) => b.slug === bookSlug);
  const bookFilter = dbBookDoc ? { $or: [{ book: dbBookDoc._id }, { book: null }] } : { book: null };

  const rawChapters = await Chapter.find(vis(Chapter, preview, { class: cls._id, ...bookFilter }))
    .sort({ sortOrder: 1, number: 1 })
    .select('number title slug shortDescription image pdfFile pdfUrl')
    .populate([
      { path: 'image', select: MEDIA_SELECT },
      { path: 'pdfFile', select: MEDIA_SELECT },
    ])
    .lean();

  const chapterIds = rawChapters.map((c) => c._id);
  const rawExercises = await Exercise.find(vis(Exercise, preview, { chapter: { $in: chapterIds } }))
    .sort({ sortOrder: 1, number: 1 })
    .select('number title slug chapter pdfFile pdfUrl')
    .populate({ path: 'pdfFile', select: MEDIA_SELECT })
    .lean();

  const exercisesByChapter = new Map();
  for (const ex of rawExercises) {
    const key = String(ex.chapter);
    if (!exercisesByChapter.has(key)) exercisesByChapter.set(key, []);
    exercisesByChapter.get(key).push({
      ...ex,
      url: urls.referenceExercise(book, cls, rawChapters.find((c) => String(c._id) === key) || {}, ex),
    });
  }

  const chapters = rawChapters.map((ch) => ({
    ...ch,
    url: urls.referenceChapter(book, cls, ch),
    exercises: exercisesByChapter.get(String(ch._id)) || [
      { number: `${ch.number}A`, slug: `exercise-${ch.number}a`, url: `${urls.referenceChapter(book, cls, ch)}/exercise-${ch.number}a` },
      { number: `${ch.number}B`, slug: `exercise-${ch.number}b`, url: `${urls.referenceChapter(book, cls, ch)}/exercise-${ch.number}b` },
    ],
  }));

  if (segments.length === 3) {
    return {
      type: 'referenceSolutions',
      data: {
        level: 'class',
        book,
        class: cls,
        chapters,
        books: allBooks,
        classes: classes.map((c) => ({ ...c, url: urls.referenceBookClass(book, c) })),
      },
      breadcrumbs: [home, refCrumb, bookCrumb, classCrumb],
      seo: {
        title: `${pick(book.title, 'en')} Class ${cls.number} Maths Solutions | Chapter-wise`,
        description: `Complete solutions for ${pick(book.title, 'en')} Class ${cls.number} Mathematics chapters and exercises with step-by-step explanations.`,
        canonical: urls.referenceBookClass(book, cls),
      },
    };
  }

  // 4. Chapter page: /reference-solutions/:bookSlug/class-:number/:chapterSlug
  const chapterSegment = segments[3];
  const numMatch = chapterSegment.match(/\d+/);
  const chNum = numMatch ? Number(numMatch[0]) : null;
  const chapter = chapters.find((c) => c.slug === chapterSegment || (chNum !== null && c.number === chNum));
  if (!chapter) throw new ApiError(404, 'Chapter not found');

  const chapterCrumb = { label: chapter.title, url: urls.referenceChapter(book, cls, chapter) };
  const chapterExercises = chapter.exercises || [];

  const [resources, siblingChapters] = await Promise.all([
    Resource.find(vis(Resource, preview, { class: cls._id, $or: [{ chapter: chapter._id }, { resourceType: 'solution' }] }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate([
        { path: 'file', select: MEDIA_SELECT },
        { path: 'thumbnail', select: MEDIA_SELECT },
      ])
      .lean(),
    chapters,
  ]);

  const chIndex = siblingChapters.findIndex((c) => String(c._id) === String(chapter._id));
  const prevChapter = chIndex > 0 ? siblingChapters[chIndex - 1] : null;
  const nextChapter = chIndex < siblingChapters.length - 1 ? siblingChapters[chIndex + 1] : null;

  if (segments.length === 4) {
    return {
      type: 'referenceSolutions',
      data: {
        level: 'chapter',
        book,
        class: cls,
        chapter,
        exercises: chapterExercises,
        resources: resources.map(formatResource),
        siblingChapters,
        prev: prevChapter ? { label: prevChapter.title, url: urls.referenceChapter(book, cls, prevChapter) } : null,
        next: nextChapter ? { label: nextChapter.title, url: urls.referenceChapter(book, cls, nextChapter) } : null,
      },
      breadcrumbs: [home, refCrumb, bookCrumb, classCrumb, chapterCrumb],
      seo: {
        title: `${pick(book.title, 'en')} Class ${cls.number} Chapter ${chapter.number} Solutions | ${pick(chapter.title, 'en')}`,
        description: `Download and view ${pick(book.title, 'en')} Class ${cls.number} Chapter ${chapter.number} (${pick(chapter.title, 'en')}) exercise solutions, PDF notes, and formula sheets.`,
        canonical: urls.referenceChapter(book, cls, chapter),
      },
    };
  }

  // 5. Exercise page: /reference-solutions/:bookSlug/class-:number/:chapterSlug/:exerciseSlug
  const exerciseSegment = segments[4];
  const exClean = exerciseSegment.replace(/^(exercise|prashnavali)-?/i, '');
  let exercise = await Exercise.findOne(vis(Exercise, preview, {
    chapter: chapter._id,
    $or: [{ slug: exerciseSegment }, { number: exClean }, { number: exerciseSegment }, { slug: `exercise-${exClean}` }],
  }))
    .populate([
      { path: 'introVideo', select: VIDEO_SELECT },
      { path: 'pdfFile', select: MEDIA_SELECT },
    ])
    .lean();

  if (!exercise) {
    exercise = {
      _id: `ref-${bookSlug}-${cls.number}-${chapter.number}-${exClean}`,
      number: exClean.toUpperCase(),
      slug: exerciseSegment,
      title: { hi: `अभ्यास ${exClean.toUpperCase()}`, en: `Exercise ${exClean.toUpperCase()}` },
      description: { hi: `${pick(book.title, 'hi')} अध्याय ${chapter.number} का अभ्यास हल`, en: `${pick(book.title, 'en')} Chapter ${chapter.number} Exercise Solutions` },
    };
  }

  const exerciseCrumb = { label: { hi: `अभ्यास ${exercise.number}`, en: `Exercise ${exercise.number}` }, url: urls.referenceExercise(book, cls, chapter, exercise) };

  // Fetch questions if this is a real DB exercise
  let shapedQuestions = [];
  let totalQuestions = 0;
  const pageSize = Math.min(Math.max(Number(limit) || 15, 1), 50);

  if (exercise._id && !String(exercise._id).startsWith('ref-')) {
    const filter = vis(Question, preview, { exercise: exercise._id });
    const [questions, count] = await Promise.all([
      Question.find(filter)
        .sort({ sortOrder: 1, createdAt: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate(questionPopulate)
        .lean(),
      Question.countDocuments(filter),
    ]);
    totalQuestions = count;
    for (const q of questions) {
      shapedQuestions.push(await shapeQuestion(q, { preview, base: urls.referenceExercise(book, cls, chapter, exercise) }));
    }
  }

  const exIndex = chapterExercises.findIndex((e) => e.number === exercise.number || e.slug === exercise.slug);
  const prevEx = exIndex > 0 ? chapterExercises[exIndex - 1] : null;
  const nextEx = exIndex < chapterExercises.length - 1 ? chapterExercises[exIndex + 1] : null;

  return {
    type: 'referenceSolutions',
    data: {
      level: 'exercise',
      book,
      class: cls,
      chapter,
      exercise: {
        ...exercise,
        introVideo: cleanVideoRef(exercise.introVideo),
        pdfUrl: exercise.pdfFile?.url || exercise.pdfUrl || chapter.pdfUrl || chapter.pdfFile?.url || '',
      },
      questions: shapedQuestions,
      pagination: { page, limit: pageSize, total: totalQuestions, pages: Math.ceil(totalQuestions / pageSize) || 1 },
      siblings: chapterExercises,
      prev: prevEx ? { label: `Exercise ${prevEx.number}`, url: urls.referenceExercise(book, cls, chapter, prevEx) } : null,
      next: nextEx ? { label: `Exercise ${nextEx.number}`, url: urls.referenceExercise(book, cls, chapter, nextEx) } : null,
      resources: resources.map(formatResource),
    },
    breadcrumbs: [home, refCrumb, bookCrumb, classCrumb, chapterCrumb, exerciseCrumb],
    seo: {
      title: `${pick(book.title, 'en')} Class ${cls.number} Chapter ${chapter.number} Exercise ${exercise.number} Solutions`,
      description: `Step-by-step solutions for ${pick(book.title, 'en')} Class ${cls.number} Chapter ${chapter.number} Exercise ${exercise.number} with diagrams, formulas, and video explanations.`,
      canonical: urls.referenceExercise(book, cls, chapter, exercise),
    },
  };
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

  if (segments[0] === 'study-materials') {
    return resolveStudyMaterialsPath(segments, { preview, page, limit, terms, home });
  }

  if (segments[0] === 'reference-solutions') {
    return resolveReferenceSolutionsPath(segments, { preview, page, limit, previewToken, override, terms, home });
  }

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

  const chapterList = async (withExercises, withTopics) => {
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

    let topicsByChapter = new Map();
    if (withTopics) {
      const topics = await Topic.find(vis(Topic, preview, { chapter: { $in: chapters.map((c) => c._id) } }))
        .sort({ sortOrder: 1, number: 1 })
        .select('number title slug chapter difficulty estimatedTime status')
        .lean();
      topicsByChapter = topics.reduce((map, t) => {
        const key = String(t.chapter);
        const ch = chapters.find((c) => String(c._id) === key);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ ...t, url: urls.topic(cls, subject, ch, t) });
        return map;
      }, new Map());
    }

    return chapters.map((ch) => ({
      ...ch,
      url: urls.chapter(cls, subject, ch),
      exerciseCount: counts.exercises[String(ch._id)] || 0,
      questionCount: counts.questions[String(ch._id)] || 0,
      exercises: withExercises ? exercisesByChapter.get(String(ch._id)) || [] : undefined,
      topics: withTopics ? topicsByChapter.get(String(ch._id)) || [] : undefined,
    }));
  };

  if (segments.length === 2) {
    const [chapters, noteCount, resourceCount, bookCount, importantCount] = await Promise.all([
      chapterList(true, true),
      Note.countDocuments(vis(Note, preview, scope)),
      Resource.countDocuments(vis(Resource, preview, scope)),
      Book.countDocuments(vis(Book, preview, { class: cls._id })),
      ImportantQuestion.countDocuments(vis(ImportantQuestion, preview, scope)),
    ]);
    return {
      type: 'subject',
      data: {
        class: cls,
        subject,
        chapters,
        noteCount,
        resourceCount,
        bookCount,
        importantCount,
        links: {
          exercises: urls.exercises(cls, subject),
          notes: urls.notes(cls, subject),
          resources: urls.resources(cls, subject),
          books: urls.books(cls, subject),
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
      data: { class: cls, subject, chapters: await chapterList(true, false) },
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

  if (special === 'resources' && segments.length === 3) {
    const listUrl = urls.resources(cls, subject);
    const resourcesCrumb = { label: { hi: 'अध्ययन सामग्री व पीडीएफ', en: 'Study Material & PDFs' }, url: listUrl };
    const resources = await Resource.find(vis(Resource, preview, scope))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate([
        { path: 'chapter', select: 'number title slug' },
        { path: 'topic', select: 'number title slug' },
        { path: 'file', select: MEDIA_SELECT },
        { path: 'thumbnail', select: MEDIA_SELECT },
      ])
      .lean();
    return {
      type: 'resourcesList',
      data: {
        class: cls,
        subject,
        resources: resources.map((r) => ({
          ...r,
          fileUrl: r.file?.url || r.fileUrl || '',
          fileSize: r.fileSize || (r.file?.bytes ? `${(r.file.bytes / (1024 * 1024)).toFixed(1)} MB` : ''),
          thumbnailUrl: r.thumbnail?.url || '',
          chapter: r.chapter ? { ...r.chapter, url: urls.chapter(cls, subject, r.chapter) } : null,
          topic: r.topic && r.chapter ? { ...r.topic, url: urls.topic(cls, subject, r.chapter, r.topic) } : null,
        })),
      },
      breadcrumbs: [...crumbsBase, resourcesCrumb],
      seo: seoFor(null, {
        title: `Class ${cls.number} Maths PDF Notes, Worksheets & Formula Sheets`,
        description: `Download Class ${cls.number} Mathematics PDF notes, formula sheets, worksheets, sample papers and assignments.`,
        url: listUrl,
      }),
    };
  }

  if (special === 'books' && segments.length === 3) {
    const listUrl = urls.books(cls, subject);
    const booksCrumb = { label: { hi: 'संदर्भ पुस्तकें', en: 'Reference Books' }, url: listUrl };
    const books = await Book.find(vis(Book, preview, { class: cls._id }))
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate([
        { path: 'chapter', select: 'number title slug' },
        { path: 'coverImage', select: MEDIA_SELECT },
      ])
      .lean();
    return {
      type: 'booksList',
      data: {
        class: cls,
        subject,
        books: books.map((b) => ({
          ...b,
          coverUrl: b.coverImage?.url || b.coverUrl || '',
          chapter: b.chapter ? { ...b.chapter, url: urls.chapter(cls, subject, b.chapter) } : null,
        })),
      },
      breadcrumbs: [...crumbsBase, booksCrumb],
      seo: seoFor(null, {
        title: `Recommended Reference Books for Class ${cls.number} Maths`,
        description: `Best reference books, NCERT textbooks, and competitive mathematics guides for Class ${cls.number}.`,
        url: listUrl,
      }),
    };
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

  // Chapter → Topic / Exercise → Question
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
    const [topics, exercises, resources, books, notes, importantQuestions] = await Promise.all([
      Topic.find(vis(Topic, preview, { chapter: ch._id }))
        .sort({ sortOrder: 1, number: 1 })
        .populate([
          { path: 'image', select: MEDIA_SELECT },
          { path: 'video', select: VIDEO_SELECT },
        ])
        .lean(),
      Exercise.find(vis(Exercise, preview, { chapter: ch._id }))
        .sort({ sortOrder: 1, number: 1 })
        .select('number title slug description status')
        .lean(),
      Resource.find(vis(Resource, preview, { chapter: ch._id }))
        .sort({ sortOrder: 1, createdAt: -1 })
        .populate([
          { path: 'file', select: MEDIA_SELECT },
          { path: 'thumbnail', select: MEDIA_SELECT },
        ])
        .lean(),
      Book.find(vis(Book, preview, { $or: [{ chapter: ch._id }, { class: cls._id }] }))
        .sort({ sortOrder: 1, createdAt: -1 })
        .populate({ path: 'coverImage', select: MEDIA_SELECT })
        .lean(),
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
        topics: topics.map((tp) => ({
          ...tp,
          url: urls.topic(cls, subject, ch, tp),
          video: cleanVideoRef(tp.video),
        })),
        exercises: exercises.map((e) => ({ ...e, questionCount: qCounts[String(e._id)] || 0, url: urls.exercise(cls, subject, ch, e) })),
        resources: resources.map((r) => ({
          ...r,
          fileUrl: r.file?.url || r.fileUrl || '',
          fileSize: r.fileSize || (r.file?.bytes ? `${(r.file.bytes / (1024 * 1024)).toFixed(1)} MB` : ''),
          thumbnailUrl: r.thumbnail?.url || '',
        })),
        books: books.map((b) => ({
          ...b,
          coverUrl: b.coverImage?.url || b.coverUrl || '',
        })),
        notes: notes.map((n) => ({ ...n, url: urls.note(cls, subject, n) })),
        importantCount: importantQuestions,
        links: {
          importantQuestions: urls.importantQuestions(cls, subject),
          notes: urls.notes(cls, subject),
          resources: urls.resources(cls, subject),
          books: urls.books(cls, subject),
        },
        prev: nav(siblings[index - 1]),
        next: nav(siblings[index + 1]),
      },
      breadcrumbs: [...crumbsBase, chapterCrumb],
      related: await relatedFor('Chapter', ch, terms, preview),
      seo: seoFor(ch, {
        title: `Class ${cls.number} Maths ${chapterLabel.hi} – ${pick(ch.title, 'hi')} (${pick(ch.title, 'en')})`,
        description: describe(ch.shortDescription, `Class ${cls.number} Maths ${chapterLabel.hi} NCERT solutions, topics, video lessons, and step-by-step हल.`),
        url: chapterUrl,
        image: ch.featuredImage?.url || ch.image?.url,
      }),
    };
  }

  // Check for Topic page route: /class-10/maths/chapter/topic/topic-slug (segments.length === 5)
  if (segments.length === 5 && segments[3] === 'topic') {
    const topicDoc = await Topic.findOne(vis(Topic, preview, { chapter: ch._id, slug: segments[4] })).populate([
      { path: 'image', select: MEDIA_SELECT },
      { path: 'featuredImage', select: MEDIA_SELECT },
      { path: 'video', select: VIDEO_SELECT },
      { path: 'videos', select: VIDEO_SELECT },
      { path: 'attachments.media', select: MEDIA_SELECT },
      { path: 'seo.ogImage', select: MEDIA_SELECT },
    ]);
    if (!topicDoc) throw new ApiError(404, 'Topic not found');
    if (applyOverride(topicDoc, override, 'Topic')) {
      await topicDoc.populate([
        { path: 'image', select: MEDIA_SELECT },
        { path: 'featuredImage', select: MEDIA_SELECT },
        { path: 'video', select: VIDEO_SELECT },
        { path: 'videos', select: VIDEO_SELECT },
        { path: 'attachments.media', select: MEDIA_SELECT },
      ]);
    }
    return shapeTopic(topicDoc, { cls, subject, ch, preview, override, terms, baseCrumbs: crumbsBase });
  }

  // Check for segment 3 in 4-segment URLs
  if (segments.length === 4) {
    // 1. Is it a Topic slug directly under Chapter?
    const topicDoc = await Topic.findOne(vis(Topic, preview, { chapter: ch._id, slug: segments[3] })).populate([
      { path: 'image', select: MEDIA_SELECT },
      { path: 'featuredImage', select: MEDIA_SELECT },
      { path: 'video', select: VIDEO_SELECT },
      { path: 'videos', select: VIDEO_SELECT },
      { path: 'attachments.media', select: MEDIA_SELECT },
      { path: 'seo.ogImage', select: MEDIA_SELECT },
    ]);
    if (topicDoc) {
      if (applyOverride(topicDoc, override, 'Topic')) {
        await topicDoc.populate([
          { path: 'image', select: MEDIA_SELECT },
          { path: 'featuredImage', select: MEDIA_SELECT },
          { path: 'video', select: VIDEO_SELECT },
          { path: 'videos', select: VIDEO_SELECT },
          { path: 'attachments.media', select: MEDIA_SELECT },
        ]);
      }
      return shapeTopic(topicDoc, { cls, subject, ch, preview, override, terms, baseCrumbs: crumbsBase });
    }

    // 2. Is it an Exercise?
    const exercise = await Exercise.findOne(vis(Exercise, preview, { chapter: ch._id, slug: segments[3] })).populate([
      { path: 'introVideo', select: VIDEO_SELECT },
      { path: 'seo.ogImage', select: MEDIA_SELECT },
    ]);
    if (exercise) {
      if (applyOverride(exercise, override, 'Exercise')) await exercise.populate({ path: 'introVideo', select: VIDEO_SELECT });
      const ex = exercise.toObject();
      const exerciseUrl = urls.exercise(cls, subject, ch, ex);
      const exerciseLabel = term(terms, 'exercise', ex.number);
      const exerciseCrumb = { label: exerciseLabel, url: exerciseUrl };
      const titlePrefix = `Class ${cls.number} Maths ${chapterLabel.hi} ${exerciseLabel.hi}`;

      const siblingExercises = await Exercise.find(vis(Exercise, preview, { chapter: ch._id })).sort({ sortOrder: 1, number: 1 }).select('number slug title').lean();
      const exIndex = siblingExercises.findIndex((s) => String(s._id) === String(ex._id));
      const exNav = (s) => s && { label: term(terms, 'exercise', s.number), url: urls.exercise(cls, subject, ch, s) };

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

    throw new ApiError(404, 'Page not found');
  }

  // 5 segments: Question under Exercise
  if (segments.length === 5) {
    const exercise = await Exercise.findOne(vis(Exercise, preview, { chapter: ch._id, slug: segments[3] }));
    if (!exercise) throw new ApiError(404, 'प्रश्नावली not found');
    const ex = exercise.toObject();
    const exerciseUrl = urls.exercise(cls, subject, ch, ex);
    const exerciseLabel = term(terms, 'exercise', ex.number);
    const exerciseCrumb = { label: exerciseLabel, url: exerciseUrl };
    const titlePrefix = `Class ${cls.number} Maths ${chapterLabel.hi} ${exerciseLabel.hi}`;

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
