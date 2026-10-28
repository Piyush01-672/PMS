# CMS editor upgrade verification

## Math first

The affected saved Exercise 2.1 record has escaped math placeholder HTML in its English description and a spurious trailing `$` inside `data-latex`. Its Mixed description has clean bare LaTeX. This explains why the Mixed admin preview worked while the English student output failed. Formula-only content was also previously discarded by language/content checks. These compatibility repairs remain shared by the editor and public renderer; no existing record needs to be rewritten.

The editor inserts atomic TipTap math nodes. HTML serialization stores the LaTeX and inline/display mode, not rendered KaTeX HTML. Formula validation now normalizes supported delimiters consistently. Invalid new formulas cannot be inserted through the dialog. Invalid saved nodes show a readable fallback while retaining their source for editing. Existing safe legacy placeholders and all four delimiter styles remain supported. Ordinary prose is preserved.

## Shared content architecture

Every existing rich-text field uses RichTextEditor, normally through RichL10nField. The former minimal flag hid images and formatting in Description, Instructions and short answers. Those fields now share one toolbar, with separate insert, edit and convert math actions and one image button. The dialog keeps its existing formula presets.

RichContent sanitizes CMS HTML before using the same math renderer as the admin preview. ExercisePage now renders saved exercise Notes as well as Description and Instructions. KaTeX CSS and fonts remain imported by the shared frontend entry point.

## Images

ImageDialog reuses the existing MediaPicker and MediaUploader, authenticated media API, configured upload limits and storage provider. It supports uploaded/library images and HTTP(S) or local uploaded URLs, preview, required alt text, optional plain-text captions, left/center/right alignment, percentage/pixel width, replacement and removal. Height remains automatic to preserve aspect ratio; images and figures are bounded by the content container. New image insertion uses the saved cursor position and preserves selected surrounding text.

ContentImage serializes a figure, image and optional figcaption. The server sanitizer preserves only the expected attributes and constrained width styles. Base64, JavaScript, file and protocol-relative image URLs cannot be inserted. Upload validation checks file signatures and server-side size/permission limits. GIF support joins the existing PNG/JPEG/WebP/SVG support.

Production configuration currently selects Cloudinary. Tests use the isolated local-storage adapter; the existing Cloudinary implementation and credentials remain server-side. No new environment variables, storage account or database migration is required. MAX_UPLOAD_MB and the existing STORAGE_PROVIDER/CLOUDINARY_* settings continue to apply.

Embedded rich-text image URLs are now included in media usage checks. Library deletion is blocked while content refers to a file. Library replacement is also blocked for embedded URLs: replace the image through the editor first, so another page cannot silently lose its old image.

## Fresh content

Existing server cache invalidation and publication permissions remain in force. Admin saves invalidate resolved content in React Query; public pages revalidate when revisited or focused. Draft records remain inaccessible to anonymous public resolution.

## Files changed in this upgrade

| File | Responsibility |
| --- | --- |
| client/src/admin/components/fields/RichTextEditor.jsx | Shared toolbar, math validation/paste handling, cursor-preserving image insertion, editor lifecycle guard |
| client/src/admin/components/fields/ContentImage.js | Structured image serialization, URL/width validation |
| client/src/admin/components/fields/ImageDialog.jsx | Image preview, settings, replacement/removal and existing media picker integration |
| client/src/admin/components/fields/FormulaInput.jsx | Delimiter-aware validation |
| client/src/admin/components/fields/MathNode.js | Readable invalid-formula fallback |
| client/src/admin/components/media/MediaPicker.jsx | GIF selection, upload limit feedback, preview URL cleanup |
| client/src/components/content/MathFormula.jsx | Consistent normalization and invalid-formula fallback |
| client/src/components/content/renderMathContent.js | Shared student math rendering and scoped legacy support |
| client/src/pages/content/ExercisePage.jsx | Render saved exercise Notes |
| client/src/pages/ContentPage.jsx | Revalidate published data on revisits/focus |
| client/src/admin/lib/resources.js | Invalidate resolved public content after admin saves |
| client/src/index.css | Responsive figures, alignment and captions |
| server/src/lib/imageInfo.js | GIF file signature/dimensions |
| server/src/lib/sanitize.js | Preserve constrained figure metadata/styles |
| server/src/routes/media.js | GIF uploads, authorized upload configuration, embedded-file replacement protection |
| server/src/services/usage.js | Find embedded rich-text image references |
| client/tests/math.test.js | Math, image, formatting and security regressions |
| server/tests/rich-content.test.js | Upload/save/database/public API/cache/permission regressions |

Earlier uncommitted fixes, including TopicPage and server/tests/content.test.js, were preserved.

## Validation

- `npm test --workspace client`: 12 passed. Includes the exact saved trailing-dollar corruption, inline/display nodes, all four delimiters, escaped placeholders, idempotence, advanced notation, prose/XSS checks and mixed image/math serialization through server sanitization and editor reopening.
- `npm test`: 34 passed. Includes uploads and saved Description/Instructions/Notes compared against MongoDB, admin retrieval and public resolution; cache primed before saving; GIF acceptance/fake-file rejection; anonymous upload/edit rejection; draft visibility; embedded image delete/replace protection.
- `npm run build`: passed. Existing large-chunk warning remains. No lint or type-check scripts are configured.
- Browser verification used the production build with an isolated database: inserted the quadratic formula through its actual dialog, inserted uploaded images in all three editors with captions/size/alignment, saved, reopened, added an inline inequality and a display matrix, saved again, and refreshed the public student exercise route. Observed three rendered equations, three image figures and the Notes section; no math error placeholders.
- Browser image replacement, removal and undo were exercised, followed by saving and refreshing the student page.
- The original Class 12 Exercise 2.1 route was also checked against the existing configured database without rewriting its content.
- Actual phone/tablet visual testing and an upload to the live Cloudinary account were not performed. Responsive CSS constraints and saved width/alignment were checked locally.

## Deployment

Deploy both backend and frontend, because this upgrade changes upload validation, sanitization and media usage checks as well as the editor. From the repository root run `npm ci`, `npm test`, `npm test --workspace client`, and `npm run build`. Deploy the resulting client/dist and restart/redeploy the existing backend using its established hosting process. The local frontend is available at http://localhost:5173 and its API at http://localhost:5000. No database migration or content re-entry is needed.
