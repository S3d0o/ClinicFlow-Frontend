import { useState } from 'react';
import { appointmentsApi } from '@/api';
import type { Appointment, AppointmentStatus } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { canMarkNoShow, hasAppointmentStarted } from '@/lib/appointments';
import { formatTimeRange } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useApiQuery } from '@/hooks/use-api-query';
import { FilterTabs } from '@/components/FilterTabs';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { DateTile } from '@/components/DateTile';
import { UserAvatar } from '@/components/UserAvatar';
import { CalendarDays, CheckCircle2, Clock, MessageSquareText, NotebookPen, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StatusFilter = 'all' | AppointmentStatus;

// "Pending" exists in the API enum but is never set (API contract §7)
const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'NoShow', label: 'No-show' },
];

const PAGE_SIZE = 10;
// The API rejects longer notes (API contract #24)
const NOTES_MAX_LENGTH = 4000;

export function DoctorAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [noShowId, setNoShowId] = useState<number | null>(null);
  const [notesId, setNotesId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data, loading, error, reload: fetchAppointments } = useApiQuery(
    () =>
      appointmentsApi
        .getDoctorAppointments({
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          pageNumber,
          pageSize: PAGE_SIZE,
        })
        .then((res) => res.data),
    `${statusFilter}|${pageNumber}`
  );
  const appointments: Appointment[] = data ?? [];
  const hasMore = appointments.length === PAGE_SIZE;

  const handleComplete = async () => {
    if (!completeId) return;
    setActionLoading(true);
    try {
      await appointmentsApi.complete(completeId);
      toast.success('Appointment marked as completed');
      setCompleteId(null);
      fetchAppointments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to complete'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!noShowId) return;
    setActionLoading(true);
    try {
      await appointmentsApi.markNoShow(noShowId);
      toast.success('Appointment marked as a no-show');
      setNoShowId(null);
      fetchAppointments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to mark as a no-show'));
    } finally {
      setActionLoading(false);
    }
  };

  const closeNotes = () => {
    setNotesId(null);
    setNotes('');
  };

  const handleAddNotes = async () => {
    if (!notesId) return;
    setActionLoading(true);
    try {
      await appointmentsApi.addNotes(notesId, { notes });
      toast.success('Notes saved');
      closeNotes();
      fetchAppointments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add notes'));
    } finally {
      setActionLoading(false);
    }
  };

  const completeTarget = appointments.find((a) => a.id === completeId);
  const noShowTarget = appointments.find((a) => a.id === noShowId);
  const notesTarget = appointments.find((a) => a.id === notesId);

  return (
    <Page>
      <PageHeader eyebrow="Clinic workspace" title="Appointments" description="Your patient visits, newest first. Complete visits after they start, mark missed ones as no-shows and keep clinical notes." />

      <FilterTabs
        label="Filter appointments by status"
        value={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPageNumber(1); }}
        options={filterOptions}
        className="mb-6"
      />

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <LoadingState label="Loading appointments…" />
        ) : error ? (
          <ErrorState title="Couldn’t load appointments" message={getApiErrorMessage(error, 'Please try again in a moment.')} onRetry={fetchAppointments} />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments found"
            description={statusFilter === 'all' ? 'Bookings will appear here once patients book your open slots.' : 'No appointments match this filter.'}
          />
        ) : (
          <ul className="space-y-4">
            {appointments.map((apt) => {
              const canComplete = apt.status === 'Confirmed' && hasAppointmentStarted(apt);
              const canNoShow = canMarkNoShow(apt);
              const canEditNotes = apt.status === 'Confirmed' || apt.status === 'Completed' || apt.status === 'NoShow';
              return (
                <li key={apt.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
                  <div className="flex gap-4">
                    <DateTile date={apt.appointmentDate} muted={apt.status === 'Cancelled' || apt.status === 'NoShow'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar name={apt.patientName} size="sm" />
                          <div className="min-w-0">
                            <h2 className={cn('truncate font-display text-title-sm', apt.status === 'Cancelled' && 'text-muted-foreground line-through decoration-muted-foreground/50')}>{apt.patientName}</h2>
                            <p className="flex items-center gap-1.5 text-body-md text-muted-foreground">
                              <Clock className="size-3.5" aria-hidden="true" />
                              <span className="tabular-nums">{formatTimeRange(apt.startTime, apt.endTime)}</span>
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                      {apt.reasonForVisit && (
                        <p className="mt-3 text-body-md text-foreground/85">
                          <span className="text-muted-foreground">Reason: </span>
                          {apt.reasonForVisit}
                        </p>
                      )}
                      {apt.doctorNotes && (
                        <div className="mt-3 rounded-xl bg-muted px-4 py-3 text-body-md">
                          <p className="flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-muted-foreground">
                            <MessageSquareText className="size-3.5" aria-hidden="true" /> Your notes
                          </p>
                          <p className="mt-1 text-foreground/90">{apt.doctorNotes}</p>
                        </div>
                      )}
                      {apt.status === 'Cancelled' && (apt.cancellationReason || apt.cancelledBy) && (
                        <p className="mt-3 rounded-xl bg-muted px-4 py-2.5 text-body-sm text-muted-foreground">
                          Cancelled{apt.cancelledBy ? ` by ${apt.cancelledBy.toLowerCase()}` : ''}
                          {apt.cancellationReason ? ` — “${apt.cancellationReason}”` : ''}
                        </p>
                      )}
                      {(canComplete || canNoShow || canEditNotes) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {canComplete && (
                            <Button size="sm" onClick={() => setCompleteId(apt.id)}>
                              <CheckCircle2 aria-hidden="true" /> Mark as completed
                            </Button>
                          )}
                          {canNoShow && (
                            <Button variant="outline" size="sm" onClick={() => setNoShowId(apt.id)}>
                              <UserX aria-hidden="true" /> Mark as no-show
                            </Button>
                          )}
                          {canEditNotes && (
                            <Button variant="secondary" size="sm" onClick={() => { setNotesId(apt.id); setNotes(apt.doctorNotes || ''); }}>
                              <NotebookPen aria-hidden="true" /> {apt.doctorNotes ? 'Edit notes' : 'Add notes'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && (appointments.length > 0 || pageNumber > 1) && (
        <Pagination page={pageNumber} hasNext={hasMore} onChange={setPageNumber} label="Appointment pages" />
      )}

      {/* Complete dialog */}
      <Dialog open={!!completeId} onOpenChange={(open) => { if (!open) setCompleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark visit as completed?</DialogTitle>
            <DialogDescription>
              {completeTarget ? `${completeTarget.patientName} · ${formatTimeRange(completeTarget.startTime, completeTarget.endTime)}. ` : ''}
              The patient will be able to leave a review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteId(null)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleComplete} disabled={actionLoading}>
              {actionLoading && <Spinner aria-hidden="true" />}
              {actionLoading ? 'Saving…' : 'Mark as completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-show dialog */}
      <Dialog open={!!noShowId} onOpenChange={(open) => { if (!open) setNoShowId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as a no-show?</DialogTitle>
            <DialogDescription>
              {noShowTarget ? `${noShowTarget.patientName} · ${formatTimeRange(noShowTarget.startTime, noShowTarget.endTime)}. ` : ''}
              The patient will be told they missed the visit. This can’t be undone, and the visit can no longer be completed or cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoShowId(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleNoShow} disabled={actionLoading}>
              {actionLoading && <Spinner aria-hidden="true" />}
              {actionLoading ? 'Saving…' : 'Mark as no-show'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes dialog */}
      <Dialog open={!!notesId} onOpenChange={(open) => { if (!open) closeNotes(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Clinical notes</DialogTitle>
            <DialogDescription>
              {notesTarget ? `For ${notesTarget.patientName}. ` : ''}The patient can read these notes in their appointment history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="doctor-notes">Notes</Label>
            <Textarea id="doctor-notes" placeholder="Findings, advice, follow-up plan…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} maxLength={NOTES_MAX_LENGTH} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeNotes} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleAddNotes} disabled={actionLoading}>
              {actionLoading && <Spinner aria-hidden="true" />}
              {actionLoading ? 'Saving…' : 'Save notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
