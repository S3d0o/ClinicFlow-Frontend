import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
  label?: string;
  /** Total pages, when the endpoint sends a total (`X-Total-Count`); shows "Page 2 of 5" */
  pageCount?: number;
}

/**
 * Previous/next paging. Most endpoints return no total count, so there is no page list:
 * "next" is enabled when the last page came back full. Pass `pageCount` when the total is known.
 */
export function Pagination({ page, hasNext, onChange, label = 'Pagination', pageCount }: PaginationProps) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav aria-label={label} className="mt-8 flex items-center justify-between gap-3 border-t border-border/70 pt-5">
      <Button variant="outline" size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft aria-hidden="true" /> Previous
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page <span className="font-medium text-foreground tabular-nums">{page}</span>
        {pageCount !== undefined && (
          <> of <span className="font-medium text-foreground tabular-nums">{pageCount}</span></>
        )}
      </span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={!hasNext}>
        Next <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
