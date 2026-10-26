import { useState } from 'react';
import { MonitorPlay } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import type { Branch } from '@/features/org/model/branch';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { MoveToFrontDialog } from '../components/MoveToFrontDialog';
import { QueueCard } from '../components/QueueCard';
import { useCallPatient, useQueueBoard, useQueueLive } from '../hooks/use-queue';
import { boardColumns, filterByDoctor, queueDoctors, STAGE_TONE, type QueueEntry } from '../model/queue';

function QueueBoard({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['queue', 'screens']);
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const { now } = useBranchClock(branch, 30_000);
  const board = useQueueBoard(branch.id);
  const call = useCallPatient();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [moving, setMoving] = useState<QueueEntry | null>(null);
  useQueueLive(branch.id);

  const canManage = can(user, 'queue.manage', branch.id);
  const callIn = (entry: QueueEntry) =>
    call.mutate(entry.appointmentId, {
      onSuccess: (called) => toast.success(t('card.called', { ticket: called.ticketNo, name: called.patientName })),
      onError: (error) => toast.error(errorMessage(error)),
    });

  const entries = board.data ?? [];
  const columns = boardColumns(filterByDoctor(entries, doctorId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('screens:deskQueue')}
        description={t('board.intro')}
        actions={
          <>
            <StatusChip tone="success">{t('board.live')}</StatusChip>
            <Button asChild variant="outline">
              <a href={`#/display/${branch.id}`} target="_blank" rel="noreferrer">
                <MonitorPlay aria-hidden="true" />
                {t('board.openDisplay')}
              </a>
            </Button>
          </>
        }
      />

      {board.isPending ? (
        <LoadingState />
      ) : board.isError ? (
        <ErrorState onRetry={() => void board.refetch()} />
      ) : (
        <>
          <FilterChips
            label={t('board.filterLabel')}
            options={[{ value: null, label: t('board.allDoctors') }, ...queueDoctors(entries).map((d) => ({ value: d.id, label: d.name }))]}
            value={doctorId}
            onChange={setDoctorId}
          />
          <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {columns.map((column) => (
              <section key={column.stage} aria-labelledby={`stage-${column.stage}`} className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3">
                <header className="flex items-center justify-between gap-2 px-1">
                  <h2 id={`stage-${column.stage}`} className="text-title-sm text-ink">{t(`stage.${column.stage}`)}</h2>
                  <StatusChip tone={STAGE_TONE[column.stage]}>
                    <span className="sr-only">{t('board.count')} </span>
                    {column.entries.length}
                  </StatusChip>
                </header>
                {column.entries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-body-sm text-muted-foreground">{t(`board.empty.${column.stage}`)}</p>
                ) : (
                  <ul className="space-y-2">
                    {column.entries.map((entry) => (
                      <li key={entry.appointmentId}>
                        <QueueCard
                          entry={entry}
                          now={now}
                          actions={{
                            onCall: canManage ? callIn : undefined,
                            onMoveToFront: canManage ? setMoving : undefined,
                            canCollect: can(user, 'payments.collect', branch.id),
                            calling: call.isPending ? call.variables : null,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      <MoveToFrontDialog entry={moving} onClose={() => setMoving(null)} />
    </div>
  );
}

/** The live queue board (design front-desk/05, FR-FD-04/05): four stages, waits, call in and reorder. */
export default function QueueBoardPage() {
  return <BranchRequired>{(branch) => <QueueBoard branch={branch} />}</BranchRequired>;
}
