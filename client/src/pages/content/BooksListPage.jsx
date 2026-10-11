import { BookOpen, ExternalLink, Filter, Search, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export default function BooksListPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  const { class: cls, subject, books = [] } = data;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Books / सभी पुस्तकें' },
    { id: 'recommended', label: 'Recommended / अनुशंसित' },
    { id: 'ncert', label: 'NCERT Mathematics' },
    { id: 'reference', label: 'Reference Books (RD Sharma, RS Aggarwal)' },
    { id: 'exam_prep', label: 'Exam Preparation & Sample Papers' },
    { id: 'practice', label: 'Practice & Workbooks' },
    { id: 'olympiad', label: 'Olympiad & Competitive Maths' },
  ];

  const filteredBooks = books.filter((b) => {
    if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (t(b.title) || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const desc = (t(b.description) || '').toLowerCase();
      return title.includes(q) || author.includes(q) || desc.includes(q);
    }
    return true;
  });

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark="Books"
        eyebrow={
          <div className="flex items-center gap-2">
            <Chip tone="brand">{term('class')} {cls.number}</Chip>
            <Chip>Reference Books</Chip>
          </div>
        }
        title={{
          hi: `कक्षा ${cls.number} गणित संदर्भ पुस्तकें`,
          en: `Class ${cls.number} Mathematics Reference Books & NCERT Guides`,
        }}
        subtitle="Best recommended textbooks, solutions, and competitive mathematics guides with verified purchase links"
      />

      <div className="container-page py-8">
        {/* Filters & Search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by book or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((b) => {
              const title = t(b.title) || 'Mathematics Book';
              const desc = t(b.description);
              const rec = t(b.recommendedFor);
              const coverUrl = b.coverUrl || b.coverImage?.url;

              return (
                <div
                  key={b._id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:border-brand/40 hover:shadow-lg"
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-xl bg-muted shadow-md">
                        {coverUrl ? (
                          <img src={coverUrl} alt={title} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center bg-gradient-to-br from-amber-100 to-orange-200 text-orange-700 dark:from-amber-950 dark:to-orange-900 dark:text-orange-300">
                            <BookOpen className="size-10" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                          {b.category?.replace(/_/g, ' ') || 'Reference'}
                        </span>
                        <h3 className="mt-1.5 font-heading text-base font-bold leading-snug text-foreground">{title}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Author: {b.author}</p>
                        {b.publisher && <p className="text-[11px] text-muted-foreground">{b.publisher} {b.edition ? `• ${b.edition}` : ''}</p>}
                        {b.price && <p className="mt-1.5 text-sm font-extrabold text-brand">{b.price}</p>}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                      {rec && (
                        <p><strong className="text-foreground">Recommended for:</strong> {rec}</p>
                      )}
                      {desc && <p className="line-clamp-2">{desc}</p>}
                      {b.chapter && (
                        <p className="text-[11px] text-muted-foreground">Chapter: {t(b.chapter.title)}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t bg-muted/20 p-4">
                    {b.purchaseUrl ? (
                      <Button size="sm" className="w-full bg-orange-600 font-bold text-white hover:bg-orange-700" asChild>
                        <a href={b.purchaseUrl} target="_blank" rel="noopener noreferrer">
                          <ShoppingBag className="mr-1.5 size-3.5" />
                          Buy Book / खरीदें ↗
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full text-xs" disabled>
                        Available in Bookstores
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Books Found"
            description="No books found matching the selected category or search filter."
          />
        )}
      </div>
    </>
  );
}
