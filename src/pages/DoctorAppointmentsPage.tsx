import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { appointmentsApi } from '@/api';
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
  CheckCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<AppointmentStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NoShow: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [notesId, setNotesId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getDoctorAppointments({
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
  const isPast = (apt: Appointment) => {
  const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
  return appointmentDateTime < new Date();
  };
  const handleComplete = async () => {
    if (!completeId) return;
    setActionLoading(true);
    try {
      await appointmentsApi.complete(completeId);
      toast.success('Appointment completed');
      setCompleteId(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to complete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNotes = async () => {
    if (!notesId) return;
    setActionLoading(true);
    try {
      await appointmentsApi.addNotes(notesId, { notes });
      toast.success('Notes added');
      setNotesId(null);
      setNotes('');
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to add notes');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
            <p className="text-sm text-slate-500">Manage your patient appointments</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageNumber(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
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
                <p className="text-sm text-slate-500">No appointments found</p>
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
                              {apt.patientName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{apt.patientName}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(parseISO(apt.appointmentDate), 'MMM d, yyyy')}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {apt.startTime} - {apt.endTime}</span>
                              </div>
                              {apt.reasonForVisit && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ClipboardList className="h-3 w-3" /> {apt.reasonForVisit}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[apt.status]}`}>
                              {apt.status}
                            </span>
                            {apt.status === 'Confirmed' && isPast(apt) && (
                              <Button size="sm" onClick={() => setCompleteId(apt.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                              </Button>
                            )}
                            {(apt.status === 'Confirmed' || apt.status === 'Completed') && (
                              <Button variant="outline" size="sm" onClick={() => { setNotesId(apt.id); setNotes(apt.doctorNotes || ''); }} className="h-8 text-xs">
                                <MessageSquare className="h-3.5 w-3.5 mr-1" /> Notes
                              </Button>
                            )}
                          </div>
                        </div>
                        {apt.doctorNotes && (
                          <div className="mt-3 pt-3 border-t border-slate-50">
                            <p className="text-xs text-slate-500 flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span className="font-medium">Notes:</span> {apt.doctorNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-slate-600">Page {pageNumber}</span>
                <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => p + 1)} disabled={!hasMore}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={!!completeId} onOpenChange={() => setCompleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Complete Appointment</DialogTitle><DialogDescription>Mark this appointment as completed?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteId(null)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={!!notesId} onOpenChange={() => { setNotesId(null); setNotes(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Doctor Notes</DialogTitle><DialogDescription>Add clinical notes for this appointment</DialogDescription></DialogHeader>
          <div className="py-3">
            <Textarea placeholder="Enter your notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNotesId(null); setNotes(''); }}>Cancel</Button>
            <Button onClick={handleAddNotes} disabled={actionLoading} className="bg-teal-600 hover:bg-teal-700">
              {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
