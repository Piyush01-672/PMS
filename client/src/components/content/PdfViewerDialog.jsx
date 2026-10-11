import { Download, ExternalLink, FileText, Maximize2, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useL10n } from '@/lib/i18n';

export function PdfViewerDialog({ open, onOpenChange, url, title, downloadAllowed = true }) {
  const t = useL10n();
  const displayTitle = typeof title === 'object' ? t(title) || 'PDF Document' : title || 'PDF Document';

  if (!url) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex h-[90vh] w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-background shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <div className="flex items-center gap-2.5 truncate pr-4">
              <span className="grid size-8 place-items-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <FileText className="size-4" />
              </span>
              <DialogPrimitive.Title className="truncate font-heading text-base font-bold text-foreground">
                {displayTitle}
              </DialogPrimitive.Title>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {downloadAllowed && (
                <Button size="sm" variant="outline" asChild>
                  <a href={url} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1.5 size-4" />
                    Download
                  </a>
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 size-4" />
                  Open in New Tab
                </a>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button size="icon" variant="ghost" aria-label="Close viewer">
                  <X className="size-5" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="relative flex-1 bg-slate-100 p-2 dark:bg-slate-900">
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              title={displayTitle}
              className="size-full rounded-xl border bg-white shadow-inner"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
