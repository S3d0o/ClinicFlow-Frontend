import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Previous / "Page 2 of 5" / Next. Hidden when everything fits on one page. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const { t } = useTranslation('common');
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={t('pagination.label')} className="flex items-center justify-between gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft aria-hidden="true" className="rtl-flip" />
        {t('actions.previous')}
      </Button>
      <p aria-live="polite" className="text-body-md text-muted-foreground">
        {t('pagination.page', { page, total: pageCount })}
      </p>
      <Button variant="outline" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        {t('actions.next')}
        <ChevronRight aria-hidden="true" className="rtl-flip" />
      </Button>
    </nav>
  );
}
