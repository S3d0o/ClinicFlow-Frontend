import { useState } from 'react';
import { ClipboardList, Search, Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/StatusChip';
import { useIcd10Search } from '../hooks/use-encounter';
import type { Diagnosis, DiagnosisStatus } from '../model/encounter';
import { addDiagnosis, makePrimary, removeDiagnosis } from '../model/rules';
import { Panel } from './Panel';

const STATUSES: DiagnosisStatus[] = ['Confirmed', 'Provisional', 'RuledOut'];

interface DiagnosisPanelProps {
  diagnoses: Diagnosis[];
  readOnly: boolean;
  /** Signing needs a diagnosis (FR-EMR-04): shown once the doctor tries to sign. */
  missing: boolean;
  onChange: (diagnoses: Diagnosis[]) => void;
}

/** Diagnoses coded with ICD-10 (FR-EMR-04): search by code or words, one primary. */
export function DiagnosisPanel({ diagnoses, readOnly, missing, onChange }: DiagnosisPanelProps) {
  const { t } = useTranslation('encounters');
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const results = useIcd10Search(debounced);
  const showResults = query.trim().length >= 2 && debounced.trim().length >= 2;

  const pick = (code: string, title: string) => {
    onChange(addDiagnosis(diagnoses, { id: crypto.randomUUID(), code, title, status: 'Confirmed' }));
    setQuery('');
  };

  return (
    <Panel icon={<ClipboardList className="size-5" />} title={t('diagnosis.title')} aside={<span className="text-caption text-muted-foreground">{t('diagnosis.icd')}</span>}>
      {!readOnly && (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('diagnosis.search')}
            placeholder={t('diagnosis.search')}
            className="h-10 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-body-md outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          {showResults && (
            <ul aria-label={t('diagnosis.results')} className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-card">
              {results.data?.length === 0 && <li className="px-3 py-2 text-body-sm text-muted-foreground">{t('diagnosis.noMatches')}</li>}
              {results.data?.map((code) => (
                <li key={code.code}>
                  <button
                    type="button"
                    onClick={() => pick(code.code, code.titleEn)}
                    className="flex w-full items-baseline gap-3 px-3 py-2 text-start hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <bdi dir="ltr" className="w-16 shrink-0 font-mono text-label-md text-primary">{code.code}</bdi>
                    <span className="text-body-md">
                      <span dir="ltr">{code.titleEn}</span>
                      {language === 'ar' && code.titleAr && <span className="block text-body-sm text-muted-foreground">{code.titleAr}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {diagnoses.length === 0 ? (
        <p className={cn('rounded-lg px-3 py-2 text-body-sm', missing ? 'bg-destructive/10 text-destructive' : 'bg-muted/60 text-muted-foreground')}>
          {t('diagnosis.none')}
        </p>
      ) : (
        <ul className="space-y-2">
          {diagnoses.map((diagnosis) => (
            <li key={diagnosis.id} className={cn('flex flex-wrap items-center gap-2 rounded-lg border p-2', diagnosis.isPrimary ? 'border-ink/40 bg-secondary/50' : 'border-border')}>
              {diagnosis.isPrimary && <StatusChip tone="primary">{t('diagnosis.primary')}</StatusChip>}
              <bdi dir="ltr" className="font-mono text-label-md text-primary">{diagnosis.code}</bdi>
              <span dir="ltr" className={cn('min-w-0 flex-1 text-body-md', diagnosis.status === 'RuledOut' && 'line-through text-muted-foreground')}>{diagnosis.title}</span>
              {readOnly ? (
                <span className="text-body-sm text-muted-foreground">{t(`diagnosis.status.${diagnosis.status}`)}</span>
              ) : (
                <>
                  <select
                    value={diagnosis.status}
                    onChange={(e) => onChange(diagnoses.map((d) => (d.id === diagnosis.id ? { ...d, status: e.target.value as DiagnosisStatus } : d)))}
                    aria-label={t('diagnosis.statusFor', { code: diagnosis.code })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-body-sm"
                  >
                    {STATUSES.map((status) => <option key={status} value={status}>{t(`diagnosis.status.${status}`)}</option>)}
                  </select>
                  {!diagnosis.isPrimary && (
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(makePrimary(diagnoses, diagnosis.id))} aria-label={t('diagnosis.makePrimary', { code: diagnosis.code })}>
                      <Star aria-hidden="true" />
                    </Button>
                  )}
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(removeDiagnosis(diagnoses, diagnosis.id))} aria-label={t('diagnosis.remove', { code: diagnosis.code })}>
                    <X aria-hidden="true" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
