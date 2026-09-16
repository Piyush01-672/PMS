import { Eye } from 'lucide-react';

export function PreviewBanner() {
  return (
    <div role="status" className="sticky top-[var(--header-height)] z-30 border-b border-saffron/40 bg-saffron-soft px-4 py-2 text-center text-xs font-semibold text-warning">
      <Eye className="mr-1.5 inline size-4 align-text-bottom" aria-hidden="true" />
      Preview mode — drafts and unsaved changes are visible only to you. पूर्वावलोकन मोड
    </div>
  );
}
