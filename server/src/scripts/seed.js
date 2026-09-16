import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { detectImage } from '../lib/imageInfo.js';
import { passwordError } from '../lib/permissions.js';
import { sanitizeSvg } from '../lib/sanitize.js';
import { storeImage } from '../lib/storage.js';
import {
  AdSlot,
  Admin,
  Announcement,
  Chapter,
  ClassLevel,
  DEFAULT_TERMINOLOGY,
  Exercise,
  ImportantQuestion,
  Media,
  Navigation,
  Note,
  Page,
  Question,
  Section,
  SeoSetting,
  SiteSettings,
  Solution,
  Subject,
  Template,
} from '../models/index.js';
import * as data from '../seed/data.js';
import { apGraphSvg, constructionSvg, triangleSvg } from '../seed/diagrams.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const RESET = process.argv.includes('--reset');
const CONTENT_MODELS = [ClassLevel, Subject, Chapter, Exercise, Question, Solution, Note, ImportantQuestion, Page, Section, Navigation, Announcement, SeoSetting, Template, AdSlot, Media, SiteSettings];

async function uploadAsset({ buffer, name, title, kind, alt, caption }) {
  const info = detectImage(buffer);
  const safe = info.format === 'svg' ? sanitizeSvg(buffer) : buffer;
  const stored = await storeImage({ buffer: safe, info, name, kind });
  return Media.create({ ...stored, mimeType: info.mimeType, originalName: name, title, alt, caption, kind });
}

async function ensureOwner() {
  const existing = await Admin.countDocuments();
  if (existing) return console.log(`[seed] ${existing} admin account(s) already exist — not creating another`);
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    return console.warn('[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — run `npm run create-admin` later');
  }
  const problem = passwordError(env.SEED_ADMIN_PASSWORD, env.SEED_ADMIN_EMAIL, 'SEED_ADMIN_PASSWORD');
  if (problem) throw new Error(problem);
  const owner = new Admin({ name: env.SEED_ADMIN_NAME, email: env.SEED_ADMIN_EMAIL, role: 'superadmin' });
  await owner.setPassword(env.SEED_ADMIN_PASSWORD);
  await owner.save();
  console.log(`[seed] owner account created: ${owner.email}`);
}

