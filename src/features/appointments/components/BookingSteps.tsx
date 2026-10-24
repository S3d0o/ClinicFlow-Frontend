import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/** The booking header: back, "Book an appointment", which of the two steps this is. Renders the <h1>. */
export function BookingSteps({ step, backTo }: { step: 1 | 2; backTo: string }) {
  const { t } = useTranslation(['appointments', 'common']);
  return (
    <header className="flex items-center gap-3">
      <Button asChild variant="ghost" size="icon" aria-label={t('book.back')}>
        <Link to={backTo}>
          <ArrowLeft className="rtl-flip" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-headline-md text-ink">{t('book.title')}</h1>
        <p className="text-body-sm text-muted-foreground">
          {t('common:stepper.progress', { current: step, total: 2 })} · {step === 1 ? t('book.step1') : t('book.step2')}
        </p>
      </div>
      <div aria-hidden="true" className="flex gap-1">
        {[1, 2].map((n) => (
          <span key={n} className={cn('h-1.5 w-6 rounded-full', n <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
    </header>
  );
}
