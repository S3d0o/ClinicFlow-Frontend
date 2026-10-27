import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { addDays } from '@/shared/lib/branch-time';
import { formatDay } from '@/shared/lib/intl';
import { Field } from '@/shared/ui/Field';
import { Textarea } from '@/shared/ui/textarea';
import { followUpWindow } from '../model/rules';
import { Panel } from './Panel';

const FOLLOW_UPS = [7, 14, 30, 90];

interface PlanPanelProps {
  instructions: string;
  followUpInDays?: number;
  visitDate: string;
  readOnly: boolean;
  onInstructions: (text: string) => void;
  onFollowUp: (days: number | undefined) => void;
}

/** What the patient reads in the visit summary (FR-EMR-13) and the suggested follow-up (FR-APT-11). */
export function PlanPanel({ instructions, followUpInDays, visitDate, readOnly, onInstructions, onFollowUp }: PlanPanelProps) {
  const { t } = useTranslation('encounters');
  const { language } = useLanguage();
  const range = followUpInDays ? followUpWindow(visitDate, followUpInDays, addDays) : undefined;
  const day = (date: string) => formatDay(date, language, { day: 'numeric', month: 'short' });

  return (
    <Panel icon={<CalendarClock className="size-5" />} title={t('plan.title')}>
      <Field label={t('plan.instructions')} hint={t('plan.instructionsHint')}>
        {(control) => (
          <Textarea {...control} value={instructions} onChange={(e) => onInstructions(e.target.value)} readOnly={readOnly} rows={4} maxLength={2000} dir="auto" />
        )}
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-label-md">{t('plan.followUp')}</legend>
        <div className="flex flex-wrap gap-2">
          {[undefined, ...FOLLOW_UPS].map((days) => {
            const selected = followUpInDays === days;
            return (
              <button
                key={days ?? 'none'}
                type="button"
                disabled={readOnly}
                aria-pressed={selected}
                onClick={() => onFollowUp(days)}
                className={cn(
                  'h-9 rounded-full border px-3 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                  selected ? 'border-ink bg-ink text-ink-foreground' : 'border-border bg-card hover:border-primary'
                )}
              >
                {days ? t('plan.inDays', { count: days }) : t('plan.noFollowUp')}
              </button>
            );
          })}
        </div>
        {range && <p className="text-body-sm text-muted-foreground">{t('plan.window', { from: day(range.from), to: day(range.to) })}</p>}
      </fieldset>
    </Panel>
  );
}
