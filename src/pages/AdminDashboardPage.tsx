import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api';
import type { AdminOverviewStats, AdminAppointmentStats } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/states';
import { StatCard } from '@/components/StatCard';
import {
  AlertCircle, ArrowRight, Calendar, CheckCircle2, ChevronRight, Shield, Star, Stethoscope, Users, XCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Chart colors match the theme tokens in index.css (SVG attributes can't read CSS variables)
const STATUS_SERIES = [
  { key: 'confirmed', label: 'Confirmed', color: '#2066B6' },
  { key: 'completed', label: 'Completed', color: '#1E714A' },
  { key: 'cancelled', label: 'Cancelled', color: '#C12A25' },
  { key: 'pending', label: 'Pending', color: '#A65707' },
  { key: 'noShow', label: 'No-show', color: '#A8A29E' },
] as const;

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AdminAppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, aptRes] = await Promise.all([
          adminApi.getOverviewStats(),
          adminApi.getAppointmentStats(),
        ]);
        setOverview(overviewRes.data);
        setAppointmentStats(aptRes.data);
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reloadKey]);

  if (loading) {
    return <LoadingState label="Loading dashboard…" className="min-h-[60vh]" />;
  }

  if (failed || !overview || !appointmentStats) {
    return (
      <Page>
        <ErrorState
          title="Couldn’t load the dashboard"
          message="The statistics service didn’t respond. Please try again."
          onRetry={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      </Page>
    );
  }

  const series = STATUS_SERIES.map((s) => ({ ...s, value: appointmentStats[s.key] }));
  const donutData = series.filter((d) => d.value > 0);
  const totalAppointments = series.reduce((sum, d) => sum + d.value, 0);
  const pct = (n: number) => (totalAppointments > 0 ? Math.round((n / totalAppointments) * 100) : 0);
  const completionRate = pct(appointmentStats.completed);
  const cancellationRate = pct(appointmentStats.cancelled);

  return (
    <Page width="wide">
      <PageHeader
        title="Overview"
        description="Platform activity at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/specialties"><Shield aria-hidden="true" /> Specialties</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/pending-doctors">Review doctors</Link>
            </Button>
          </>
        }
      />

      {overview.pendingApprovals > 0 && (
        <Link
          to="/admin/pending-doctors"
          className="group mb-6 flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] px-4 py-3.5 text-sm transition-colors hover:bg-warning/10"
        >
          <AlertCircle className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <span className="flex-1">
            <span className="font-semibold">{overview.pendingApprovals} doctor{overview.pendingApprovals === 1 ? '' : 's'} waiting for approval.</span>{' '}
            <span className="text-muted-foreground">They won’t appear in search until you approve them.</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Doctors" value={overview.totalDoctors.toLocaleString()} icon={Stethoscope} />
        <StatCard label="Patients" value={overview.totalPatients.toLocaleString()} icon={Users} />
        <StatCard label="Appointments" value={overview.totalAppointments.toLocaleString()} icon={Calendar} />
        <StatCard label="Reviews" value={overview.totalReviews.toLocaleString()} icon={Star} />
        <StatCard label="Specialties" value={overview.totalSpecialties.toLocaleString()} icon={Shield} />
        <StatCard label="Pending approvals" value={overview.pendingApprovals.toLocaleString()} icon={AlertCircle} tone={overview.pendingApprovals > 0 ? 'warning' : 'default'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Appointments by status</CardTitle>
            <CardDescription>{totalAppointments.toLocaleString()} appointments in total</CardDescription>
          </CardHeader>
          <CardContent>
            {totalAppointments === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <div className="relative size-52 shrink-0" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={64} outerRadius={96} paddingAngle={2} dataKey="value" nameKey="label" stroke="none" isAnimationActive={false}>
                        {donutData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(36 16% 88%)', fontSize: 12, boxShadow: '0 8px 24px -12px rgb(28 25 23 / 0.2)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums">{completionRate}%</span>
                    <span className="text-xs text-muted-foreground">completed</span>
                  </div>
                </div>
                {/* Text legend doubles as the accessible version of the chart */}
                <ul className="w-full space-y-3" aria-label="Appointments by status">
                  {series.map((s) => (
                    <li key={s.key} className="flex items-center gap-3 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                      <span className="flex-1 text-foreground/85">{s.label}</span>
                      <span className="font-semibold tabular-nums">{s.value.toLocaleString()}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{pct(s.value)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Completion rate" value={`${completionRate}%`} icon={CheckCircle2} tone="success" hint="Of all appointments" />
            <StatCard label="Cancellation rate" value={`${cancellationRate}%`} icon={XCircle} tone="destructive" hint="Of all appointments" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: '/admin/pending-doctors', icon: Stethoscope, title: 'Review pending doctors', text: `${overview.pendingApprovals} waiting for approval` },
                { to: '/admin/specialties', icon: Shield, title: 'Manage specialties', text: `${overview.totalSpecialties} configured` },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary/40"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    <a.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{a.title}</span>
                    <span className="block text-xs text-muted-foreground">{a.text}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
