import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { doctorsApi, appointmentsApi } from '@/api';
import type { DoctorDetails, Slot } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

export function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);

  const datesPerPage = 7;
  const today = new Date();

  useEffect(() => {
    if (!doctorId) return;
    doctorsApi
      .getById(Number(doctorId))
      .then((res) => setDoctor(res.data))
      .catch(() => toast.error('Failed to load doctor details'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const fetchSlots = useCallback(async (date: Date) => {
    if (!doctorId) return;
    setSlotsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await doctorsApi.getSlots(Number(doctorId), dateStr);
      setSlots(res.data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const visibleDates = Array.from({ length: datesPerPage }, (_, i) =>
    addDays(today, dateOffset + i)
  );

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      await appointmentsApi.book({
        slotId: selectedSlot.id,
        reasonForVisit: reason || undefined,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err: any) {
      const title = err.response?.data?.title || 'Failed to book appointment';
      toast.error(title);
    } finally {
      setBookingLoading(false);
      setShowConfirm(false);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-700">Doctor not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-6 text-slate-500 hover:text-teal-700"
          >
            <Link to={`/doctors/${doctor.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Doctor
            </Link>
          </Button>

          {/* Doctor Header */}
          <Card className="mb-6 border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                  {doctor.fullName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{doctor.fullName}</h1>
                  <p className="text-sm text-teal-600 font-medium">{doctor.specialtyName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {doctor.clinicCity}
                    </span>
                    <span>{doctor.consultationFee} EGP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className="mb-6 border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" /> Select a Date
              </h2>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  onClick={() => setDateOffset((o) => Math.max(0, o - datesPerPage))}
                  disabled={dateOffset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 grid grid-cols-7 gap-1.5">
                  {visibleDates.map((date) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => !isPast && setSelectedDate(date)}
                        disabled={isPast}
                        className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs transition-all duration-200 ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
                            : isPast
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        <span className="font-medium">{getDateLabel(date)}</span>
                        <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                          {format(date, 'd')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  onClick={() => setDateOffset((o) => o + datesPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="mb-6 border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                Available Slots — {format(selectedDate, 'EEEE, MMM d')}
              </h2>

              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No available slots for this date</p>
                  <p className="text-xs text-slate-400 mt-1">Try selecting a different date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <motion.button
                        key={slot.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
                            : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-100 hover:border-teal-200'
                        }`}
                      >
                        {slot.startTime}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reason + Book */}
          <AnimatePresence>
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-teal-200 shadow-md shadow-teal-500/5">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-teal-700">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">
                        Selected: {format(selectedDate, 'EEEE, MMM d')} at {selectedSlot.startTime} - {selectedSlot.endTime}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                        Reason for Visit (optional)
                      </label>
                      <Input
                        placeholder="e.g., Annual check-up, follow-up..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => setShowConfirm(true)}
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/20 h-11 text-base"
                    >
                      Confirm Booking
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Please review your appointment details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-slate-400">Doctor</p>
                <p className="text-sm font-medium text-slate-800">{doctor.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Calendar className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-medium text-slate-800">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Clock className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-slate-400">Time</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedSlot?.startTime} - {selectedSlot?.endTime}
                </p>
              </div>
            </div>
            {reason && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-400 mb-1">Reason</p>
                <p className="text-sm text-slate-700">{reason}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={bookingLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {bookingLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
