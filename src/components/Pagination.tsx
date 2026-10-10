import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
  label?: string;
}

/**
 * Previous/next paging. The API returns no total count, so there is no page list:
 * "next" is enabled when the last page came back full.
 */
export function Pagination({ page, hasNext, onChange, label = 'Pagination' }: PaginationProps) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav aria-label={label} className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
      <Button variant="outline" size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft aria-hidden="true" /> Previous
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page <span className="font-medium text-foreground tabular-nums">{page}</span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={!hasNext}>
        Next <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
