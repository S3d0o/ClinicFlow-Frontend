import { FileText, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { Textarea } from '@/shared/ui/textarea';
import { useTemplates } from '../hooks/use-encounter';
import type { EncounterTemplate, SoapNotes as Notes } from '../model/encounter';
import { Panel } from './Panel';

const SECTIONS = ['subjective', 'objective', 'assessment', 'plan'] as const;

interface SoapNotesProps {
  notes: Notes;
  specialtyId: string;
  readOnly: boolean;
  onChange: (notes: Notes) => void;
  onTemplate: (template: EncounterTemplate) => void;
}

/** The SOAP note (FR-EMR-03): four sections, and specialty templates that fill the empty ones. */
export function SoapNotes({ notes, specialtyId, readOnly, onChange, onTemplate }: SoapNotesProps) {
  const { t } = useTranslation('encounters');
  const { language } = useLanguage();
  const templates = useTemplates(specialtyId);

  return (
    <Panel icon={<FileText className="size-5" />} title={t('soap.title')}>
      {!readOnly && (templates.data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('soap.templates')}>
          <span className="text-label-md text-muted-foreground">{t('soap.templates')}</span>
          {templates.data!.map((template) => (
            <Button key={template.id} type="button" size="sm" variant="outline" onClick={() => onTemplate(template)}>
              <Wand2 aria-hidden="true" />
              {nameIn(template, language)}
            </Button>
          ))}
        </div>
      )}
      {SECTIONS.map((section) => (
        <Field key={section} label={<span className="flex items-center gap-2"><span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-md bg-ink text-label-md text-ink-foreground">{t(`soap.letter.${section}`)}</span>{t(`soap.${section}`)}</span>} hint={t(`soap.hint.${section}`)}>
          {(control) => (
            <Textarea
              {...control}
              value={notes[section]}
              onChange={(e) => onChange({ ...notes, [section]: e.target.value })}
              readOnly={readOnly}
              rows={section === 'plan' ? 3 : 4}
              maxLength={4000}
              dir="auto"
            />
          )}
        </Field>
      ))}
    </Panel>
  );
}
