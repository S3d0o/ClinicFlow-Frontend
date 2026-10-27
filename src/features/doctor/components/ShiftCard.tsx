import { CalendarOff, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatWallClock } from '@/shared/lib/intl';
import { StatusChip } from '@/shared/ui/StatusChip';
import type { ShiftDay } from '../model/doctor-day';

/** One shift: branch, hours, room and booked slots; struck through when leave covers it (FR-SCH-06). */
export function ShiftCard({ shift, current = false, className }: { shift: ShiftDay; current?: boolean; className?: string }) {
  const { t } = useTranslation('doctor');
  const { language } = useLanguage();
  const { branchLabel } = useLookups();

  return (
    <div className={cn('space-y-2 rounded-xl border p-3', shift.onLeave ? 'border-dashed border-border bg-muted/50' : current ? 'border-primary bg-secondary/50' : 'border-border bg-card', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-label-md text-ink">
          <MapPin aria-hidden="true" className="size-3.5 text-primary" />
          {branchLabel(shift.branchId)}
        </p>
        {shift.onLeave ? (
          <StatusChip tone="neutral">
            <CalendarOff aria-hidden="true" className="size-3" />
            {t('shift.onLeave')}
          </StatusChip>
        ) : (
          current && <StatusChip tone="success">{t('shift.now')}</StatusChip>
        )}
      </div>
      <p className={cn('text-body-md tabular-nums', shift.onLeave && 'line-through text-muted-foreground')}>
        {formatWallClock(shift.startTime, language)} – {formatWallClock(shift.endTime, language)}
        {shift.room && ` · ${nameIn(shift.room, language)}`}
      </p>
      {!shift.onLeave && (
        <div className="space-y-1">
          <div className="flex justify-between text-body-sm text-muted-foreground">
            <span>{t('shift.booked')}</span>
            <span className="tabular-nums">{t('shift.slots', { booked: shift.slotsBooked, total: shift.slotsTotal })}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: `${shift.slotsTotal ? Math.min(100, (shift.slotsBooked / shift.slotsTotal) * 100) : 0}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
