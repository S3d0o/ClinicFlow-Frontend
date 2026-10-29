import { useTranslation } from 'react-i18next';

/**
 * Marks the public preview (the GitHub Pages build, `VITE_PREVIEW=true`), so nobody mistakes its
 * sample data for the live app. It never takes clicks from the screen underneath.
 */
export function PreviewRibbon() {
  const { t } = useTranslation();
  if (import.meta.env.VITE_PREVIEW !== 'true') return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-1 z-50 flex justify-center px-4">
      <p
        role="note"
        className="flex items-center gap-2 rounded-full border border-warning/30 bg-card px-3 py-1 text-caption text-foreground shadow-sm"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
        {t('preview.ribbon')}
      </p>
    </div>
  );
}
