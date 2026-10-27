import { zodResolver } from '@hookform/resolvers/zod';
import { FilePen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Textarea } from '@/shared/ui/textarea';
import { useAddAddendum } from '../hooks/use-encounter';
import type { Encounter } from '../model/encounter';
import { addendumSchema, type AddendumValues } from '../model/encounter.schema';
import { Panel } from './Panel';

/** Corrections to a signed note, kept under it with author and time (FR-EMR-10). */
export function AddendaPanel({ encounter, canAddend, timeZone }: { encounter: Encounter; canAddend: boolean; timeZone: string }) {
  const { t } = useTranslation('encounters');
  const { language } = useLanguage();
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const addAddendum = useAddAddendum(encounter.appointmentId);
  const form = useForm<AddendumValues>({ resolver: zodResolver(addendumSchema), defaultValues: { text: '' } });
  const time = (iso: string) => formatInstant(iso, language, timeZone, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  const submit = form.handleSubmit(async ({ text }) => {
    try {
      await addAddendum.mutateAsync(text);
      form.reset({ text: '' });
      toast.success(t('addenda.added'));
    } catch {
      // Shown from addAddendum.error below
    }
  });

  return (
    <Panel icon={<FilePen className="size-5" />} title={t('addenda.title')}>
      {encounter.addenda.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t('addenda.none')}</p>
      ) : (
        <ol className="space-y-2">
          {encounter.addenda.map((addendum) => (
            <li key={addendum.id} className="rounded-lg border-s-4 border-primary bg-secondary/40 p-3">
              <p dir="auto" className="whitespace-pre-line text-body-md">{addendum.text}</p>
              <p className="mt-1 text-body-sm text-muted-foreground">{t('addenda.by', { name: addendum.authorName, time: time(addendum.signedAt) })}</p>
            </li>
          ))}
        </ol>
      )}
      {canAddend && (
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-3">
          <Field label={t('addenda.new')} hint={t('addenda.hint')} error={validation(form.formState.errors.text?.message, { max: 2000 })}>
            {(control) => <Textarea {...control} {...form.register('text')} rows={3} dir="auto" />}
          </Field>
          {addAddendum.isError && <FormAlert>{errorMessage(addAddendum.error)}</FormAlert>}
          <Button type="submit" variant="outline" disabled={addAddendum.isPending}>
            <FilePen aria-hidden="true" />
            {t('addenda.add')}
          </Button>
        </form>
      )}
    </Panel>
  );
}
