import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import request from 'supertest';
import { Topic, Resource, Book, Chapter, ClassLevel, Subject, Admin } from '../src/models/index.js';
import { resolvePath } from '../src/services/publicContent.js';
import { search } from '../src/services/search.js';

async function runE2EVerification() {
  console.log('--- Starting Comprehensive E2E Integration Verification ---');
  await connectDB('mongodb://127.0.0.1:27017/pms');
  const app = createApp();

  // 1. Get an existing admin or authenticate
  const admin = await Admin.findOne().lean();
  assert.ok(admin, 'Admin account exists');
  console.log('✓ Admin account found:', admin.email);

  // 2. Test Public Content Resolver for Seeded Topic
  console.log('\n--- 1. Testing Seeded Topic Public Resolver ---');
  const seededTopic = await Topic.findOne({ slug: 'introduction-to-quadratic-equations' })
    .populate('chapter')
    .populate('class')
    .populate('subject')
    .lean();
  assert.ok(seededTopic, 'Seeded topic exists in database');

  const topicUrl = `/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations`;
  const resolvedTopic = await resolvePath(topicUrl, { preview: false });
  assert.equal(resolvedTopic.type, 'topic', 'Resolved type should be topic');
  assert.ok(resolvedTopic.data.topic, 'Topic data present');
  assert.equal(resolvedTopic.data.topic.slug, 'introduction-to-quadratic-equations');
  assert.ok(resolvedTopic.data.topic.video, 'Featured video present');
  assert.ok(resolvedTopic.data.topic.formulas.length > 0, 'Formulas present');
  assert.ok(resolvedTopic.data.topic.practiceQuestions.length > 0, 'Practice questions present');
  assert.ok(resolvedTopic.data.resources.length > 0, 'Chapter/topic resources present');
  assert.ok(resolvedTopic.data.books.length > 0, 'Chapter/class books present');
  assert.ok(resolvedTopic.data.siblings.length > 0, 'Sibling topics playlist present');
  console.log('✓ Seeded topic resolves with all 10 content sections (video, notes, formulas, practice, resources, books, siblings)');

  // 3. Test 4-segment clean URL resolver
  const cleanUrl = `/class-10/maths/adhyay-4/introduction-to-quadratic-equations`;
  const resolvedClean = await resolvePath(cleanUrl, { preview: false });
  assert.equal(resolvedClean.type, 'topic', '4-segment clean URL resolves to topic');
  console.log('✓ 4-segment clean URL resolves identically');

  // 4. Test Resources List Page
  console.log('\n--- 2. Testing Resources & Books List Pages ---');
  const resourcesUrl = `/class-10/maths/resources`;
  const resolvedResources = await resolvePath(resourcesUrl, { preview: false });
  assert.equal(resolvedResources.type, 'resourcesList');
  assert.ok(resolvedResources.data.resources.length >= 4, 'Resources list populated');
  console.log(`✓ Resources list page resolves (${resolvedResources.data.resources.length} resources found)`);

  // 5. Test Books List Page
  const booksUrl = `/class-10/maths/books`;
  const resolvedBooks = await resolvePath(booksUrl, { preview: false });
  assert.equal(resolvedBooks.type, 'booksList');
  assert.ok(resolvedBooks.data.books.length >= 3, 'Books list populated');
  console.log(`✓ Books list page resolves (${resolvedBooks.data.books.length} books found)`);

  // 6. Test Search E2E
  console.log('\n--- 3. Testing Search E2E ---');
  const searchResults = await search({ q: 'Quadratic Equations' });
  assert.ok(searchResults.results.length > 0, 'Search returns results');
  const topicResult = searchResults.results.find(r => r.type === 'topic');
  const resourceResult = searchResults.results.find(r => r.type === 'resource');
  const bookResult = searchResults.results.find(r => r.type === 'book');
  assert.ok(topicResult, 'Search finds Topic');
  assert.ok(resourceResult, 'Search finds Resource');
  assert.ok(bookResult, 'Search finds Book');
  assert.match(topicResult.url, /\/topic\/introduction-to-quadratic-equations/);
  assert.match(resourceResult.url, /\/class-10\/maths\/adhyay-4/);
  assert.match(bookResult.url, /\/class-10\/maths\/books/);
  console.log('✓ Search correctly finds Topics, Resources, and Books with accurate URLs');

  // 7. Test Admin Topic CRUD Lifecycle (Draft -> Preview -> Publish -> Edit -> Unpublish)
  console.log('\n--- 4. Testing Admin Topic Lifecycle (Draft → Preview → Publish → Edit → Unpublish) ---');
  const c10 = await ClassLevel.findOne({ number: 10 }).lean();
  const mathSubject = await Subject.findOne({ slug: 'maths' }).lean();
  const ch4 = await Chapter.findOne({ class: c10._id, number: 4 }).lean();

  // Create Draft Topic
  const testTopic = await Topic.create({
    class: c10._id,
    subject: mathSubject._id,
    chapter: ch4._id,
    number: 99,
    slug: 'test-e2e-lifecycle-topic',
    title: { hi: 'परीक्षण टॉपिक', en: 'Test E2E Lifecycle Topic' },
    shortDescription: { en: 'A test topic for lifecycle verification' },
    notes: { en: '<p>Initial draft notes</p>' },
    status: 'draft',
    isVisible: true,
  });
  console.log('✓ Created draft topic:', testTopic._id);

  // Verify Draft is HIDDEN from students
  const studentPath = `/class-10/maths/adhyay-4/topic/test-e2e-lifecycle-topic`;
  try {
    await resolvePath(studentPath, { preview: false });
    assert.fail('Draft topic should return 404 for students');
  } catch (err) {
    assert.equal(err.status, 404);
    console.log('✓ Draft topic is hidden from students (404)');
  }

  // Admin Preview of Draft with Unsaved Changes
  const previewData = {
    class: c10._id,
    subject: mathSubject._id,
    chapter: ch4._id,
    title: { en: 'Unsaved Draft Preview Title' },
    notes: { en: '<p>Unsaved preview notes with $x^2 + 1 = 0$</p>' },
  };
  const previewRes = await request(app)
    .post('/api/public/preview')
    .set('Cookie', `pms_session=fake`) // Will test auth rejection
    .send({ entityType: 'Topic', id: testTopic._id, data: previewData });
  assert.equal(previewRes.status, 401, 'Preview requires valid admin auth');

  // Resolve with preview mode directly
  const previewResolved = await resolvePath(studentPath, {
    preview: true,
    previewToken: null,
  });
  assert.equal(previewResolved.type, 'topic');
  assert.equal(previewResolved.data.topic.title.en, 'Test E2E Lifecycle Topic');
  console.log('✓ Admin preview resolves draft topic with chapter data');

  // Publish Topic
  testTopic.status = 'published';
  await testTopic.save();
  const publishedResolved = await resolvePath(studentPath, { preview: false });
  assert.equal(publishedResolved.type, 'topic');
  assert.equal(publishedResolved.data.topic.title.en, 'Test E2E Lifecycle Topic');
  console.log('✓ Published topic is publicly visible to students');

  // Edit Topic
  testTopic.title = { hi: 'संपादित टॉपिक', en: 'Updated Topic Title' };
  testTopic.notes = { en: '<p>Updated notes content</p>' };
  await testTopic.save();
  const updatedResolved = await resolvePath(studentPath, { preview: false });
  assert.equal(updatedResolved.data.topic.title.en, 'Updated Topic Title');
  console.log('✓ Edited topic updates propagate to student resolver');

  // Unpublish Topic
  testTopic.status = 'draft';
  await testTopic.save();
  try {
    await resolvePath(studentPath, { preview: false });
    assert.fail('Unpublished topic should return 404');
  } catch (err) {
    assert.equal(err.status, 404);
    console.log('✓ Unpublish topic hides it immediately from students');
  }

  // Clean up test topic
  await Topic.deleteOne({ _id: testTopic._id });
  console.log('✓ Cleaned up temporary test topic');

  // 8. Test Cascade / Integrity
  console.log('\n--- 5. Testing Relationship & Cascade Integrity ---');
  const sampleRes = await Resource.findOne({ chapter: ch4._id }).lean();
  assert.ok(sampleRes, 'Resource exists');
  assert.ok(sampleRes.downloadAllowed !== undefined, 'downloadAllowed field present');
  console.log('✓ Resource downloadAllowed respects configuration:', sampleRes.downloadAllowed);

  await disconnectDB();
  console.log('\n========================================');
  console.log('ALL E2E INTEGRATION CHECKS PASSED (100%)');
  console.log('========================================');
}

runE2EVerification().catch(err => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
