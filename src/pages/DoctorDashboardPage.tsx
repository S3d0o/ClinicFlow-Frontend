import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { appointmentsApi, doctorsApi } from '@/api';
import type { Appointment, Schedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function DoctorDashboardPage() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, totalUpcoming: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptRes, schedRes] = await Promise.all([
          appointmentsApi.getDoctorAppointments({ pageSize: 50 }),
          doctorsApi.getSchedules(),
        ]);
        const allApts = aptRes.data;
        const today = format(new Date(), 'yyyy-MM-dd');
        const todays = allApts.filter((a) => a.appointmentDate === today);
        setTodayAppointments(todays);
        setSchedules(schedRes.data);
        setStats({
          totalToday: todays.length,
          totalUpcoming: allApts.filter((a) => a.status === 'Confirmed' || a.status === 'Pending').length,
          completedToday: todays.filter((a) => a.status === 'Completed').length,
        });
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComplete = async (id: number) => {
    try {
      await appointmentsApi.complete(id);
      toast.success('Appointment marked as completed');
      setTodayAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Completed' as const } : a)));
      setStats((s) => ({ ...s, completedToday: s.completedToday + 1 }));
    } catch (err: any) {
      toast.error(err.response?.data?.title || 'Failed to complete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  // const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
            <p className="text-sm text-slate-500">Overview of your practice today</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Today's Appointments", value: stats.totalToday, icon: Calendar, color: 'from-teal-500 to-teal-600' },
              { label: 'Upcoming', value: stats.totalUpcoming, icon: Clock, color: 'from-blue-500 to-blue-600' },
              { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Appointments */}
            <div className="lg:col-span-2">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">Today's Schedule</CardTitle>
                    <p className="text-xs text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/doctor/appointments">View All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No appointments scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todayAppointments.map((apt, i) => (
                        <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                                {apt.patientName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{apt.patientName}</p>
                                <p className="text-xs text-slate-400">{apt.startTime} - {apt.endTime}</p>
                                {apt.reasonForVisit && <p className="text-xs text-slate-400">{apt.reasonForVisit}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                apt.status === 'Confirmed' ? 'bg-teal-50 text-teal-700' :
                                apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                apt.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>{apt.status}</span>
                              {apt.status === 'Confirmed' && (
                                <Button size="sm" onClick={() => handleComplete(apt.id)} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Schedule Overview */}
            <div>
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-4 w-4 text-teal-600" /> Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 mb-3">No schedules set</p>
                      <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                        <Link to="/doctor/schedules">Set Schedule</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium text-slate-700">{s.dayOfWeek}</span>
                          <span className="text-xs text-slate-500">{s.startTime} - {s.endTime}</span>
                        </div>
                      ))}
                      <Button asChild variant="outline" size="sm" className="w-full mt-2">
                        <Link to="/doctor/schedules">Manage Schedules</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
