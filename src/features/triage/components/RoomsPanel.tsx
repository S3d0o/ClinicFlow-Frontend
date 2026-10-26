import { DoorOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { minutesInStage, type QueueEntry } from '@/features/queue/model/queue';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { StatusChip } from '@/shared/ui/StatusChip';

/** Each doctor's room today: who is in, and how many are ready (design nurse/01, right panel). */
export function RoomsPanel({ entries, now }: { entries: QueueEntry[]; now: Date }) {
  const { t } = useTranslation('triage');
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const doctors = [...new Map(entries.map((e) => [e.doctorId, e])).values()].sort((a, b) =>
    (a.room?.nameEn ?? '').localeCompare(b.room?.nameEn ?? '')
  );

  return (
    <section aria-labelledby="rooms-heading" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 id="rooms-heading" className="text-title-sm text-ink">{t('rooms.title')}</h2>
      {doctors.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t('rooms.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {doctors.map((doctor) => {
            const mine = entries.filter((e) => e.doctorId === doctor.doctorId);
            const inRoom = mine.find((e) => e.stage === 'WithDoctor');
            const ready = mine.filter((e) => e.stage === 'ReadyForDoctor').length;
            return (
              <li key={doctor.doctorId} className="space-y-1.5 rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-label-md text-foreground">
                    <DoorOpen aria-hidden="true" className="size-4 text-primary" />
                    <span className="whitespace-nowrap">{doctor.room ? nameIn(doctor.room, language) : t('rooms.noRoom')}</span>
                    <span className="font-normal text-muted-foreground">{specialtyLabel(doctor.specialtyId)}</span>
                  </p>
                  {inRoom ? <StatusChip tone="info">{t('rooms.busy')}</StatusChip> : <StatusChip tone="success">{t('rooms.free')}</StatusChip>}
                </div>
                <p className="text-body-md text-ink">{doctor.doctorName}</p>
                <p className="text-body-sm text-muted-foreground">
                  {inRoom ? t('rooms.serving', { ticket: inRoom.ticketNo, minutes: minutesInStage(inRoom, now) }) : t('rooms.ready', { count: ready })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
