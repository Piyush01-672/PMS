import {
  AlignLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useL10n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const STUDY_MATERIAL_LINKS = [
  { slug: 'ncert-solutions', label: { hi: 'NCERT समाधान', en: 'NCERT Solutions' }, icon: CheckCircle2 },
  { slug: 'ncert-books', label: { hi: 'NCERT पुस्तकें', en: 'NCERT Books' }, icon: BookOpen },
  { slug: 'ncert-notes', label: { hi: 'NCERT नोट्स व सूत्र', en: 'NCERT Notes' }, icon: FileText },
  { slug: 'cbse-sample-papers', label: { hi: 'CBSE सैंपल पेपर्स', en: 'CBSE Sample Papers' }, icon: FileSpreadsheet },
  { slug: 'extra-questions', label: { hi: 'अतिरिक्त अभ्यास प्रश्न', en: 'Extra Questions' }, icon: HelpCircle },
  { slug: 'important-questions', label: { hi: 'महत्वपूर्ण प्रश्न (बोर्ड)', en: 'Important Questions' }, icon: Sparkles },
  { slug: 'english-summaries', label: { hi: 'अंग्रेजी / कॉन्सेप्ट सारांश', en: 'English Summaries' }, icon: AlignLeft },
  { slug: 'syllabus', label: { hi: 'पाठ्यक्रम (Syllabus)', en: 'CBSE Syllabus' }, icon: GraduationCap },
];

export const REFERENCE_BOOK_LINKS = [
  { slug: 'rs-aggarwal', label: { hi: 'आर.एस. अग्रवाल समाधान', en: 'RS Aggarwal Solutions' }, badge: 'CBSE' },
  { slug: 'rd-sharma', label: { hi: 'आर.डी. शर्मा समाधान', en: 'RD Sharma Solutions' }, badge: 'CBSE' },
  { slug: 'ml-aggarwal', label: { hi: 'एम.एल. अग्रवाल समाधान', en: 'ML Aggarwal Solutions' }, badge: 'ICSE/CBSE' },
];

const CLASSES = [12, 11, 10, 9, 8, 7, 6];

export function StudySidebar({ currentCategory, currentBook, currentClass, chapters = [], className }) {
  const t = useL10n();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className={cn('space-y-6', className)}>
      {/* Chapter index if available */}
      {chapters.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <h3 className="font-heading text-sm font-bold text-foreground">
              {currentClass ? `Class ${currentClass.number || currentClass} Chapters` : 'Chapters'}
            </h3>
            <span className="text-xs text-muted-foreground">{chapters.length} Total</span>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {chapters.map((ch) => {
              const isActive = pathname.includes(ch.slug) || pathname.endsWith(`/${ch.number}`);
              return (
                <Link
                  key={ch._id || ch.number}
                  to={ch.url}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                    isActive
                      ? 'bg-brand/10 font-bold text-brand'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="truncate">
                    <span className="font-bold">Ch {ch.number}:</span> {t(ch.title) || `Chapter ${ch.number}`}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Study Materials Menu */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 border-b pb-2">
          <Layers className="size-4 text-brand" />
          <h3 className="font-heading text-sm font-bold text-foreground">Study Materials</h3>
        </div>
        <ul className="space-y-1">
          {STUDY_MATERIAL_LINKS.map((item) => {
            const Icon = item.icon;
            const targetUrl = currentClass
              ? `/study-materials/${item.slug}/class-${currentClass.number || currentClass}`
              : `/study-materials/${item.slug}`;
            const isActive = pathname.startsWith(`/study-materials/${item.slug}`);

            return (
              <li key={item.slug}>
                <Link
                  to={targetUrl}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition',
                    isActive
                      ? 'bg-brand text-brand-foreground shadow-xs'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-brand-foreground' : 'text-brand')} />
                    <span className="truncate">{t(item.label)}</span>
                  </span>
                  <ChevronRight className={cn('size-3.5 shrink-0', isActive ? 'text-brand-foreground/70' : 'text-muted-foreground')} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Reference Book Solutions */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 border-b pb-2">
          <BookOpen className="size-4 text-brand" />
          <h3 className="font-heading text-sm font-bold text-foreground">Reference Solutions</h3>
        </div>
        <ul className="space-y-1">
          {REFERENCE_BOOK_LINKS.map((b) => {
            const targetUrl = currentClass
              ? `/reference-solutions/${b.slug}/class-${currentClass.number || currentClass}`
              : `/reference-solutions/${b.slug}`;
            const isActive = pathname.startsWith(`/reference-solutions/${b.slug}`);

            return (
              <li key={b.slug}>
                <Link
                  to={targetUrl}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition',
                    isActive
                      ? 'bg-brand text-brand-foreground shadow-xs'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="truncate">{t(b.label)}</span>
                  <span
                    className={cn(
                      'ml-1.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {b.badge}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="pt-1">
            <Link
              to="/reference-solutions"
              className="block rounded-lg px-2 py-1.5 text-center text-xs font-bold text-brand hover:underline"
            >
              All Reference Books →
            </Link>
          </li>
        </ul>
      </div>

      {/* Quick Class Selection */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <h3 className="mb-2 text-xs font-extrabold tracking-wider text-muted-foreground uppercase">Classes 6 to 12</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {CLASSES.map((num) => {
            const isCurrent = currentClass && (currentClass.number === num || currentClass === num);
            const classUrl = currentCategory
              ? `/study-materials/${currentCategory.slug || currentCategory}/class-${num}`
              : currentBook
                ? `/reference-solutions/${currentBook.slug || currentBook}/class-${num}`
                : `/class-${num}/maths`;

            return (
              <Link
                key={num}
                to={classUrl}
                className={cn(
                  'grid h-8 place-items-center rounded-lg border text-xs font-extrabold transition',
                  isCurrent
                    ? 'border-brand bg-brand text-white'
                    : 'bg-background hover:border-brand hover:text-brand',
                )}
              >
                {num}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
