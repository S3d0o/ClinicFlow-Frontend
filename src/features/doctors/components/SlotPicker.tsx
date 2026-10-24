import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay, formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useDayLabel } from '../hooks/use-day-label';
import type { Slot } from '../model/doctor';
import { slotDays, slotsByPeriod } from '../model/slots';

interface SlotPickerProps {
  slots: Slot[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  /** The branch's zone, for "Today" and "Tomorrow". */
  timeZone?: string;
  selectedSlotId: string | null;
  onSelect: (slotId: string | null) => void;
}

/**
 * A strip of the days that have slots, then the chosen day's times by period. Taken times are
 * struck through. Remount it (`key`) when the slots belong to another branch or service.
 */
export function SlotPicker({ slots, isPending, isError, onRetry, timeZone, selectedSlotId, onSelect }: SlotPickerProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const dayLabel = useDayLabel();
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  if (isPending) return <LoadingState className="py-6" />;
  if (isError || !slots) return <ErrorState className="py-6" onRetry={onRetry} />;

  const days = slotDays(slots);
  if (days.length === 0) {
    return <p className="rounded-lg bg-muted px-3 py-4 text-center text-body-sm text-muted-foreground">{t('booking.noDays')}</p>;
  }
  const selected = slots.find((s) => s.id === selectedSlotId && s.available);
  const date = pickedDate ?? selected?.date ?? days.find((d) => d.hasFree)?.date ?? null;

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-label-md text-foreground">{t('booking.day')}</legend>
        <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day) => {
            const active = day.date === date;
            return (
              <button
                key={day.date}
                type="button"
                aria-pressed={active}
                disabled={!day.hasFree}
                onClick={() => {
                  setPickedDate(day.date);
                  onSelect(null);
                }}
                className={cn(
                  'flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-lg border px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
                )}
              >
                <span className={cn('text-caption', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{dayLabel(day.date, timeZone)}</span>
                <span className="font-display text-title-sm">{formatDay(day.date, language, { day: 'numeric', month: 'short' })}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {date && (
        <fieldset className="space-y-3">
          <legend className="mb-1 text-label-md text-foreground">{t('booking.time')}</legend>
          {slotsByPeriod(slots, date).map((group) => (
            <div key={group.period} className="space-y-2">
              <p className="text-caption text-muted-foreground">{t(`booking.${group.period}`)}</p>
              <div className="grid grid-cols-3 gap-2">
                {group.slots.map((slot) => {
                  const active = slot.id === selected?.id;
                  const time = formatWallClock(slot.startTime, language);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={active}
                      disabled={!slot.available}
                      aria-label={slot.available ? undefined : `${time}, ${t('booking.taken')}`}
                      onClick={() => onSelect(slot.id)}
                      className={cn(
                        'min-h-11 rounded-lg border text-label-md tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active && 'border-primary bg-primary text-primary-foreground',
                        !active && slot.available && 'border-border bg-card hover:border-primary hover:text-primary',
                        !slot.available && 'cursor-not-allowed border-border bg-muted text-muted-foreground line-through'
                      )}
                    >
                      <bdi dir="ltr">{time}</bdi>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}
