import { Download, Eye, FileSpreadsheet, FileText, Filter, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { PdfViewerDialog } from '@/components/content/PdfViewerDialog.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export default function ResourcesListPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  const { class: cls, subject, resources = [] } = data;
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // PDF Preview modal state
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);

  const resourceTypes = [
    { id: 'all', label: 'All Resources / सभी सामग्री' },
    { id: 'notes', label: 'Chapter Notes / नोट्स' },
    { id: 'formula_sheet', label: 'Formula Sheets / सूत्र पत्रक' },
    { id: 'worksheet', label: 'Worksheets & Assignments' },
    { id: 'practice_paper', label: 'Practice & Sample Papers' },
    { id: 'solution', label: 'Solutions / हल' },
    { id: 'revision', label: 'Revision Material' },
  ];

  const filteredResources = resources.filter((r) => {
    if (selectedType !== 'all' && r.resourceType !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (t(r.title) || '').toLowerCase();
      const desc = (t(r.description) || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    }
    return true;
  });

  const handleOpenPdf = (url, title, canDownload = true) => {
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setDownloadAllowed(canDownload);
  };

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark="PDFs"
        eyebrow={
          <div className="flex items-center gap-2">
            <Chip tone="brand">{term('class')} {cls.number}</Chip>
            <Chip>Study Material & PDFs</Chip>
          </div>
        }
        title={{
          hi: `कक्षा ${cls.number} गणित पीडीएफ नोट्स, वर्कशीट्स व सूत्र`,
          en: `Class ${cls.number} Mathematics PDF Notes, Formula Sheets & Worksheets`,
        }}
        subtitle="Free downloadable chapter notes, formula sheets, practice worksheets and previous-year question papers"
      />

      <div className="container-page py-8">
        {/* Filters & Search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Type Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedType === type.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search PDF or worksheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((res) => {
              const title = t(res.title) || 'Study Material PDF';
              const desc = t(res.description);
              const fileUrl = res.fileUrl || res.file?.url;

              return (
                <div
                  key={res._id}
                  className="flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand uppercase">
                        <FileText className="size-3" />
                        {res.resourceType?.replace(/_/g, ' ')}
                      </span>
                      {res.fileSize && <span className="text-[11px] font-medium text-muted-foreground">{res.fileSize}</span>}
                    </div>

                    <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>
                    {desc && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{desc}</p>}

                    {res.chapter && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        <strong>Chapter:</strong> {t(res.chapter.title)}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t pt-3">
                    {fileUrl ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPdf(fileUrl, title, res.downloadAllowed !== false)}
                          className="flex-1 text-xs font-semibold"
                        >
                          <Eye className="mr-1.5 size-3.5" />
                          Preview
                        </Button>
                        {res.downloadAllowed !== false && (
                          <Button size="sm" asChild className="flex-1 text-xs font-semibold">
                            <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-1.5 size-3.5" />
                              Download
                            </a>
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">File unavailable</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Resources Found"
            description="No downloadable resources or PDFs found matching the current filter."
          />
        )}
      </div>

      {/* PDF Modal Viewer Dialog */}
      <PdfViewerDialog
        open={Boolean(activePdfUrl)}
        onOpenChange={(isOpen) => !isOpen && setActivePdfUrl(null)}
        url={activePdfUrl}
        title={activePdfTitle}
        downloadAllowed={downloadAllowed}
      />
    </>
  );
}
