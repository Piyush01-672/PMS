import { PNG_1x1, createAdmin, login, startServer, stopServer } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import request from 'supertest';
import { Exercise } from '../src/models/index.js';
let app, owner, id, media;
const route = '/class-12/maths/adhyay-2/prashnavali-2-1';
const latex = String.raw`\frac{3}{4}x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`;
before(async()=>{
 ({app}=await startServer()); await createAdmin({email:'rich@test.local'}); owner=await login(app,'rich@test.local');
 const subject=await owner.post('/api/subjects').send({name:{en:'Maths'},slug:'maths',isPublic:true,status:'published'});
 const cls=await owner.post('/api/classes').send({number:12,name:{en:'Class 12'},subjects:[subject.body._id],status:'published'});
 const chapter=await owner.post('/api/chapters').send({class:cls.body._id,subject:subject.body._id,number:2,title:{en:'Inverse Trigonometric Functions'},status:'published'});
 const ex=await owner.post('/api/exercises').send({chapter:chapter.body._id,number:'2.1',status:'published'}); assert.equal(ex.status,201);id=ex.body._id;
});
after(stopServer);
test('upload and save mixed image/math content in all three fields, reopen and resolve updated published content',async()=>{
 const upload=await owner.post('/api/media/upload').field('altEn','Diagram').attach('files',PNG_1x1,'diagram.png'); assert.equal(upload.status,201);media=upload.body.items[0];
 // Prime the public cache before saving; the next public read must return the change.
 await request(app).get('/api/public/resolve').query({path:route});
 const content={};
 for(const [index,field] of ['description','instructions','notes'].entries()) content[field]={en:`<h2>${field}</h2><p>Before <span class="math-inline" data-type="math" data-latex="x_i^2"></span> after.</p><figure data-image="" data-align="${['left','center','right'][index]}" style="width: 50%"><img src="${media.url}" alt="Diagram ${field}"><figcaption>Figure ${index+1}</figcaption></figure><p><span class="math-display" data-type="math" data-latex="${latex}"></span></p><ul><li>Preserved text</li></ul><script>alert(1)</script>`};
 const saved=await owner.put(`/api/exercises/${id}`).send(content);assert.equal(saved.status,200);
 const reopened=await owner.get(`/api/exercises/${id}`);const stored=await Exercise.findById(id).lean();
 const publicRead=await request(app).get('/api/public/resolve').query({path:route});assert.equal(publicRead.status,200);
 for(const field of Object.keys(content)){
  const html=saved.body[field].en;assert.ok(html.includes(latex));assert.ok(html.includes(media.url));assert.match(html,/width:50%/);assert.ok(!html.includes('<script>'));
  assert.equal(stored[field].en,html);assert.equal(reopened.body[field].en,html);assert.equal(publicRead.body.data.exercise[field].en,html);
 }
 assert.equal((await request(app).get(media.url)).status,200);
 assert.equal((await owner.del(`/api/media/${media._id}`)).status,409,'embedded image cannot be deleted while content uses it');
 assert.equal((await owner.post(`/api/media/${media._id}/replace`).attach('file',PNG_1x1,'replacement.png')).status,409,'library replacement must not break embedded durable URLs');
 const refreshed=await request(app).get('/api/public/resolve').query({path:route});assert.equal(refreshed.body.data.exercise.notes.en,saved.body.notes.en);
});
test('GIF magic-byte validation, upload limits and permission checks remain enforced',async()=>{
 const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
 const upload=await owner.post('/api/media/upload').attach('files',gif,'animated.gif');assert.equal(upload.status,201);assert.equal(upload.body.items[0].mimeType,'image/gif');
 assert.equal((await request(app).get(upload.body.items[0].url)).headers['content-type'],'image/gif');
 assert.equal((await owner.post('/api/media/upload').attach('files',Buffer.from('not a gif'),'fake.gif')).status,400);
 const config=await owner.get('/api/media/upload-config');assert.equal(config.status,200);assert.ok(config.body.maxBytes>0);
 assert.equal((await request(app).get('/api/media/upload-config')).status,401);
 assert.equal((await request(app).post('/api/media/upload').attach('files',PNG_1x1,'image.png')).status,401);
 assert.equal((await request(app).put(`/api/exercises/${id}`).send({description:{en:'changed'}})).status,401);
 await owner.patch(`/api/exercises/${id}/status`).send({status:'draft'});
 assert.equal((await request(app).get('/api/public/resolve').query({path:route})).status,404);
});
