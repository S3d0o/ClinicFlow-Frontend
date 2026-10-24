import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

/** The ClinicFlow mark: a medical cross on a deep navy tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-ink-foreground', className)}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M10 3a1 1 0 0 0-1 1v5H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-5V4a1 1 0 0 0-1-1z" />
      </svg>
    </span>
  );
}

/** Mark and wordmark, linking home. */
export function Logo({ to = '/', className, subtitle }: { to?: string; className?: string; subtitle?: string }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 rounded-lg', className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-title-sm font-bold text-ink">{t('appName')}</span>
        {subtitle && <span className="text-caption text-muted-foreground">{subtitle}</span>}
      </span>
    </Link>
  );
}
