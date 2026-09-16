# Passion Maths Study (PMS)

NCERT Mathematics for Class 6–12: chapter-wise (अध्याय) and exercise-wise (प्रश्नावली) step-by-step solutions in Hindi, English and mixed Hindi-English.

Everything students see comes from MongoDB and is managed in the admin panel. This includes classes, chapters, exercises, questions, solution blocks, images, diagrams, YouTube videos, notes, the homepage, header, footer, menus, terminology and SEO. Normal content changes never need a code change.

| Part | Stack |
| --- | --- |
| Student website + admin panel | React 19, Vite, Tailwind CSS 4, shadcn/ui (Radix), GSAP + ScrollTrigger, Framer Motion, TanStack Query, React Router, TipTap, KaTeX, dnd-kit |
| API | Node.js, Express 5, MongoDB + Mongoose, JWT (httpOnly cookie) + server-side sessions, bcrypt, TOTP 2FA, Multer, Cloudinary, Helmet, rate limiting, Zod |

---

## 1. Project structure

```
client/                     React app (student website + admin panel)
  public/brand/pms-logo.png Default logo (replaceable from the Media Library)
  src/pages/                Public pages; every URL is resolved by the API
  src/components/content/   QuestionCard, SolutionRenderer, KaTeX, ImageViewer, YouTubeEmbed…
  src/components/home/      Homepage section renderer (one component per section type)
  src/components/site/      Header, mobile menu, footer, search, breadcrumbs, SEO, ad slots
  src/admin/                Admin CMS (lazy-loaded, private URL)
server/
  src/models/               Mongoose models (see §6)
  src/routes/               REST API
  src/services/             Page resolver, search, related content, SEO/sitemap, backups
  src/seed/                 Starter content (normal database content — edit or delete it in the admin)
  tests/                    API test suite (auth, security, content, media, backups)
```

## 2. Local setup

Requirements: **Node.js 20.19+** and **MongoDB 7+** (local or Atlas).

```bash
npm run install:all
```

1. Copy `server/.env.example` to `server/.env` and fill it in. Generate each secret (`JWT_SECRET`, `CSRF_SECRET`, `ENCRYPTION_KEY`) with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
2. Copy `client/.env.example` to `client/.env`. `VITE_ADMIN_PATH` must match the server's `ADMIN_PATH`.
3. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `server/.env`, then load the starter content and create the owner account:
   ```bash
   npm run seed
   ```
   `npm run seed -- --reset` (run inside `server/`) wipes website content and reloads the starter set. Admin accounts, activity logs and backups are kept.
4. Start both apps:
   ```bash
   npm run dev
   ```
   - Website: http://localhost:5173
   - Admin: http://localhost:5173/pms-control-room/login (or your `ADMIN_PATH`)

Sign in with the seed owner account, then go to **My Account & 2FA** and change the password and turn on two-factor authentication.

Run the API tests (uses a temporary `pms_test_*` database):

```bash
npm test
```

Run the end-to-end browser tests. They use the Chrome installed on the computer (set `PW_CHANNEL=msedge` to use Edge instead), build the site, reset a separate `pms_e2e` database, and test the admin panel and student site together:

```bash
npm run test:e2e
```

Failure screenshots, traces and an HTML report are saved in `e2e-results/`.

## 3. How content is organised

```
Class → Mathematics → अध्याय (Chapter) → प्रश्नावली (Exercise) → Question → Solution blocks → Diagram / Graph / Image → Final answer
```

URLs are generated from slugs set in the admin:

| Page | Example URL |
| --- | --- |
| Class (redirects to its only subject) | `/class-9` |
| Class Mathematics | `/class-9/maths` |
| प्रश्नावली-wise list | `/class-9/maths/prashnavali` |
| Notes / Important questions | `/class-9/maths/notes`, `/class-9/maths/important-questions` |
| अध्याय | `/class-9/maths/adhyay-5` |
| प्रश्नावली | `/class-9/maths/adhyay-5/prashnavali-5-2` |
| Question | `/class-9/maths/adhyay-5/prashnavali-5-2/prashn-3` |
| Static page | `/about-us`, `/privacy-policy` |