async function run() {
  await connectDB(env.MONGODB_URI);

  const hasContent = await ClassLevel.countDocuments();
  if (hasContent && !RESET) {
    console.log('[seed] Database already has content. Nothing changed.\n       Run `npm run seed -- --reset` to wipe website content and load the starter content again (admin accounts are kept).');
    await ensureOwner();
    return;
  }
  if (RESET) {
    for (const Model of CONTENT_MODELS) await Model.deleteMany({});
    console.log('[seed] existing website content removed (admins, activity logs and backups kept)');
  }

  const logoBuffer = await fs.readFile(path.join(here, '..', 'seed', 'assets', 'pms-logo.png'));
  const logo = await uploadAsset({ buffer: logoBuffer, name: 'passion-maths-study-logo.png', title: 'Passion Maths Study logo', kind: 'logo', alt: { hi: 'पैशन मैथ्स स्टडी लोगो', en: 'Passion Maths Study logo' } });
  const media = {
    triangle: await uploadAsset({ buffer: Buffer.from(triangleSvg), name: 'triangle-abc-angle-sum.svg', title: 'Triangle ABC – angle sum', kind: 'figure', alt: { hi: 'त्रिभुज ABC जिसमें कोण A 60° और कोण B 70° है', en: 'Triangle ABC with angle A = 60° and angle B = 70°' } }),
    construction: await uploadAsset({ buffer: Buffer.from(constructionSvg), name: 'construction-60-degree-angle.svg', title: 'Construction of 60° angle', kind: 'construction', alt: { hi: 'किरण AB के बिंदु A पर 60° कोण की रचना', en: 'Construction of a 60° angle at point A of ray AB' } }),
    apGraph: await uploadAsset({ buffer: Buffer.from(apGraphSvg), name: 'ap-3-8-13-graph.svg', title: 'Graph of AP 3, 8, 13, …', kind: 'graph', alt: { hi: 'AP 3, 8, 13, … के पदों का ग्राफ', en: 'Graph of the terms of the AP 3, 8, 13, …' } }),
  };

  await SiteSettings.create({
    key: 'site',
    brand: {
      name: { hi: 'पैशन मैथ्स स्टडी', en: 'Passion Maths Study' },
      shortName: 'PMS',
      tagline: { hi: 'NCERT कक्षा 6–12 गणित', en: 'NCERT Class 6–12 Maths' },
      logo: logo._id,
      footerLogo: logo._id,
      favicon: logo._id,
    },
    header: {
      searchPlaceholder: { hi: 'खोजें: कक्षा, अध्याय, प्रश्नावली, सूत्र…', en: 'Search class, अध्याय, प्रश्नावली (e.g. Class 10 Ex 5.2)' },
      loginLabel: { hi: 'लॉगिन', en: 'Login' },
    },
    footer: {
      description: {
        hi: 'कक्षा 6 से 12 के विद्यार्थियों के लिए NCERT गणित का निःशुल्क, चरणबद्ध और द्विभाषी अध्ययन मंच।',
        en: 'A free, step-by-step and bilingual NCERT Mathematics study platform for Class 6–12 students.',
      },
      copyright: { hi: '© {year} Passion Maths Study (PMS). सर्वाधिकार सुरक्षित।', en: '© {year} Passion Maths Study (PMS). All rights reserved.' },
      disclaimer: {
        hi: 'NCERT पाठ्यपुस्तक सामग्री NCERT, नई दिल्ली के पाठ्यक्रम पर आधारित है। यह एक स्वतंत्र शैक्षिक मंच है।',
        en: 'NCERT textbook content follows the curriculum of NCERT, New Delhi. This is an independent educational platform.',
      },
      badges: [{ hi: 'NCERT 2024-25', en: 'NCERT 2024-25' }, { hi: 'हिंदी & English', en: 'Hindi & English' }],
    },
    terminology: DEFAULT_TERMINOLOGY,
    seo: {
      titleTemplate: '%s | Passion Maths Study',
      defaultTitle: { hi: 'NCERT गणित हल कक्षा 6 से 12', en: 'NCERT Mathematics Solutions Class 6 to 12' },
      defaultDescription: {
        hi: 'कक्षा 6 से 12 NCERT गणित के अध्याय-wise और प्रश्नावली-wise step-by-step हल – हिंदी और English में।',
        en: 'अध्याय-wise and प्रश्नावली-wise step-by-step NCERT Maths solutions for Class 6 to 12 in Hindi and English.',
      },
      defaultOgImage: logo._id,
      organizationName: 'Passion Maths Study',
    },
  });

  const maths = await Subject.create({ name: { hi: 'गणित', en: 'Mathematics' }, slug: 'maths', icon: 'sigma', isPublic: true, status: 'published' });

  const classDocs = {};
  for (const c of data.classes) {
    classDocs[c.number] = await ClassLevel.create({ ...c, slug: `class-${c.number}`, subjects: [maths._id], status: 'published' });
  }

  const chapterDocs = {};
  const exerciseDocs = {};
  for (const [classNumber, list] of Object.entries(data.chapters)) {
    for (const [number, hi, en] of list) {
      const key = `${classNumber}-${number}`;
      const extra = data.chapterExtras[key] || {};
      const chapter = await Chapter.create({
        class: classDocs[classNumber]._id,
        subject: maths._id,
        number,
        slug: `adhyay-${number}`,
        title: { hi, en },
        shortDescription: extra.shortDescription,
        introduction: extra.introduction,
        formulas: extra.formulas,
        featured: Boolean(extra.featured),
        sortOrder: number,
        status: 'published',
      });
      chapterDocs[key] = chapter;
      for (const [i, ex] of (extra.exercises || []).entries()) {
        const exercise = await Exercise.create({ chapter: chapter._id, number: ex.number, title: ex.title, sortOrder: i, status: 'published' });
        exerciseDocs[`${key}-${ex.number}`] = exercise;
      }
    }
  }

  const resolveBlocks = (blocks = []) =>
    blocks.map(({ mediaKey, ...b }) => (mediaKey ? { ...b, media: [{ media: media[mediaKey]._id, alt: media[mediaKey].alt }] } : b));

  let questionCount = 0;
  for (const [key, list] of Object.entries(data.questions)) {
    const exercise = exerciseDocs[key];
    for (const [i, q] of list.entries()) {
      const { blocks, attachments = [], ...fields } = q;
      const question = await Question.create({
        ...fields,
        exercise: exercise._id,
        attachments: attachments.map(({ mediaKey, ...a }) => ({ ...a, media: media[mediaKey]._id, alt: media[mediaKey].alt })),
        sortOrder: i,
        status: 'published',
      });
      await Solution.create({ question: question._id, blocks: resolveBlocks(blocks), languageMode: q.languageMode || 'auto' });
      questionCount += 1;
    }
  }

  for (const [i, n] of data.notes.entries()) {
    const { classNumber, chapterNumber, ...fields } = n;
    await Note.create({ ...fields, class: classDocs[classNumber]._id, subject: maths._id, chapter: chapterDocs[`${classNumber}-${chapterNumber}`]._id, sortOrder: i, status: 'published' });
  }
  for (const [i, iq] of data.importantQuestions.entries()) {
    const { classNumber, chapterNumber, blocks, ...fields } = iq;
    await ImportantQuestion.create({ ...fields, blocks, class: classDocs[classNumber]._id, subject: maths._id, chapter: chapterDocs[`${classNumber}-${chapterNumber}`]._id, sortOrder: i, status: 'published' });
  }
  for (const [i, pg] of data.pages.entries()) await Page.create({ ...pg, sortOrder: i, status: 'published' });

  await Navigation.create([
    {
      key: 'header',
      items: [
        { label: { hi: 'होम', en: 'Home' }, url: '/', type: 'link' },
        { label: { hi: 'गणित', en: 'Mathematics' }, type: 'classes' },
        { label: { hi: 'महत्वपूर्ण प्रश्न', en: 'Important Questions' }, url: '/class-10/maths/important-questions', type: 'link' },
        { label: { hi: 'नोट्स', en: 'Notes' }, url: '/class-10/maths/notes', type: 'link' },
        { label: { hi: 'हमारे बारे में', en: 'About Us' }, url: '/about-us', type: 'link' },
      ],
    },
    {
      key: 'footer',
      items: [
        { label: { hi: 'गणित', en: 'MATHEMATICS' }, type: 'classes' },
        {
          label: { hi: 'महत्वपूर्ण लिंक', en: 'IMPORTANT LINKS' },
          type: 'column',
          children: [
            { label: { hi: 'होम', en: 'Home' }, url: '/' },
            { label: { hi: 'गणित', en: 'Mathematics' }, url: '/#classes' },
            { label: { hi: 'खोजें', en: 'Search' }, url: '/search' },
            { label: { hi: 'हमारे बारे में', en: 'About Us' }, url: '/about-us' },
            { label: { hi: 'संपर्क करें', en: 'Contact' }, url: '/contact' },
            { label: { hi: 'गोपनीयता नीति', en: 'Privacy Policy' }, url: '/privacy-policy' },
            { label: { hi: 'नियम एवं शर्तें', en: 'Terms & Conditions' }, url: '/terms-and-conditions' },
          ],
        },
      ],
    },
    {
      key: 'footerBottom',
      items: [
        { label: { hi: 'गोपनीयता नीति', en: 'Privacy Policy' }, url: '/privacy-policy' },
        { label: { hi: 'नियम एवं शर्तें', en: 'Terms & Conditions' }, url: '/terms-and-conditions' },
        { label: { hi: 'संपर्क', en: 'Contact' }, url: '/contact' },
      ],
    },
  ]);

  await Announcement.create({
    badge: { hi: 'नया सत्र', en: 'New session' },
    text: { hi: 'NCERT 2024-25 पाठ्यक्रम के अनुसार अध्याय-wise हल जोड़े जा रहे हैं।', en: 'अध्याय-wise solutions as per the NCERT 2024-25 syllabus are being added.' },
    linkLabel: { hi: 'शुरू करें', en: 'Start now' },
    linkUrl: '/#classes',
  });

  const c10 = classDocs[10];
  await Section.create([
    {
      type: 'hero',
      name: 'hero',
      sortOrder: 0,
      status: 'published',
      badge: { hi: 'NCERT 2024-25 • हिंदी & English Medium', en: 'NCERT 2024-25 • Hindi & English Medium' },
      title: { hi: 'NCERT गणित हल', en: 'NCERT Mathematics Solutions' },
      highlight: { hi: 'कक्षा 6 से 12', en: 'Class 6 to 12' },
      description: {
        hi: 'Class 6 to 12 Mathematics के अध्याय-wise और प्रश्नावली-wise Solutions आसान भाषा में।',
        en: 'अध्याय-wise and प्रश्नावली-wise Class 6–12 Mathematics solutions in simple language.',
      },
      buttons: [{ label: { hi: 'अपनी कक्षा चुनें', en: 'Choose your class' }, url: '#classes', variant: 'primary' }],
      config: {
        showSearch: true,
        searchPlaceholder: { hi: 'जैसे: कक्षा 10 प्रश्नावली 5.2, त्रिभुज, सूत्र…', en: 'e.g. Class 10 Ex 5.2, Triangle, Formula…' },
        searchButtonLabel: { hi: 'हल खोजें', en: 'Find Solution' },
        popularLabel: { hi: 'लोकप्रिय:', en: 'Popular:' },
        popularSearches: [
          { label: { hi: 'कक्षा 10 प्रश्नावली 5.2', en: 'Class 10 Ex 5.2' }, query: 'Class 10 Ex 5.2' },
          { label: { hi: 'समांतर श्रेढ़ी', en: 'Arithmetic Progression' }, query: 'समांतर' },
          { label: { hi: 'त्रिभुज', en: 'Triangle' }, query: 'त्रिभुज' },
          { label: { hi: 'रचना', en: 'Construction' }, query: 'construction' },
        ],
      },
    },
    {
      type: 'statistics',
      name: 'stats',
      sortOrder: 1,
      status: 'published',
      config: { autoStats: true, columns: 4 },
      items: [
        { value: '{classes}', title: { hi: 'कक्षाएँ', en: 'Classes' }, icon: 'graduation-cap' },
        { value: '{chapters}', title: { hi: 'अध्याय', en: 'अध्याय' }, icon: 'book-open' },
        { value: '{questions}', title: { hi: 'हल सहित प्रश्न', en: 'Solved questions' }, icon: 'list-checks' },
        { value: '100%', title: { hi: 'निःशुल्क', en: 'Free' }, icon: 'heart-handshake' },
      ],
    },
    {
      type: 'classGrid',
      name: 'classes',
      sortOrder: 2,
      status: 'published',
      badge: { hi: 'NCERT कक्षा 6 से 12', en: 'NCERT Classes 6 to 12' },
      title: { hi: 'अपनी कक्षा चुनें', en: 'Select Your Class' },
      description: { hi: 'अध्याय-wise NCERT हल, नोट्स और महत्वपूर्ण प्रश्न।', en: 'अध्याय-wise NCERT solutions, notes and important questions.' },
      config: { layout: 'featured' },
    },
    {
      type: 'steps',
      name: 'hierarchy',
      sortOrder: 3,
      status: 'published',
      badge: { hi: 'चरणबद्ध अध्ययन', en: 'Structured learning' },
      title: { hi: 'हर प्रश्न, एक स्पष्ट क्रम में', en: 'Every question in a clear order' },
      description: { hi: 'कक्षा से अंतिम उत्तर तक — कहीं भी भटकने की ज़रूरत नहीं।', en: 'From class to final answer — never lose your place.' },
      config: { background: 'dark' },
      items: [
        { title: { hi: 'कक्षा', en: 'Class' }, description: { hi: '6 से 12', en: '6 to 12' }, icon: 'graduation-cap' },
        { title: { hi: 'अध्याय', en: 'अध्याय' }, description: { hi: 'अवधारणा', en: 'Concepts' }, icon: 'book-open' },
        { title: { hi: 'प्रश्नावली', en: 'प्रश्नावली' }, description: { hi: 'NCERT क्रम', en: 'NCERT order' }, icon: 'list-ordered' },
        { title: { hi: 'प्रश्न', en: 'Question' }, description: { hi: 'हिंदी व English', en: 'Hindi & English' }, icon: 'circle-help' },
        { title: { hi: 'हल', en: 'Solution' }, description: { hi: 'चरण-दर-चरण', en: 'Step by step' }, icon: 'route' },
        { title: { hi: 'आरेख', en: 'Diagram' }, description: { hi: 'रचना व ग्राफ', en: 'Construction & graphs' }, icon: 'pen-tool' },
        { title: { hi: 'अंतिम उत्तर', en: 'Final Answer' }, description: { hi: 'सत्यापित', en: 'Verified' }, icon: 'circle-check' },
      ],
    },
    {
      type: 'chapterGrid',
      name: 'popular-chapters',
      sortOrder: 4,
      status: 'published',
      badge: { hi: 'सबसे ज़्यादा पढ़े गए', en: 'Most practiced' },
      title: { hi: 'लोकप्रिय अध्याय', en: 'Popular अध्याय' },
      config: { chapters: [chapterDocs['10-5']._id, chapterDocs['9-6']._id, chapterDocs['9-5']._id, chapterDocs['10-8']._id], limit: 8 },
    },
    {
      type: 'cardGrid',
      name: 'resources',
      sortOrder: 5,
      status: 'published',
      badge: { hi: 'अध्ययन सामग्री', en: 'Study resources' },
      title: { hi: 'महत्वपूर्ण अध्ययन सामग्री', en: 'Featured Study Resources' },
      config: { columns: 3 },
      items: [
        { title: { hi: 'सूत्र संग्रह', en: 'Formula Sheets' }, description: { hi: 'अध्याय-wise सभी महत्वपूर्ण सूत्र।', en: 'All important formulas, अध्याय-wise.' }, latex: 'a_n = a + (n-1)d', icon: 'sigma', url: '/class-10/maths/notes', badge: { hi: 'नोट्स', en: 'Notes' } },
        { title: { hi: 'प्रमेय एवं रचनाएँ', en: 'Theorems & Constructions' }, description: { hi: 'रचना के चरण और स्पष्ट आरेख।', en: 'Steps of construction with clear diagrams.' }, icon: 'drafting-compass', url: '/class-9/maths/adhyay-6/prashnavali-6-1', badge: { hi: 'आरेख', en: 'Diagrams' } },
        { title: { hi: 'महत्वपूर्ण प्रश्न', en: 'Important Questions' }, description: { hi: 'परीक्षा की दृष्टि से चुने गए प्रश्न।', en: 'Hand-picked exam-oriented questions.' }, icon: 'file-question', url: '/class-10/maths/important-questions', badge: { hi: 'परीक्षा', en: 'Exam' } },
      ],
    },
    {
      type: 'questionList',
      name: 'important-questions',
      sortOrder: 6,
      status: 'published',
      badge: { hi: 'परीक्षा तैयारी', en: 'Exam prep' },
      title: { hi: 'महत्वपूर्ण प्रश्न', en: 'Important Questions' },
      config: { limit: 4 },
      buttons: [{ label: { hi: 'सभी देखें', en: 'View all' }, url: '/class-10/maths/important-questions', variant: 'link' }],
    },
    {
      type: 'faq',
      name: 'faq',
      sortOrder: 7,
      status: 'published',
      title: { hi: 'अक्सर पूछे जाने वाले प्रश्न', en: 'Frequently Asked Questions' },
      items: [
        { title: { hi: 'क्या सभी हल निःशुल्क हैं?', en: 'Are all solutions free?' }, description: { hi: 'हाँ, सभी NCERT गणित हल पूरी तरह निःशुल्क हैं।', en: 'Yes, all NCERT Maths solutions are completely free.' } },
        { title: { hi: 'क्या हल हिंदी और English दोनों में हैं?', en: 'Are solutions available in Hindi and English?' }, description: { hi: 'हाँ। ऊपर दिए भाषा बटन से हिंदी या English चुनें।', en: 'Yes. Use the language switch at the top to choose हिंदी or English.' } },
        { title: { hi: 'क्या हल नए पाठ्यक्रम के अनुसार हैं?', en: 'Are solutions as per the latest syllabus?' }, description: { hi: 'सामग्री NCERT 2024-25 पाठ्यक्रम के अनुसार तैयार की जा रही है।', en: 'Content is being prepared as per the NCERT 2024-25 syllabus.' } },
      ],
    },
    {
      type: 'cta',
      name: 'cta',
      sortOrder: 8,
      status: 'published',
      title: { hi: 'आज से ही अभ्यास शुरू करें', en: 'Start practising today' },
      description: { hi: 'अपनी कक्षा चुनें और प्रश्नावली-wise हल देखें।', en: 'Pick your class and open प्रश्नावली-wise solutions.' },
      config: { background: 'brand' },
      buttons: [
        { label: { hi: 'कक्षा 10 गणित', en: 'Class 10 Maths' }, url: `/${c10.slug}/maths`, variant: 'secondary' },
        { label: { hi: 'खोजें', en: 'Search' }, url: '/search', variant: 'outline' },
      ],
    },
  ]);

  await SeoSetting.create([
    {
      routeKey: 'home',
      label: 'Homepage',
      title: { hi: 'NCERT गणित हल कक्षा 6 से 12 – हिंदी & English', en: 'NCERT Maths Solutions Class 6 to 12 – Hindi & English' },
      description: {
        hi: 'कक्षा 6 से 12 NCERT गणित के अध्याय-wise और प्रश्नावली-wise step-by-step हल, सूत्र, नोट्स और महत्वपूर्ण प्रश्न।',
        en: 'Step-by-step अध्याय-wise and प्रश्नावली-wise NCERT Maths solutions, formulas, notes and important questions for Class 6–12.',
      },
      ogImage: logo._id,
    },
    { routeKey: 'search', label: 'Search page', title: { hi: 'गणित खोजें', en: 'Search Mathematics' }, robots: 'noindex,follow' },
  ]);

  await Template.create([
    {
      name: 'Standard step-by-step',
      kind: 'question',
      isDefault: true,
      sortOrder: 0,
      description: { hi: 'दिया है → सूत्र → चरण → अंतिम उत्तर', en: 'Given → Formula → Steps → Final answer' },
      blocks: [{ type: 'explanation', title: { hi: 'दिया है', en: 'Given' } }, { type: 'formula' }, { type: 'step' }, { type: 'step' }, { type: 'finalAnswer' }],
    },
    {
      name: 'Construction question',
      kind: 'question',
      sortOrder: 1,
      description: { hi: 'प्रश्न → हल → रचना के चरण → रचना आरेख → वीडियो → अंतिम उत्तर', en: 'Question → Solution → Steps of construction → Diagram → Video → Final answer' },
      questionDefaults: { difficulty: 'medium', videoPlacement: 'afterSolution', includeHint: true, attachmentKinds: ['figure'] },
      blocks: [{ type: 'explanation' }, { type: 'construction' }, { type: 'diagram' }, { type: 'note', title: { hi: 'औचित्य', en: 'Justification' } }, { type: 'youtube' }, { type: 'finalAnswer' }],
    },
    {
      name: 'Graph question',
      kind: 'question',
      sortOrder: 2,
      description: { hi: 'व्याख्या → गणना → ग्राफ → अंतिम उत्तर', en: 'Explanation → Calculation → Graph → Final answer' },
      blocks: [{ type: 'explanation' }, { type: 'calculation' }, { type: 'graph' }, { type: 'finalAnswer' }],
    },
  ]);

  await AdSlot.create([
    { name: 'Below header', placement: 'belowHeader', minHeightDesktop: 90, minHeightMobile: 100, sortOrder: 0 },
    { name: 'Inside content', placement: 'inContent', pageTypes: ['exercise', 'chapter'], sortOrder: 1 },
    { name: 'Desktop sidebar', placement: 'sidebar', device: 'desktop', minHeightDesktop: 250, sortOrder: 2 },
    { name: 'After content', placement: 'afterContent', sortOrder: 3 },
    { name: 'Above footer', placement: 'aboveFooter', sortOrder: 4 },
  ]);

  await ensureOwner();
  console.log(`[seed] done: ${data.classes.length} classes, ${Object.keys(chapterDocs).length} chapters, ${Object.keys(exerciseDocs).length} exercises, ${questionCount} questions`);
}

run()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
