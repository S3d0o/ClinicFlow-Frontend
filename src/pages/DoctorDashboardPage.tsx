import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { appointmentsApi, doctorsApi } from '@/api';
import type { Appointment, DayOfWeek, Schedule } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-error';
import { hasAppointmentStarted } from '@/lib/appointments';
import { formatTime, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Page, PageHeader } from '@/components/layout/Page';
import { LoadingState } from '@/components/states';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { CalendarDays, CalendarRange, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const weekDays: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, totalUpcoming: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptRes, schedRes] = await Promise.all([
          // The API requires both paging parameters (contract §5.4 #20); 50 is the documented maximum
          appointmentsApi.getDoctorAppointments({ pageNumber: 1, pageSize: 50 }),
          doctorsApi.getSchedules(),
        ]);
        const allApts = aptRes.data;
        const today = format(new Date(), 'yyyy-MM-dd');
        const todays = allApts
          .filter((a) => a.appointmentDate === today)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
    setCompletingId(id);
    try {
      await appointmentsApi.complete(id);
      toast.success('Appointment marked as completed');
      setTodayAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Completed' as const } : a)));
      setStats((s) => ({ ...s, completedToday: s.completedToday + 1 }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to complete'));
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your dashboard…" className="min-h-[60vh]" />;
  }

  const firstName = user?.firstName;
  const scheduleByDay = new Map(schedules.map((s) => [s.dayOfWeek, s]));
  const todayName = format(new Date(), 'EEEE');

  return (
    <Page width="wide">
      <PageHeader
        eyebrow={format(new Date(), 'EEEE, MMMM d')}
        title={firstName ? `${greeting()}, Dr. ${firstName}` : greeting()}
        description="Here’s what your day looks like."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/doctor/schedules"><CalendarRange aria-hidden="true" /> Manage schedule</Link>
            </Button>
            <Button asChild>
              <Link to="/doctor/appointments">All appointments</Link>
            </Button>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today’s appointments" value={stats.totalToday} icon={CalendarDays} />
        <StatCard label="Upcoming (confirmed)" value={stats.totalUpcoming} icon={Clock} hint="Across your 50 most recent bookings" />
        <StatCard label="Completed today" value={stats.completedToday} icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Today’s agenda</CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            {todayAppointments.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto mb-3 size-6 text-muted-foreground/60" aria-hidden="true" />
                <p className="text-sm font-medium">No appointments today</p>
                <p className="mt-1 text-sm text-muted-foreground">Enjoy the quiet — new bookings will appear here.</p>
              </div>
            ) : (
              <ol className="divide-y">
                {todayAppointments.map((apt) => {
                  const canComplete = apt.status === 'Confirmed' && hasAppointmentStarted(apt);
                  return (
                    <li key={apt.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                      <div className="w-24 shrink-0">
                        <p className="text-sm font-semibold tabular-nums">{formatTime(apt.startTime)}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">until {formatTime(apt.endTime)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{apt.patientName}</p>
                        <p className="truncate text-sm text-muted-foreground">{apt.reasonForVisit || 'No reason given'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={apt.status} />
                        {canComplete && (
                          <Button size="sm" onClick={() => handleComplete(apt.id)} disabled={completingId === apt.id}>
                            <CheckCircle2 aria-hidden="true" /> {completingId === apt.id ? 'Saving…' : 'Complete'}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader className="border-b">
            <CardTitle>Weekly availability</CardTitle>
            <CardDescription>Slots are generated for the next 14 days.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            <ul className="divide-y">
              {weekDays.map((day) => {
                const s = scheduleByDay.get(day);
                const isToday = day === todayName;
                return (
                  <li key={day} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className={cn('font-medium', isToday && 'text-primary')}>
                      {day}
                      {isToday && <span className="sr-only"> (today)</span>}
                    </span>
                    {s ? (
                      <span className="flex items-center gap-2">
                        {!s.isActive && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">Paused</span>
                        )}
                        <span className={cn('tabular-nums', s.isActive ? 'text-foreground' : 'text-muted-foreground')}>
                          {formatTimeRange(s.startTime, s.endTime)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Off</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link to="/doctor/schedules" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Edit availability <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
