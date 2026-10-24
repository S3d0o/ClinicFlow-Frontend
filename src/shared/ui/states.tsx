import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';
import { Spinner } from './spinner';

interface StateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

function StateFrame({ icon, title, description, action, className, role }: StateProps & { icon: ReactNode; role?: string }) {
  return (
    <div role={role} className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      {icon}
      {title && <p className="font-display text-title-sm text-ink">{title}</p>}
      {description && <p className="max-w-md text-body-md text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className={cn('flex items-center justify-center gap-2 py-12 text-body-md text-muted-foreground', className)}>
      <Spinner />
      <span>{label ?? t('states.loading')}</span>
    </div>
  );
}

/** A failed load. Always offer a retry instead of showing an empty state. */
export function ErrorState({ onRetry, ...props }: StateProps & { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <StateFrame
      role="alert"
      icon={<AlertTriangle aria-hidden="true" className="size-8 text-destructive" />}
      title={props.title ?? t('states.errorTitle')}
      description={props.description ?? t('states.errorBody')}
      action={
        props.action ??
        (onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {t('actions.tryAgain')}
          </Button>
        ))
      }
      className={props.className}
    />
  );
}

export function EmptyState(props: StateProps & { icon?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <StateFrame
      {...props}
      icon={props.icon ?? <Inbox aria-hidden="true" className="size-8 text-muted-foreground" />}
      title={props.title ?? t('states.emptyTitle')}
    />
  );
}
