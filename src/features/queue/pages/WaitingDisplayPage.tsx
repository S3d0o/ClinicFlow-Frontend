import { useState } from 'react';
import { Clock, DoorOpen, Footprints, Info, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay, formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { LogoMark } from '@/shared/ui/Logo';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useQueueLive, useWaitingDisplay } from '../hooks/use-queue';
import type { DisplayRoom } from '../model/queue';

function RoomCard({ room }: { room: DisplayRoom }) {
  const { t } = useTranslation('queue');
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const roomLabel = room.room ? nameIn(room.room, language) : t('display.noRoom');

  return (
    <section aria-label={`${roomLabel}, ${room.doctorName}`} className="flex flex-col gap-5 rounded-2xl border border-ink-foreground/15 bg-ink-foreground/[0.06] p-6">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-foreground/20 px-2.5 py-1 text-label-md">
          <DoorOpen aria-hidden="true" className="size-4" />
          {roomLabel}
        </span>
        <h2 className="font-display text-headline-lg">{room.doctorName}</h2>
        <p className="text-body-lg text-ink-foreground/75">{specialtyLabel(room.specialtyId)}</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-ink-foreground/15 bg-ink px-4 py-8 text-center">
        <p className="text-label-md uppercase tracking-widest text-ink-foreground/70">{t('display.nowServing')}</p>
        <p className="font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-none tabular-nums">
          <bdi dir="ltr">{room.nowServing ?? '—'}</bdi>
        </p>
        {room.nowServing && (
          <p className="mt-3 flex items-center gap-2 text-body-lg text-ink-foreground/80">
            <Footprints aria-hidden="true" className="size-5" />
            {t('display.proceed', { room: roomLabel })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-label-md uppercase tracking-wide text-ink-foreground/70">
          <span>{t('display.next')}</span>
          <span>{t('display.waiting', { count: room.waitingCount })}</span>
        </div>
        <ol className="grid grid-cols-2 gap-2">
          {[0, 1].map((index) => (
            <li key={index} className="rounded-xl border border-ink-foreground/15 bg-ink px-3 py-3 text-center">
              <span className="block text-caption text-ink-foreground/60">{t('display.nextN', { n: index + 1 })}</span>
              <span className="font-display text-headline-lg tabular-nums">
                <bdi dir="ltr">{room.next[index] ?? '—'}</bdi>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <footer className="flex items-center justify-between border-t border-ink-foreground/15 pt-3 text-body-md text-ink-foreground/80">
        <span className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4" />
          {t('display.averageWait')}
        </span>
        <span className="font-semibold text-ink-foreground">{t('display.minutes', { count: room.averageWaitMinutes })}</span>
      </footer>
    </section>
  );
}

/**
 * The waiting-room screen (design front-desk/06, FR-FD-06): tickets and rooms, never names, updated
 * live. Announces each newly called ticket. A device token replaces the staff sign-in later.
 */
export default function WaitingDisplayPage() {
  const { t } = useTranslation(['queue', 'screens']);
  const { language } = useLanguage();
  const { branchId = '' } = useParams();
  const { branch } = useLookups();
  const current = branch(branchId);
  const { today, time } = useBranchClock(current, 15_000);
  const display = useWaitingDisplay(branchId);
  useQueueLive(branchId);

  const rooms = display.data?.rooms ?? [];
  const waiting = rooms.reduce((sum, r) => sum + r.waitingCount, 0);

  // Announce a ticket once when it's called in (not the ones already showing when the screen loads)
  const serving = JSON.stringify(Object.fromEntries(rooms.map((r) => [r.doctorId, r.nowServing ?? null])));
  const [lastServing, setLastServing] = useState(serving);
  const [announcement, setAnnouncement] = useState('');
  if (serving !== lastServing) {
    const before = JSON.parse(lastServing) as Record<string, string | null>;
    const called = rooms.filter((r) => r.nowServing && r.doctorId in before && before[r.doctorId] !== r.nowServing);
    setLastServing(serving);
    if (called.length > 0) {
      setAnnouncement(called.map((r) => t('display.announce', { ticket: r.nowServing, room: r.room ? nameIn(r.room, language) : '' })).join(' '));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink text-ink-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-foreground/15 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="font-display text-headline-md">{t('screens:waitingDisplay')}</h1>
            <p className="text-body-md text-ink-foreground/75">{current ? branchName(current, language) : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-end">
          <div>
            <p className="text-body-md text-ink-foreground/75">{formatDay(today, language, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="font-display text-headline-lg tabular-nums">
              <bdi dir="ltr">{formatWallClock(time, language)}</bdi>
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-ink-foreground/20 px-3 py-1.5 text-label-md">
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />
            {t('board.live')}
          </span>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 sm:px-8">
        {display.isPending ? (
          <LoadingState className="text-ink-foreground/80" />
        ) : display.isError ? (
          <ErrorState className="text-ink-foreground [&_p]:text-ink-foreground/80" onRetry={() => void display.refetch()} />
        ) : rooms.length === 0 ? (
          <p className="py-24 text-center font-display text-headline-lg text-ink-foreground/80">{t('display.empty')}</p>
        ) : (
          <div className={cn('grid gap-6', rooms.length > 2 ? 'lg:grid-cols-3' : rooms.length === 2 ? 'md:grid-cols-2' : '')}>
            {rooms.map((room) => (
              <RoomCard key={room.doctorId} room={room} />
            ))}
          </div>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>

      <footer className="space-y-3 border-t border-ink-foreground/15 px-6 py-4 sm:px-8">
        <p className="flex items-center gap-2 rounded-xl border border-ink-foreground/15 px-4 py-3 text-body-lg">
          <Info aria-hidden="true" className="size-5 shrink-0 text-highlight" />
          {t('display.instructions')}
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-1 text-body-md text-ink-foreground/80">
          <span>{t('display.doctorsOnDuty', { count: rooms.length })}</span>
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-4" />
            {t('display.patientsWaiting', { count: waiting })}
          </span>
        </p>
      </footer>
    </div>
  );
}
