import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatWallClock } from '@/shared/lib/intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import { useCancelLeave, useMyLeave } from '../hooks/use-doctor';
import type { LeaveRequest, LeaveStatus } from '../model/doctor-day';
import { canCancelLeave } from '../model/rules';

const STATUS_TONE: Record<LeaveStatus, Tone> = { Requested: 'warning', Approved: 'success', Rejected: 'danger', Cancelled: 'neutral' };

/** The doctor's leave requests, newest first; cancellable until they start (05 §4.5). */
export function LeaveList({ today }: { today: string }) {
  const { t } = useTranslation('doctor');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const leave = useMyLeave();
  const cancel = useCancelLeave();
  const day = (date: string) => formatDay(date, language, { day: 'numeric', month: 'short', year: 'numeric' });

  const period = (item: LeaveRequest) => {
    const dates = item.fromDate === item.toDate ? day(item.fromDate) : t('leave.range', { from: day(item.fromDate), to: day(item.toDate) });
    return item.startTime && item.endTime ? `${dates} · ${formatWallClock(item.startTime, language)} – ${formatWallClock(item.endTime, language)}` : dates;
  };

  const cancelLeave = (item: LeaveRequest) =>
    cancel.mutate(item.id, {
      onSuccess: () => toast.success(t('leave.cancelled', { reference: item.reference })),
      onError: (error) => toast.error(errorMessage(error)),
    });

  return (
    <section aria-labelledby="leave-list" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 id="leave-list" className="text-title-sm text-ink">{t('leave.listTitle')}</h2>
      {leave.isPending ? (
        <LoadingState />
      ) : leave.isError ? (
        <ErrorState onRetry={() => void leave.refetch()} />
      ) : leave.data.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t('leave.none')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {leave.data.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-label-md text-ink">{period(item)}</p>
                <p dir="auto" className="text-body-sm text-foreground">{item.reason}</p>
                <p className="text-caption text-muted-foreground">
                  <bdi dir="ltr">{item.reference}</bdi> · {t('leave.affected', { count: item.affectedAppointments })}
                  {item.decidedByName && ` · ${t('leave.decidedBy', { name: item.decidedByName })}`}
                </p>
              </div>
              <StatusChip tone={STATUS_TONE[item.status]}>{t(`leave.status.${item.status}`)}</StatusChip>
              {canCancelLeave(item, today) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive-outline" disabled={cancel.isPending}>{t('leave.cancel')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('leave.cancelTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('leave.cancelBody', { period: period(item) })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('leave.keep')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cancelLeave(item)}>{t('leave.cancelConfirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