**Adding a question** (Admin → Questions → New question):
1. Choose Class → अध्याय → प्रश्नावली and enter the question number.
2. Type the question in हिंदी, English and/or Mixed. Use the Σ button or `$…$` / `$$…$$` for LaTeX.
3. Attach any number of figures, diagrams, graphs or construction images. Each image can show with the question or below the solution.
4. Paste a YouTube URL and choose where the player appears. You can also add a YouTube block between solution steps.
5. Build the solution from blocks: Text, Hindi, English, Mixed, Explanation, Step, Calculation, Steps of construction, Formula, Table, Image, Diagram, Graph, YouTube, Note, Tip, Warning, Final answer. Drag blocks into any order, or start from a **Template**.
6. Click **Preview** to see desktop, tablet and mobile views, including unsaved changes. Then **Save draft**, **Publish**, or set a future publish date to schedule it.

**Languages.** The हिंदी / ENG switch changes the language students see. Nothing is ever machine-translated. Every text field has separate Hindi, English and Mixed versions, and each item or block has a language mode:
- **Auto:** follows the switch and falls back to the other language if one is missing.
- **Hindi only / English only:** always shows that language.
- **Mixed:** always shows the Hindi-English version exactly as typed.

Frontend labels live in **Admin → Language → Terminology**. The defaults use "अध्याय" and "प्रश्नावली" in both languages, as the requirement specifies.

**Safe deleting.** A class, अध्याय or प्रश्नावली that still contains children cannot be deleted. Deleting a question removes only that question and its solution. Images and videos that are in use ask for confirmation and list where they are used.

## 4. Admin roles

| Role | Can do |
| --- | --- |
| Editor | Create and edit drafts, upload media |
| Admin | Everything an editor can, plus publish/unpublish, delete, website settings, homepage, menus, activity logs, create backups |
| Owner (superadmin) | Everything, plus manage admins, download/restore/delete backups, edit advertisement code |

Admin security:
- Private admin URL (`ADMIN_PATH`, never `/admin`)
- bcrypt password hashing and a strong password policy
- httpOnly `SameSite=Strict` session cookie backed by a server-side session, with idle and absolute expiry
- CSRF token plus Origin check on every state-changing request
- Login rate limiting, and a 15-minute lockout after 5 failed attempts
- TOTP two-factor authentication (`REQUIRE_2FA=true` forces it for every admin)
- Helmet security headers and CSP
- MongoDB operator/prototype sanitisation and Zod validation
- Rich text sanitised on the server and again in the browser
- Uploaded files checked by their real image bytes; SVGs cleaned of scripts
- Everything logged in the activity log

## 5. Media

- **Cloudinary (recommended for production):** set the three `CLOUDINARY_*` variables. Images get automatic format, quality and responsive `srcset`.
- **Local disk (development):** without Cloudinary, files go to `server/uploads/` and are served with a sandboxing CSP.

MongoDB stores only metadata: URL, public ID, alt text, title, caption, width, height, size and dates. Replacing a file keeps the same media ID, so every page that uses it updates.

## 6. Database models

`Admin`, `User`, `Session`, `SiteSettings`, `Navigation`, `Announcement`, `Page`, `Class`, `Subject`, `Chapter`, `Exercise`, `Question`, `Solution` (ordered embedded `SolutionBlock`s), `Note`, `ImportantQuestion`, `Media`, `Video`, `Section`, `RelatedContent`, `SeoSetting`, `ActivityLog`, `Template`, `AdSlot`, `Backup`.

Content stores references, not copies. Every publishable model has `status` (draft / published / archived), `publishedAt` (future = scheduled), `isVisible`, `sortOrder`, `createdBy`, `updatedBy` and timestamps.

