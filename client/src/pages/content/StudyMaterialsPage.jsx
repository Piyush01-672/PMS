import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  Sparkles,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { PdfViewerDialog } from '@/components/content/PdfViewerDialog.jsx';
import { StudySidebar } from '@/components/site/StudySidebar.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { ContentHeader } from './ContentHeader.jsx';

const ICONS = {
  CheckCircle2,
  BookOpen,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  GraduationCap,
  Layers,
};

export default function StudyMaterialsPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { level = 'hub', category, class: cls, categories = [], classes = [], chapters = [], resources = [], notes = [], featuredResources = [] } = data;

  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);

  const openPdf = (url, title, canDownload = true) => {
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setDownloadAllowed(canDownload);
  };

  // 1. HUB LEVEL: /study-materials
  if (level === 'hub') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark="Study"
          eyebrow={<Chip tone="brand">CBSE Classes 6 to 12</Chip>}
          title={{
            hi: 'गणित अध्ययन सामग्री व समाधान (Study Materials)',
            en: 'CBSE Maths Study Materials & Reference Solutions',
          }}
          subtitle="NCERT Solutions, Textbooks, Chapter Notes, Formula Sheets, CBSE Sample Papers, and Syllabus for Classes 6 to 12."
        />

        <div className="container-page py-10">
          {/* Class selection banner */}
          <div className="mb-10 rounded-3xl border bg-gradient-to-br from-brand/5 via-card to-amber-500/5 p-6 sm:p-8">
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">Select Your Class (अपनी कक्षा चुनें)</h2>
            <p className="mb-5 text-sm text-muted-foreground">Direct access to NCERT solutions, chapter notes, and sample papers:</p>
            <div className="flex flex-wrap gap-2.5">
              {classes.map((c) => (
                <Link
                  key={c.number}
                  to={`/class-${c.number}/maths`}
                  className="group flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm font-bold shadow-xs transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-brand/10 text-xs font-extrabold text-brand transition group-hover:bg-white group-hover:text-brand">
                    {c.number}
                  </span>
                  <span>Class {c.number}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              {/* Category Grid */}
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-foreground">Study Material Categories</h2>
                    <p className="text-xs text-muted-foreground">Select a category to view class-wise downloadable resources</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {categories.map((cat) => {
                    const IconComponent = ICONS[cat.icon] || FileText;
                    return (
                      <Link
                        key={cat.slug}
                        to={`/study-materials/${cat.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                      >
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                              <IconComponent className="size-5" />
                            </span>
                            <span className="text-xs font-bold text-muted-foreground transition group-hover:text-brand">
                              Classes 6–12
                            </span>
                          </div>
                          <h3 className="font-heading text-base font-bold text-foreground group-hover:text-brand">
                            {t(cat.name)}
                          </h3>
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                            {t(cat.shortDesc)}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-bold text-brand">
                          Explore Category <ArrowRight className="ml-1 size-3.5 transition group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Featured downloads */}
              {featuredResources.length > 0 && (
                <section className="rounded-3xl border bg-card p-6">
                  <div className="mb-4 flex items-center justify-between border-b pb-3">
                    <h2 className="font-heading text-base font-bold text-foreground">Popular Study Downloads & PDFs</h2>
                    <span className="text-xs text-muted-foreground">Free Downloads</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {featuredResources.map((res) => (
                      <div key={res._id} className="flex items-center justify-between rounded-xl border bg-background p-3 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-bold text-foreground">{t(res.title)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {res.class ? `Class ${res.class.number}` : ''} {res.fileSize ? `· ${res.fileSize}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {res.fileUrl && (
                            <Button size="icon-sm" variant="outline" onClick={() => openPdf(res.fileUrl, t(res.title), res.downloadAllowed)} title="View PDF">
                              <Eye className="size-3.5" />
                            </Button>
                          )}
                          {res.fileUrl && res.downloadAllowed !== false && (
                            <Button size="icon-sm" variant="ghost" asChild title="Download PDF">
                              <a href={res.fileUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="size-3.5 text-brand" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:col-span-4">
              <StudySidebar />
            </div>
          </div>
        </div>

        <PdfViewerDialog
          open={Boolean(activePdfUrl)}
          onOpenChange={(open) => !open && setActivePdfUrl(null)}
          url={activePdfUrl}
          title={activePdfTitle}
          downloadAllowed={downloadAllowed}
        />
      </>
    );
  }

  // 2. CATEGORY LEVEL: /study-materials/:categorySlug
  if (level === 'category') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark="Category"
          eyebrow={<Chip tone="brand">Study Materials</Chip>}
          title={category.name}
          subtitle={t(category.shortDesc)}
        />

        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              {/* Select Class for this category */}
              <section className="rounded-3xl border bg-card p-6 shadow-xs">
                <h2 className="mb-2 font-heading text-base font-bold text-foreground">
                  Select Class for {t(category.name)}
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Click on your class to view tailored chapter-wise resources, formulas, and download links:
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {classes.map((c) => (
                    <Link
                      key={c.number}
                      to={`/study-materials/${category.slug}/class-${c.number}`}
                      className="group flex items-center gap-2.5 rounded-xl border bg-background p-3 transition hover:border-brand hover:bg-brand hover:text-white"
                    >
                      <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-xs font-extrabold text-brand transition group-hover:bg-white group-hover:text-brand">
                        {c.number}
                      </span>
                      <span className="text-xs font-bold">Class {c.number}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Resource listing */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Available {t(category.name)} Resources
                  </h2>
                  <span className="text-xs text-muted-foreground">{resources.length} Available</span>
                </div>

                {resources.length === 0 ? (
                  <EmptyState
                    title="No materials uploaded yet"
                    description={`Administrators can upload ${t(category.name)} files and notes in the Admin Panel.`}
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {resources.map((res) => (
                      <div key={res._id} className="flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-xs transition hover:border-brand/40">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                              {res.class ? `Class ${res.class.number}` : 'General'}
                            </span>
                            {res.fileSize && <span className="text-[11px] text-muted-foreground">{res.fileSize}</span>}
                          </div>
                          <h3 className="font-heading text-sm font-bold text-foreground">{t(res.title)}</h3>
                          {res.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t(res.description)}</p>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t pt-3">
                          {res.chapter ? (
                            <Link to={res.chapter.url || '#'} className="truncate text-[11px] font-semibold text-muted-foreground hover:text-brand">
                              Ch {res.chapter.number}: {t(res.chapter.title)}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">General Resource</span>
                          )}

                          <div className="flex shrink-0 gap-1.5">
                            {res.fileUrl && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openPdf(res.fileUrl, t(res.title), res.downloadAllowed)}>
                                <Eye className="mr-1 size-3.5" /> View
                              </Button>
                            )}
                            {res.fileUrl && res.downloadAllowed !== false && (
                              <Button size="sm" variant="default" className="h-7 text-xs" asChild>
                                <a href={res.fileUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1 size-3.5" /> Download
                                </a>
                              </Button>
                            )}
                            {res.externalUrl && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <a href={res.externalUrl} target="_blank" rel="noopener noreferrer">
                                  Open
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-4">
              <StudySidebar currentCategory={category} />
            </div>
          </div>
        </div>

        <PdfViewerDialog
          open={Boolean(activePdfUrl)}
          onOpenChange={(open) => !open && setActivePdfUrl(null)}
          url={activePdfUrl}
          title={activePdfTitle}
          downloadAllowed={downloadAllowed}
        />
      </>
    );
  }

  // 3. CATEGORY + CLASS LEVEL: /study-materials/:categorySlug/class-:number
  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={`C${cls.number}`}
        eyebrow={
          <div className="flex items-center gap-2">
            <Chip tone="brand">Class {cls.number}</Chip>
            <Chip>{t(category.name)}</Chip>
          </div>
        }
        title={{
          hi: `कक्षा ${cls.number} गणित ${t(category.name)}`,
          en: `Class ${cls.number} Mathematics ${category.name?.en || t(category.name)}`,
        }}
        subtitle={`Free chapter-wise ${category.name?.en || t(category.name)}, PDF notes, solutions, and reference materials.`}
      />

      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Quick Class Switcher */}
            <div className="flex flex-wrap items-center gap-2 border-b pb-4">
              <span className="text-xs font-bold text-muted-foreground mr-1">Switch Class:</span>
              {classes.map((c) => {
                const isCurrent = c.number === cls.number;
                return (
                  <Link
                    key={c.number}
                    to={`/study-materials/${category.slug}/class-${c.number}`}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold transition',
                      isCurrent
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-muted text-foreground/80 hover:bg-brand/10 hover:text-brand',
                    )}
                  >
                    Class {c.number}
                  </Link>
                );
              })}
            </div>

            {/* Chapter-wise list */}
            {chapters.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Class {cls.number} Chapter-wise {t(category.name)}
                </h2>

                <div className="space-y-3">
                  {chapters.map((ch) => {
                    const chapterResources = resources.filter((r) => String(r.chapter?._id || r.chapter) === String(ch._id));
                    const pdfLink = ch.pdfFile?.url || ch.pdfUrl || chapterResources[0]?.fileUrl;

                    return (
                      <div key={ch._id} className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 transition hover:border-brand/40 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-brand">अध्याय {ch.number} / Chapter {ch.number}</span>
                          <h3 className="font-heading text-base font-bold text-foreground">
                            {t(ch.title)}
                          </h3>
                          {ch.shortDescription && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{t(ch.shortDescription)}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {pdfLink && (
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openPdf(pdfLink, `${t(ch.title)} PDF`)}>
                              <Eye className="mr-1 size-3.5" /> View PDF
                            </Button>
                          )}
                          {pdfLink && (
                            <Button size="sm" variant="default" className="h-8 text-xs" asChild>
                              <a href={pdfLink} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1 size-3.5" /> Download
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
                            <Link to={`/class-${cls.number}/maths/${ch.slug}`}>
                              Solutions →
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Direct uploaded files for this class */}
            {resources.length > 0 && (
              <section className="space-y-4 rounded-3xl border bg-card p-6">
                <h2 className="font-heading text-base font-bold text-foreground">
                  Additional Downloadable Resources & Worksheets
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {resources.map((res) => (
                    <div key={res._id} className="flex items-center justify-between rounded-xl border bg-background p-3 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-bold text-foreground">{t(res.title)}</p>
                        <p className="text-[11px] text-muted-foreground">{res.fileSize || 'PDF Document'}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {res.fileUrl && (
                          <Button size="icon-sm" variant="outline" onClick={() => openPdf(res.fileUrl, t(res.title), res.downloadAllowed)}>
                            <Eye className="size-3.5" />
                          </Button>
                        )}
                        {res.fileUrl && res.downloadAllowed !== false && (
                          <Button size="icon-sm" variant="ghost" asChild>
                            <a href={res.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="size-3.5 text-brand" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            <StudySidebar currentCategory={category} currentClass={cls} chapters={chapters} />
          </div>
        </div>
      </div>

      <PdfViewerDialog
        open={Boolean(activePdfUrl)}
        onOpenChange={(open) => !open && setActivePdfUrl(null)}
        url={activePdfUrl}
        title={activePdfTitle}
        downloadAllowed={downloadAllowed}
      />
    </>
  );
}
