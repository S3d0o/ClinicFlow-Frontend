import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { appointmentsApi, reviewsApi } from '@/api';
import type { Appointment, AppointmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  Stethoscope,
  Star,
  X,
  MessageSquare,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NoShow: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getMyAppointments({
        ...(statusFilter !== 'all' ? { status: statusFilter as AppointmentStatus } : {}),
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

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      await appointmentsApi.cancel(cancelId, { cancellationReason: cancelReason || undefined });
      toast.success('Appointment cancelled');
      setCancelId(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to cancel');
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
      toast.success('Review submitted!');
      setReviewAppointment(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
              <p className="text-sm text-slate-500">Manage your upcoming and past appointments</p>
            </div>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link to="/doctors">
                <Stethoscope className="h-4 w-4 mr-2" /> Book New
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageNumber(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All Statuses</SelectItem>
                {/* <SelectItem value="Pending">Pending</SelectItem> */}
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : appointments.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No appointments found</h3>
                <p className="text-sm text-slate-400 mb-4">Book your first appointment with a doctor</p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link to="/doctors">Find a Doctor</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {appointments.map((apt, i) => (
                  <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-slate-100 hover:border-teal-200 transition-colors">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold shrink-0">
                              {apt.doctorName.charAt(3)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{apt.doctorName}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(parseISO(apt.appointmentDate), 'MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {apt.startTime} - {apt.endTime}
                                </span>
                              </div>
                              {apt.reasonForVisit && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                  <ClipboardList className="h-3 w-3" /> {apt.reasonForVisit}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[apt.status]}`}>
                              {apt.status}
                            </span>
                            {(apt.status === 'Confirmed') && (
                              <Button variant="outline" size="sm" onClick={() => setCancelId(apt.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                              </Button>
                            )}
                            {apt.status === 'Completed' && (
                              <Button variant="outline" size="sm" onClick={() => setReviewAppointment(apt)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                                <Star className="h-3.5 w-3.5 mr-1" /> Review
                              </Button>
                            )}
                          </div>
                        </div>
                        {apt.doctorNotes && (
                          <div className="mt-3 pt-3 border-t border-slate-50">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="font-medium">Doctor Notes:</span> {apt.doctorNotes}
                            </p>
                          </div>
                        )}
                        {apt.cancellationReason && (
                          <div className="mt-3 pt-3 border-t border-slate-50">
                            <p className="text-xs text-red-500">
                              <span className="font-medium">Cancelled by {apt.cancelledBy}:</span> {apt.cancellationReason}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">Page {pageNumber}</span>
                <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => p + 1)} disabled={!hasMore}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => { setCancelId(null); setCancelReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason (optional)</label>
              <Textarea placeholder="Why are you cancelling..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">Must cancel at least 2 hours before the appointment.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelId(null); setCancelReason(''); }}>Keep Appointment</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
              {cancelLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewAppointment} onOpenChange={() => { setReviewAppointment(null); setReviewRating(5); setReviewComment(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>Share your feedback for {reviewAppointment?.doctorName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`h-8 w-8 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Comment (optional)</label>
              <Textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} maxLength={300} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewAppointment(null); setReviewRating(5); setReviewComment(''); }}>Skip</Button>
            <Button onClick={handleReview} disabled={reviewLoading} className="bg-teal-600 hover:bg-teal-700">
              {reviewLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
