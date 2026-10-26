import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Textarea } from '@/shared/ui/textarea';
import { useCloseCashSession } from '../hooks/use-checkout';
import { countTotal, DENOMINATIONS, needsVarianceApproval, varianceOf, VARIANCE_APPROVAL_THRESHOLD, type CashSession, type DenominationCounts } from '../model/cash-session';

/** Closing the drawer (FR-BIL-09): count the banknotes, see the variance, add a handover note. */
export function CloseSessionForm({ session, onClosed }: { session: CashSession; onClosed: (closed: CashSession) => void }) {
  const { t } = useTranslation(['billing', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const close = useCloseCashSession();
  const [counts, setCounts] = useState<DenominationCounts>({});
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const money = (amount: number) => formatMoney(amount, language);

  const counted = countTotal(counts);
  const variance = varianceOf(counted, session.expectedCash);
  const needsApproval = needsVarianceApproval(variance);

  const submit = async () => {
    try {
      const closed = await close.mutateAsync({ sessionId: session.id, countedAmount: counted, note });
      onClosed(closed);
    } catch {
      // Shown from close.error below
    }
  };

  const openConfirm = (event: FormEvent) => {
    event.preventDefault();
    setConfirming(true);
  };

  return (
    <form id="close-session" onSubmit={openConfirm} className="space-y-4 rounded-2xl border-2 border-ink bg-card p-4 shadow-card sm:p-5">
      <div>
        <h2 className="font-display text-headline-md text-ink">{t('cash.close.title')}</h2>
        <p className="text-body-sm text-muted-foreground">{t('cash.close.intro')}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3">
        <div>
          <dt className="text-body-sm text-muted-foreground">{t('cash.close.expected')}</dt>
          <dd className="font-display text-headline-md tabular-nums text-ink">{money(session.expectedCash)}</dd>
        </div>
        <div>
          <dt className="text-body-sm text-muted-foreground">{t('cash.close.counted')}</dt>
          <dd className="font-display text-headline-md tabular-nums text-ink">{money(counted)}</dd>
        </div>
      </dl>

      <fieldset className="space-y-2">
        <legend className="text-label-md text-foreground">{t('cash.close.banknotes')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DENOMINATIONS.map((note) => (
            <label key={note} className="space-y-1 rounded-lg border border-border p-2 text-center">
              <span className="block text-label-md text-foreground">{t('cash.close.note', { value: note })}</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={counts[note] ?? ''}
                aria-label={t('cash.close.noteCount', { value: note })}
                onChange={(e) => {
                  const value = Math.max(0, Math.floor(Number(e.target.value) || 0));
                  setCounts((current) => ({ ...current, [note]: value || undefined }));
                }}
                className="h-9 w-full rounded-md border border-input bg-background text-center tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              />
              <span className="block text-caption text-muted-foreground">{money(note * (counts[note] ?? 0))}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div
        role="status"
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-body-md',
          variance === 0 ? 'border-success/25 bg-success/10 text-success' : needsApproval ? 'border-destructive/25 bg-destructive/10 text-destructive' : 'border-warning/25 bg-warning/10 text-warning'
        )}
      >
        <span className="font-semibold">{t('cash.close.variance')}</span>
        <span className="tabular-nums">
          {variance === 0 ? t('cash.close.exact') : variance > 0 ? t('cash.close.over', { amount: money(variance) }) : t('cash.close.short', { amount: money(-variance) })}
        </span>
      </div>
      {needsApproval && <p className="text-body-sm text-destructive">{t('cash.close.approvalNeeded', { amount: money(VARIANCE_APPROVAL_THRESHOLD) })}</p>}

      <Field label={t('cash.close.handover')} hint={t('cash.close.handoverHint')}>
        {(control) => <Textarea {...control} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} dir="auto" />}
      </Field>

      {close.isError && <FormAlert>{errorMessage(close.error)}</FormAlert>}
      <Button type="submit" size="lg" variant="strong" className="w-full" disabled={close.isPending}>
        <Lock aria-hidden="true" />
        {t('cash.close.submit')}
      </Button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cash.close.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cash.close.confirmBody', { counted: money(counted), expected: money(session.expectedCash) })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>{t('cash.close.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
