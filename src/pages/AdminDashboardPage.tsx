import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api';
import type { AdminOverviewStats, AdminAppointmentStats } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/states';
import { StatCard } from '@/components/StatCard';
import {
  AlertCircle, ArrowRight, BadgeCheck, Calendar, CheckCircle2, ChevronRight, Shield, Star, Stethoscope, Users, XCircle,
} from 'lucide-react';

// Same status colors as StatusBadge
const STATUS_SERIES = [
  { key: 'confirmed', label: 'Confirmed', bar: 'bg-success' },
  { key: 'completed', label: 'Completed', bar: 'bg-info' },
  { key: 'cancelled', label: 'Cancelled', bar: 'bg-destructive' },
  { key: 'pending', label: 'Pending', bar: 'bg-warning' },
  { key: 'noShow', label: 'No-show', bar: 'bg-muted-foreground/50' },
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
  const totalAppointments = series.reduce((sum, d) => sum + d.value, 0);
  const share = (n: number) => (totalAppointments > 0 ? (n / totalAppointments) * 100 : 0);
  const pct = (n: number) => Math.round(share(n));
  const completionRate = pct(appointmentStats.completed);
  const cancellationRate = pct(appointmentStats.cancelled);

  return (
    <Page width="full">
      <PageHeader
        eyebrow="Clinic administration"
        title="Operations overview"
        description="Platform activity at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/specialties"><Shield aria-hidden="true" /> Specialties</Link>
            </Button>
            <Button variant="strong" asChild>
              <Link to="/admin/pending-doctors"><BadgeCheck aria-hidden="true" /> Review doctors</Link>
            </Button>
          </>
        }
      />

      {overview.pendingApprovals > 0 && (
        <Link
          to="/admin/pending-doctors"
          className="group mb-6 flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] px-4 py-3.5 text-body-md transition-colors hover:bg-warning/10"
        >
          <AlertCircle className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <span className="flex-1">
            <span className="font-semibold">{overview.pendingApprovals} doctor{overview.pendingApprovals === 1 ? '' : 's'} waiting for approval.</span>{' '}
            <span className="text-muted-foreground">They won’t appear in search until you approve them.</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Doctors" value={overview.totalDoctors.toLocaleString()} icon={Stethoscope} />
        <StatCard label="Patients" value={overview.totalPatients.toLocaleString()} icon={Users} />
        <StatCard label="Appointments" value={overview.totalAppointments.toLocaleString()} icon={Calendar} />
        <StatCard label="Reviews" value={overview.totalReviews.toLocaleString()} icon={Star} />
        <StatCard label="Specialties" value={overview.totalSpecialties.toLocaleString()} icon={Shield} />
        <StatCard
          label="Pending approvals"
          value={overview.pendingApprovals.toLocaleString()}
          icon={AlertCircle}
          tone={overview.pendingApprovals > 0 ? 'destructive' : 'default'}
          highlight={overview.pendingApprovals > 0}
          hint={overview.pendingApprovals > 0 ? 'Requires action' : 'All caught up'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-headline-md">Appointment flow</CardTitle>
            <CardDescription>{totalAppointments.toLocaleString()} appointments in total, by status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalAppointments === 0 ? (
              <p className="rounded-xl bg-muted py-12 text-center text-body-md text-muted-foreground">No appointments yet.</p>
            ) : (
              <>
                {/* Decorative: the tiles below carry the same numbers as text */}
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  {series.filter((s) => s.value > 0).map((s) => (
                    <div key={s.key} className={cn('h-full first:rounded-l-full last:rounded-r-full', s.bar)} style={{ width: `${share(s.value)}%` }} />
                  ))}
                </div>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Appointments by status">
                  {series.map((s) => (
                    <li key={s.key} className="rounded-xl bg-muted px-4 py-3">
                      <span className="flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground">
                        <span className={cn('size-2 shrink-0 rounded-full', s.bar)} aria-hidden="true" />
                        {s.label}
                      </span>
                      <p className="mt-1 flex items-baseline gap-2">
                        <span className="font-display text-headline-md tabular-nums">{s.value.toLocaleString()}</span>
                        <span className="text-body-sm text-muted-foreground tabular-nums">{pct(s.value)}%</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label="Completion rate" value={`${completionRate}%`} icon={CheckCircle2} tone="success" progress={completionRate} hint="Of all appointments" />
            <StatCard label="Cancellation rate" value={`${cancellationRate}%`} icon={XCircle} tone="destructive" progress={cancellationRate} hint="Of all appointments" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: '/admin/pending-doctors', icon: BadgeCheck, title: 'Review pending doctors', text: `${overview.pendingApprovals} waiting for approval` },
                { to: '/admin/specialties', icon: Shield, title: 'Manage specialties', text: `${overview.totalSpecialties} configured` },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-xl bg-muted px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-card text-primary shadow-xs">
                    <a.icon className="size-[1.125rem]" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-label-md">{a.title}</span>
                    <span className="mt-0.5 block text-body-sm text-muted-foreground">{a.text}</span>
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
