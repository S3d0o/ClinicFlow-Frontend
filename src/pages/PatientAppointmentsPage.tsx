import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, reviewsApi } from '@/api';
import type { Appointment, AppointmentStatus } from '@/types';
import { getApiErrorMessage } from '@/lib/api-error';
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
import { EmptyState, LoadingState } from '@/components/states';
import { FilterTabs } from '@/components/FilterTabs';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { DateTile } from '@/components/DateTile';
import { RatingInput } from '@/components/Rating';
import { CalendarDays, CalendarPlus, Clock, Info, MessageSquareText, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StatusFilter = 'all' | AppointmentStatus;

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const REVIEW_MAX_LENGTH = 300;

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getMyAppointments({
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        pageNumber,
        pageSize: 10,
      });
      setAppointments(res.data);
      setHasMore(res.data.length === 10);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pageNumber]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const closeCancel = () => {
    setCancelId(null);
    setCancelReason('');
  };

  const closeReview = () => {
    setReviewAppointment(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      await appointmentsApi.cancel(cancelId, { cancellationReason: cancelReason || undefined });
      toast.success('Appointment cancelled');
      closeCancel();
      fetchAppointments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to cancel'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewAppointment) return;
    setReviewLoading(true);
    try {
      await reviewsApi.submit({
        appointmentId: reviewAppointment.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      toast.success('Thanks for your review!');
      setReviewedIds(prev => new Set(prev).add(reviewAppointment.id));
      closeReview();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setReviewLoading(false);
    }
  };

  const cancelTarget = appointments.find((a) => a.id === cancelId);

  return (
    <Page>
      <PageHeader
        eyebrow="Patient portal"
        title="My appointments"
        description="Your upcoming visits and appointment history."
        actions={
          <Button asChild>
            <Link to="/doctors">
              <CalendarPlus aria-hidden="true" /> Book an appointment
            </Link>
          </Button>
        }
      />

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
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={statusFilter === 'all' ? 'No appointments yet' : 'Nothing here'}
            description={statusFilter === 'all' ? 'Find a doctor and book your first visit — it only takes a minute.' : 'No appointments match this filter.'}
            action={statusFilter === 'all' ? <Button asChild><Link to="/doctors">Find a doctor</Link></Button> : undefined}
          />
        ) : (
          <ul className="space-y-4">
            {appointments.map((apt) => {
              const canReview = apt.status === 'Completed' && !apt.hasReview && !reviewedIds.has(apt.id);
              const inactive = apt.status === 'Cancelled';
              return (
                <li key={apt.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
                  <div className="flex gap-4">
                    <DateTile date={apt.appointmentDate} muted={inactive} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                          <h2 className={cn('truncate font-display text-title-sm', inactive && 'text-muted-foreground line-through decoration-muted-foreground/50')}>{apt.doctorName}</h2>
                          <p className="mt-1 flex items-center gap-1.5 text-body-md text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden="true" />
                            <span className="tabular-nums">{formatTimeRange(apt.startTime, apt.endTime)}</span>
                          </p>
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
                            <MessageSquareText className="size-3.5" aria-hidden="true" /> Doctor’s notes
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

                      {apt.status === 'Confirmed' && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl border border-info/15 bg-info/[0.06] px-3 py-2 text-body-sm text-info">
                          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          You can cancel up to 2 hours before the start time.
                        </p>
                      )}

                      {(apt.status === 'Confirmed' || canReview) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {apt.status === 'Confirmed' && (
                            <Button variant="destructive-outline" size="sm" onClick={() => setCancelId(apt.id)}>
                              <X aria-hidden="true" /> Cancel appointment
                            </Button>
                          )}
                          {canReview && (
                            <Button variant="outline" size="sm" onClick={() => setReviewAppointment(apt)}>
                              <Star aria-hidden="true" /> Leave a review
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

      {/* Cancel dialog */}
      <Dialog open={!!cancelId} onOpenChange={(open) => { if (!open) closeCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `${cancelTarget.doctorName} · ${formatTimeRange(cancelTarget.startTime, cancelTarget.endTime)}. The slot will be released for other patients.`
                : 'The slot will be released for other patients.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="cancel-reason"
              placeholder="Let the clinic know why you’re cancelling"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              aria-describedby="cancel-reason-hint"
            />
            <p id="cancel-reason-hint" className="text-body-sm text-muted-foreground">Appointments can be cancelled up to 2 hours before they start.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancel} disabled={cancelLoading}>Keep appointment</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
              {cancelLoading && <Spinner aria-hidden="true" />}
              {cancelLoading ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={!!reviewAppointment} onOpenChange={(open) => { if (!open) closeReview(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How was your visit?</DialogTitle>
            <DialogDescription>Your review of {reviewAppointment?.doctorName} helps other patients choose with confidence.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted py-4">
            <RatingInput value={reviewRating} onChange={setReviewRating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Comment <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="review-comment"
              placeholder="What went well? What could be better?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={REVIEW_MAX_LENGTH}
              aria-describedby="review-comment-count"
            />
            <p id="review-comment-count" className="text-right text-body-sm text-muted-foreground tabular-nums">
              {reviewComment.length}/{REVIEW_MAX_LENGTH}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReview} disabled={reviewLoading}>Not now</Button>
            <Button onClick={handleReview} disabled={reviewLoading}>
              {reviewLoading && <Spinner aria-hidden="true" />}
              {reviewLoading ? 'Submitting…' : 'Submit review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
