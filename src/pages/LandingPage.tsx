import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Fades content in once when it scrolls into view. With reduced motion preferred, content renders
 * statically (visible immediately) instead of starting transparent.
 */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Hero ─── */
const heroPoints = ['Confirmed instantly', 'Reminders before every visit', 'Reviews from completed visits'];

function BookingPreview() {
  const times = ['9:00', '9:30', '10:00', '10:30', '11:00', '12:30'];
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,hsl(var(--primary)/0.12),transparent_70%)]" />
      <div className="rounded-2xl border bg-card p-5 shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-foreground">AE</span>
          <div className="min-w-0">
            <p className="font-semibold">Dr. Ahmed El-Sayed</p>
            <p className="text-sm text-muted-foreground">Cardiology · Cairo</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold">
            <Star className="size-3.5 fill-amber-400 text-amber-400" /> 4.8
          </span>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-1.5 text-center">
          {['Today', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
            <div key={d} className={i === 1 ? 'rounded-lg bg-primary py-2 text-primary-foreground' : 'rounded-lg py-2 text-muted-foreground'}>
              <p className="text-[11px] font-medium">{d}</p>
              <p className="text-base font-semibold">{12 + i}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Morning</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {times.map((t, i) => (
            <div
              key={t}
              className={
                i === 2
                  ? 'rounded-md border border-primary bg-primary/[0.06] py-2 text-center text-sm font-semibold text-primary'
                  : 'rounded-md border py-2 text-center text-sm text-foreground'
              }
            >
              {t} AM
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
          Book Tue 13 · 10:00 AM
        </div>
      </div>
      <div className="absolute -bottom-16 -left-6 hidden items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-elevated sm:flex">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Appointment confirmed</p>
          <p className="text-xs text-muted-foreground">Reminder set for Monday</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_60%_at_85%_20%,hsl(var(--secondary)),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-28">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Clinic appointments, simplified
          </p>
          <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            Care that fits <span className="text-primary">your schedule.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Find the right specialist, see their real availability, and book a confirmed appointment in a few clicks — no phone calls, no waiting on hold.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/doctors">
                <Search aria-hidden="true" /> Find a doctor
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register/patient">Create a free account</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
            {heroPoints.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15}>
          <BookingPreview />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
const steps = [
  { icon: Search, title: 'Find a specialist', text: 'Search by name, city or specialty and compare ratings, experience and fees.' },
  { icon: CalendarClock, title: 'Pick a time', text: 'Choose an open slot from the next two weeks. Your booking is confirmed straight away.' },
  { icon: BellRing, title: 'Get reminded', text: 'We email and notify you before the visit, and you can cancel up to 2 hours ahead.' },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">From search to confirmed visit in three steps</h2>
      </Reveal>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <li className="h-full rounded-xl border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/* ─── Roles ─── */
const roles = [
  {
    icon: UserRound,
    title: 'For patients',
    points: ['Search doctors by specialty, city and name', 'Book open slots and get instant confirmation', 'Cancel up to 2 hours before your visit', 'Review your doctor after a completed visit'],
    cta: { label: 'Find a doctor', to: '/doctors' },
  },
  {
    icon: Stethoscope,
    title: 'For doctors',
    points: ['Publish weekly hours; slots are created for you', 'See today’s visits at a glance', 'Complete visits and keep clinical notes', 'Build your reputation with verified reviews'],
    cta: { label: 'Join as a doctor', to: '/register/doctor' },
  },
  {
    icon: LayoutDashboard,
    title: 'For clinic admins',
    points: ['Approve new doctors before they go live', 'Manage the specialty catalogue', 'Track appointments and completion rates', 'Suspend accounts when needed'],
    cta: null,
  },
];

function Roles() {
  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-primary">One platform, three roles</p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">Built for everyone in the visit</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {roles.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-xl border bg-background p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <r.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{r.title}</h3>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
                {r.cta && (
                  <Link to={r.cta.to} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    {r.cta.label} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Trust ─── */
const trust = [
  { icon: ShieldCheck, title: 'Approved doctors', text: 'Every doctor is approved by the clinic team before appearing in search.' },
  { icon: CalendarCheck, title: 'No double bookings', text: 'Each slot can only be booked once — what you see is genuinely available.' },
  { icon: ClipboardList, title: 'Your health details', text: 'Keep blood type, allergies and an emergency contact on your profile.' },
  { icon: Users, title: 'Honest reviews', text: 'Only patients with a completed visit can rate their doctor.' },
];

function Trust() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <Reveal>
          <p className="text-sm font-medium text-primary">Why ClinicFlow</p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">Thoughtful by design, reliable by default</h2>
          <p className="mt-4 text-muted-foreground">
            The details that make booking care less stressful — handled for you, every time.
          </p>
        </Reveal>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.06}>
              <t.icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech (portfolio context, intentionally understated) ─── */
const tech = ['.NET 10 Web API', 'EF Core + SQL Server', 'JWT with rotating refresh tokens', 'React 19 + TypeScript', 'Tailwind CSS', 'Docker'];

function UnderTheHood() {
  return (
    <section aria-labelledby="tech-heading" className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        <h2 id="tech-heading" className="shrink-0 text-sm font-semibold text-muted-foreground">Under the hood</h2>
        <ul className="flex flex-wrap gap-2">
          {tech.map((t) => (
            <li key={t} className="rounded-md border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Call to action ─── */
function CallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(45%_70%_at_15%_0%,hsl(168_60%_40%/0.5),transparent_70%),radial-gradient(40%_60%_at_100%_100%,hsl(40_80%_70%/0.14),transparent_70%)]"
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">Your next appointment is a few clicks away</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Create a free account to book, manage and review your visits — or join as a doctor to start accepting patients.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/doctors">
                Find a doctor <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50">
              <Link to="/register/doctor">
                <Stethoscope aria-hidden="true" /> Join as a doctor
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Roles />
      <Trust />
      <CallToAction />
      <UnderTheHood />
    </>
  );
}
