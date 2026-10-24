import { useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Textarea } from '@/shared/ui/textarea';
import { useSubmitReview } from '../hooks/use-appointments';
import type { Appointment } from '../model/appointment';

const MAX_COMMENT = 300; // V1 rule (#25)

/** A 1–5 rating (a keyboard-friendly radio group) and an optional comment after a completed visit. */
export function ReviewDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { t } = useTranslation(['appointments', 'common']);
  const errorMessage = useErrorMessage();
  const submit = useSubmitReview(appointment.id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!rating) return setError(t('review.ratingRequired'));
    submit.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t('review.thanks'));
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('review.title', { doctor: appointment.doctorName })}</DialogTitle>
          <DialogDescription className="sr-only">{t('review.rating')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <FormAlert>{error}</FormAlert>}
          <fieldset>
            <legend className="mb-2 text-label-md text-foreground">{t('review.rating')}</legend>
            <div dir="ltr" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => {
                      setRating(value);
                      setError(null);
                    }}
                    className="sr-only"
                  />
                  <span className="sr-only">{t('review.stars', { count: value })}</span>
                  <Star aria-hidden="true" className={cn('size-8', value <= rating ? 'fill-highlight text-highlight' : 'text-muted-foreground')} />
                </label>
              ))}
            </div>
          </fieldset>
          <Field label={t('review.comment')} hint={`${t('review.commentHint')} ${comment.length} / ${MAX_COMMENT}`}>
            {(control) => <Textarea {...control} value={comment} maxLength={MAX_COMMENT} onChange={(e) => setComment(e.target.value)} rows={3} />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {t('review.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
