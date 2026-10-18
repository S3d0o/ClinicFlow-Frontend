import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-16rem)] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-label-sm uppercase tracking-[0.12em] text-primary">Error 404</p>
      <h1 className="mt-3 font-display text-display-md sm:text-display-lg">Page not found</h1>
      <p className="mt-4 text-body-lg text-muted-foreground">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link to="/"><Home aria-hidden="true" /> Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/doctors"><Search aria-hidden="true" /> Find a doctor</Link>
        </Button>
      </div>
    </div>
  );
}
