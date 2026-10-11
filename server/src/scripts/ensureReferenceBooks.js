import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Book, ClassLevel, Subject, Chapter, Exercise, Resource } from '../models/index.js';

async function run() {
  await connectDB(env.MONGODB_URI);

  console.log('[ensureReferenceBooks] checking existing books...');
  const books = await Book.find();

  for (const book of books) {
    const title = (book.title?.en || book.title?.hi || '').toLowerCase();
    let updated = false;

    if (title.includes('r.s. aggarwal') || title.includes('rs aggarwal')) {
      book.slug = 'rs-aggarwal';
      book.hasSolutions = true;
      updated = true;
    } else if (title.includes('r.d. sharma') || title.includes('rd sharma')) {
      book.slug = 'rd-sharma';
      book.hasSolutions = true;
      updated = true;
    } else if (title.includes('m.l. aggarwal') || title.includes('ml aggarwal')) {
      book.slug = 'ml-aggarwal';
      book.hasSolutions = true;
      updated = true;
    } else if (!book.slug) {
      book.slug = title
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      updated = true;
    }

    if (updated) {
      await book.save();
      console.log(`[ensureReferenceBooks] Updated book: ${book.title?.en} -> slug: ${book.slug}, hasSolutions: ${book.hasSolutions}`);
    }
  }

  // Ensure ML Aggarwal exists
  let mlBook = await Book.findOne({ slug: 'ml-aggarwal' });
  if (!mlBook) {
    const c10 = await ClassLevel.findOne({ number: 10 });
    const mathSub = await Subject.findOne({ slug: 'maths' });
    mlBook = await Book.create({
      title: {
        hi: 'Understanding ICSE Mathematics by M.L. Aggarwal',
        en: 'Understanding Mathematics by M.L. Aggarwal',
        mixed: 'Understanding Mathematics by M.L. Aggarwal Solutions',
      },
      slug: 'ml-aggarwal',
      author: 'M.L. Aggarwal',
      publisher: 'Avichal Publishing Company',
      category: 'reference',
      hasSolutions: true,
      class: c10?._id,
      subject: mathSub?._id,
      description: {
        hi: 'एम.एल. अग्रवाल संदर्भ समाधान - कक्षा 10 गणित के सभी अध्यायों और अभ्यास के विस्तृत हल।',
        en: 'M.L. Aggarwal Reference Solutions - Complete chapter-wise and exercise-wise solutions for Class 10 Mathematics.',
        mixed: 'ML Aggarwal Reference Solutions - Complete step-by-step solutions for class 10 mathematics.',
      },
      status: 'published',
      isVisible: true,
    });
    console.log('[ensureReferenceBooks] Created ML Aggarwal reference book');
  }

  // Ensure sample RS Aggarwal Chapter 6 & Exercise 6D exist for testing requirement #3
  const rsBook = await Book.findOne({ slug: 'rs-aggarwal' });
  const c10 = await ClassLevel.findOne({ number: 10 });
  const mathSub = await Subject.findOne({ slug: 'maths' });

  if (rsBook && c10) {
    let ch6 = await Chapter.findOne({ book: rsBook._id, number: 6 });
    if (!ch6) {
      ch6 = await Chapter.create({
        class: c10._id,
        subject: mathSub?._id,
        book: rsBook._id,
        number: 6,
        slug: 'chapter-6',
        title: {
          hi: 'निर्देशांक ज्यामिति',
          en: 'Coordinate Geometry',
          mixed: 'Coordinate Geometry (निर्देशांक ज्यामिति)',
        },
        shortDescription: {
          hi: 'आर.एस. अग्रवाल कक्षा 10 निर्देशांक ज्यामिति के सभी प्रश्न एवं हल।',
          en: 'RS Aggarwal Class 10 Coordinate Geometry complete step-by-step solutions.',
          mixed: 'RS Aggarwal Class 10 Coordinate Geometry complete exercise solutions.',
        },
        status: 'published',
        isVisible: true,
      });
      console.log('[ensureReferenceBooks] Created RS Aggarwal Chapter 6');
    }

    let ex6d = await Exercise.findOne({ chapter: ch6._id, number: '6D' });
    if (!ex6d) {
      ex6d = await Exercise.create({
        chapter: ch6._id,
        number: '6D',
        slug: 'exercise-6d',
        title: {
          hi: 'निर्देशांक ज्यामिति - प्रश्नावली 6D',
          en: 'Coordinate Geometry - Exercise 6D',
          mixed: 'Coordinate Geometry - Exercise 6D Solutions',
        },
        description: {
          hi: 'आर.एस. अग्रवाल कक्षा 10 अध्याय 6 प्रश्नावली 6D के सभी प्रश्नों के हल।',
          en: 'Step-by-step solutions for Exercise 6D of RS Aggarwal Class 10 Mathematics.',
          mixed: 'Complete step-by-step solutions for Exercise 6D of RS Aggarwal Class 10.',
        },
        status: 'published',
        isVisible: true,
      });
      console.log('[ensureReferenceBooks] Created RS Aggarwal Exercise 6D');
    }
  }

  // Ensure sample study materials exist
  const sampleNote = await Resource.findOne({ resourceType: 'ncert_notes' });
  if (!sampleNote && c10) {
    await Resource.create({
      class: c10._id,
      title: {
        hi: 'कक्षा 10 गणित संपूर्ण अध्याय नोट्स एवं सूत्र',
        en: 'Class 10 Maths Complete Chapter Notes & Formula Sheet',
        mixed: 'Class 10 Maths Chapter Notes and Key Formulas PDF',
      },
      description: {
        hi: 'कक्षा 10 गणित के सभी अध्यायों के संक्षिप्त रिवीज़न नोट्स एवं महत्वपूर्ण सूत्र।',
        en: 'Comprehensive revision notes, formulas and key concepts for Class 10 Mathematics.',
        mixed: 'Comprehensive revision notes, formulas and concepts for Class 10 Maths.',
      },
      resourceType: 'ncert_notes',
      downloadAllowed: true,
      featured: true,
      status: 'published',
      isVisible: true,
      fileSize: '2.8 MB',
    });
    console.log('[ensureReferenceBooks] Created sample NCERT Notes resource');
  }

  const samplePaper = await Resource.findOne({ resourceType: 'cbse_sample_papers' });
  if (!samplePaper && c10) {
    await Resource.create({
      class: c10._id,
      title: {
        hi: 'सीबीएसई कक्षा 10 गणित 2025-26 सैंपल प्रश्न पत्र (हल सहित)',
        en: 'CBSE Class 10 Maths 2025-26 Sample Question Paper with Solutions',
        mixed: 'CBSE Class 10 Maths Sample Paper with Marking Scheme',
      },
      description: {
        hi: 'नवीनतम सीबीएसई पैटर्न पर आधारित मॉडल प्रश्न पत्र और स्टेप-बाय-स्टेप उत्तर कुंजी।',
        en: 'Latest CBSE pattern model question paper with detailed step-by-step marking scheme.',
        mixed: 'Latest CBSE pattern model question paper with marking scheme.',
      },
      resourceType: 'cbse_sample_papers',
      downloadAllowed: true,
      featured: true,
      status: 'published',
      isVisible: true,
      fileSize: '3.4 MB',
    });
    console.log('[ensureReferenceBooks] Created sample CBSE Sample Paper resource');
  }

  console.log('[ensureReferenceBooks] done!');
}

run()
  .catch((err) => {
    console.error('[ensureReferenceBooks] error:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
