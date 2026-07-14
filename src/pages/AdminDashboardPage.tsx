import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '@/api';
import type { AdminOverviewStats, AdminAppointmentStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Stethoscope, Calendar, Shield, Clock, Star, ChevronRight, TrendingUp,
  Activity, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Colour tokens ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Confirmed: '#0D9488',
  Completed: '#10B981',
  Cancelled: '#EF4444',
  Pending:   '#F59E0B',
  'No Show': '#94A3B8',
};

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, gradient, delay,
}: {
  label: string; value: number; icon: React.ElementType;
  gradient: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
            </div>
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Custom donut label ───────────────────────────────────────────────────────
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AdminAppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, aptRes] = await Promise.all([
          adminApi.getOverviewStats(),
          adminApi.getAppointmentStats(),
        ]);
        setOverview(overviewRes.data);
        setAppointmentStats(aptRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Derived chart data ───────────────────────────────────────────────────
  const donutData = appointmentStats ? [
    { name: 'Confirmed', value: appointmentStats.confirmed },
    { name: 'Completed', value: appointmentStats.completed },
    { name: 'Cancelled', value: appointmentStats.cancelled },
    { name: 'Pending',   value: appointmentStats.pending   },
    { name: 'No Show',   value: appointmentStats.noShow    },
  ].filter(d => d.value > 0) : [];

  const barData = overview ? [
    { name: 'Doctors',      value: overview.totalDoctors,      fill: '#0D9488' },
    { name: 'Patients',     value: overview.totalPatients,     fill: '#3B82F6' },
    { name: 'Appointments', value: overview.totalAppointments, fill: '#8B5CF6' },
    { name: 'Reviews',      value: overview.totalReviews,      fill: '#10B981' },
    { name: 'Specialties',  value: overview.totalSpecialties,  fill: '#F59E0B' },
  ] : [];

  const totalAppointments = donutData.reduce((s, d) => s + d.value, 0);

  // completion rate
  const completionRate = totalAppointments > 0
    ? Math.round(((appointmentStats?.completed ?? 0) / totalAppointments) * 100)
    : 0;
  const cancellationRate = totalAppointments > 0
    ? Math.round(((appointmentStats?.cancelled ?? 0) / totalAppointments) * 100)
    : 0;

  const overviewCards = overview ? [
    { label: 'Total Doctors',      value: overview.totalDoctors,      icon: Stethoscope, gradient: 'from-teal-500 to-teal-600'    },
    { label: 'Total Patients',     value: overview.totalPatients,     icon: Users,       gradient: 'from-blue-500 to-blue-600'    },
    { label: 'Appointments',       value: overview.totalAppointments, icon: Calendar,    gradient: 'from-violet-500 to-violet-600' },
    { label: 'Specialties',        value: overview.totalSpecialties,  icon: Shield,      gradient: 'from-amber-500 to-amber-600'  },
    { label: 'Pending Approvals',  value: overview.pendingApprovals,  icon: Clock,       gradient: 'from-rose-500 to-rose-600'    },
    { label: 'Total Reviews',      value: overview.totalReviews,      icon: Star,        gradient: 'from-emerald-500 to-emerald-600' },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* ── Header ── */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Platform overview and key metrics</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-100 rounded-lg px-3 py-1.5 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              Live data
            </div>
          </div>

          {/* ── Overview stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {overviewCards.map((card, i) => (
              <StatCard key={card.label} {...card} delay={i * 0.05} />
            ))}
          </div>

          {/* ── KPI pills ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" />
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cancellation Rate</p>
                    <p className="text-2xl font-bold text-red-500">{cancellationRate}%</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pending Approvals</p>
                    <p className="text-2xl font-bold text-amber-600">{overview?.pendingApprovals ?? 0}</p>
                  </div>
                  {(overview?.pendingApprovals ?? 0) > 0 && (
                    <Link to="/admin/pending-doctors" className="ml-auto text-xs text-teal-600 hover:underline">
                      Review →
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Donut chart */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border-slate-100 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800">Appointment Status Distribution</CardTitle>
                  <p className="text-xs text-slate-400">{totalAppointments.toLocaleString()} total appointments</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-64 h-64 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomLabel}
                          >
                            {donutData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), 'Appointments']}
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-col gap-2.5 w-full">
                      {donutData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }} />
                            <span className="text-sm text-slate-600">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{entry.value.toLocaleString()}</span>
                            <span className="text-xs text-slate-400">
                              ({totalAppointments > 0 ? Math.round((entry.value / totalAppointments) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bar chart */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border-slate-100 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800">Platform Overview</CardTitle>
                  <p className="text-xs text-slate-400">Key numbers at a glance</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                          formatter={(value: number) => [value.toLocaleString(), 'Count']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                          {barData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Bottom row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Appointment status table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">Appointment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {appointmentStats && [
                      { label: 'Confirmed', value: appointmentStats.confirmed, bg: 'bg-teal-50',   text: 'text-teal-700',   bar: 'bg-teal-500'   },
                      { label: 'Completed', value: appointmentStats.completed, bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
                      { label: 'Cancelled', value: appointmentStats.cancelled, bg: 'bg-red-50',     text: 'text-red-700',    bar: 'bg-red-400'    },
                      { label: 'Pending',   value: appointmentStats.pending,   bg: 'bg-amber-50',   text: 'text-amber-700',  bar: 'bg-amber-400'  },
                      { label: 'No Show',   value: appointmentStats.noShow,    bg: 'bg-slate-50',   text: 'text-slate-600',  bar: 'bg-slate-300'  },
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.bg}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`text-sm font-medium ${item.text} w-20`}>{item.label}</span>
                          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.bar} rounded-full transition-all duration-700`}
                              style={{ width: totalAppointments > 0 ? `${(item.value / totalAppointments) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${item.text} ml-3 w-8 text-right`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link to="/admin/pending-doctors">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Clock className="h-5 w-5 text-rose-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Pending Doctor Approvals</p>
                            <p className="text-xs text-slate-400">{overview?.pendingApprovals || 0} doctors waiting for review</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </Link>
                    <Link to="/admin/specialties">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Shield className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Manage Specialties</p>
                            <p className="text-xs text-slate-400">{overview?.totalSpecialties || 0} specialties configured</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