**Future subjects.** Subjects are records attached to classes. A new subject (Science, English…) stays private until you switch on **Public on the student website** in Admin → Classes → Subjects.

## 7. SEO

- In production, Express renders `<title>`, meta description, canonical, robots, Open Graph and JSON-LD into the HTML of every content URL, so crawlers see full metadata without running JavaScript.
- Schemas generated: BreadcrumbList, Article, WebPage, FAQPage, WebSite (SearchAction) and EducationalOrganization.
- `/sitemap.xml` is built from published, indexable content; `/robots.txt` points to it.
- Each class, अध्याय, प्रश्नावली, question, note and page has SEO fields: title, description, canonical, robots, H1, Open Graph and keywords. **Admin → SEO** lists published items that are missing them.

## 8. Production deployment

```bash
npm run install:all
npm run build                    # builds client/dist
NODE_ENV=production npm start    # one Node process serves the API and the website
```

Production environment checklist:
- `NODE_ENV=production`
- `PUBLIC_SITE_URL=https://your-domain`
- `CLIENT_ORIGINS=https://your-domain`
- MongoDB Atlas (or another managed MongoDB) URI with a dedicated database user
- Cloudinary keys
- New random secrets
- A private `ADMIN_PATH`, matching `VITE_ADMIN_PATH` **at build time**
- `REQUIRE_2FA=true`
- `BACKUP_EXTERNAL_DIR` or `BACKUP_CLOUDINARY=true`

Recommended hosting:
- Run the Node process under PM2 or systemd behind Nginx or Caddy.
- Put Cloudflare in front: SSL/TLS "Full (strict)", "Always Use HTTPS", WAF managed rules, bot protection.
- Add a rate-limiting rule for `/api/auth/*` and optionally restrict `ADMIN_PATH` with Cloudflare Access.
- Keep `TRUST_PROXY=1` (one proxy hop) so rate limits and logs use the real client IP.

Ads: create the Privacy Policy (and a consent banner where required) before switching on AdSense in **Admin → Ad Spaces**. Ad code runs in a sandboxed iframe with reserved height, so it never covers questions or shifts the layout.

## 9. Backups & disaster recovery

- **Automatic daily backup** (`BACKUP_CRON`, default 02:30 IST). The full database is exported as gzipped Extended JSON, verified, copied to a **second location** (`BACKUP_EXTERNAL_DIR` or private Cloudinary), and old backups are pruned after `BACKUP_RETENTION_DAYS`.
- **Manual backup:** Admin → Backup, or `npm run backup` (safe to run from the OS scheduler).
- **Restore:** owner only, requires password + typing `RESTORE`. It verifies the file first and takes a safety backup of the current state. Admin accounts and activity logs are never overwritten.
- **Uploaded images:** with Cloudinary they live in Cloudinary. With local storage they are mirrored to `BACKUP_EXTERNAL_DIR/uploads` on each backup.

Recovery procedure (target under 15 minutes):
1. Provision a server with the same code and `.env`.
2. Point `MONGODB_URI` at a new database and start the app.
3. Run `npm run create-admin`.
4. Copy the latest backup file into `server/backups` and restore it from the admin panel.
5. Check a few pages, then switch DNS / Cloudflare.

Rehearse a restore on a staging copy regularly.

## 10. Ownership & handover checklist

- [ ] Domain registered with the owner's email and mobile number
- [ ] Hosting, Cloudflare, MongoDB Atlas and Cloudinary accounts owned by the owner (developer access added as a member, never as the primary account)
- [ ] Full source code repository transferred to the owner
- [ ] Owner has the superadmin account and 2FA enabled; developer admin accounts removed or downgraded
- [ ] Owner has changed every master password and regenerated `JWT_SECRET`, `CSRF_SECRET` and `ENCRYPTION_KEY` (this signs everyone out)
- [ ] Credentials handed over through a password manager, never a plain-text document
- [ ] Backup schedule confirmed, second backup location confirmed, one test restore completed
