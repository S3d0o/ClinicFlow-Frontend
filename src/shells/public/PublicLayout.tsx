import { SkipLink } from '@/shared/ui/SkipLink';
import { ScreenOutlet } from '../ScreenOutlet';
import { PublicFooter } from './PublicFooter';
import { PublicNavbar } from './PublicNavbar';

/** Visitor pages: navbar, page, footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicNavbar />
      <ScreenOutlet className="flex-1" />
      <PublicFooter />
    </div>
  );
}
