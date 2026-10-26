import { useState, type FormEvent } from 'react';
import { ArrowUpToLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Textarea } from '@/shared/ui/textarea';
import { useMoveToFront } from '../hooks/use-queue';
import type { QueueEntry } from '../model/queue';

/** Moves a waiting patient to the front of their line; the reason is required and audited (FR-FD-05). */
export function MoveToFrontDialog({ entry, onClose }: { entry: QueueEntry | null; onClose: () => void }) {
  const { t } = useTranslation(['queue', 'common']);
  const errorMessage = useErrorMessage();
  const move = useMoveToFront();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = !reason.trim();

  const close = () => {
    setReason('');
    setTouched(false);
    move.reset();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!entry || missing) return;
    try {
      await move.mutateAsync({ appointmentId: entry.appointmentId, reason: reason.trim() });
      toast.success(t('moveToFront.done', { ticket: entry.ticketNo }));
      close();
    } catch {
      // Shown from move.error below
    }
  };

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('moveToFront.title', { ticket: entry?.ticketNo ?? '' })}</DialogTitle>
            <DialogDescription>{t('moveToFront.body', { name: entry?.patientName ?? '' })}</DialogDescription>
          </DialogHeader>
          <Field label={t('moveToFront.reason')} hint={t('moveToFront.reasonHint')} error={touched && missing ? t('moveToFront.reasonRequired') : undefined} required>
            {(control) => <Textarea {...control} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={300} dir="auto" />}
          </Field>
          {move.isError && <FormAlert>{errorMessage(move.error)}</FormAlert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={move.isPending}>
              <ArrowUpToLine aria-hidden="true" />
              {t('moveToFront.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
