import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { MAIN_CONTENT_ID } from '@/shared/ui/main-content';
import { LoadingState } from '@/shared/ui/states';

/**
 * The page area of every layout: the main landmark, a per-screen error boundary (reset on
 * navigation) and the loading fallback while a lazily loaded screen arrives.
 */
export function ScreenOutlet({ className }: { className?: string }) {
  const { pathname } = useLocation();
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={cn('outline-none', className)}>
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
