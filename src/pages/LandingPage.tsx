import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
  Clock,
  HeartPulse,
  Users,
  Star,
  ArrowRight,
  Activity,
  Database,
  Server,
  Lock,
  Zap,
  Globe,
  Code2,
  Layers,
  Bell,
  CheckCircle2,
  Building2,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Animation wrapper ─── */
function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 pt-16">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-6"
            >
              <HeartPulse className="w-4 h-4" />
              Modern Healthcare Management
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Your Health,{' '}
              <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              ClinicFlow connects patients with top doctors seamlessly. Book appointments,
              manage your health records, and experience healthcare the modern way.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/doctors">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all px-8"
                >
                  Find a Doctor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/register/patient">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-teal-200 hover:bg-teal-50 text-teal-700 px-8"
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { value: '500+', label: 'Doctors' },
                { value: '10K+', label: 'Patients' },
                { value: '50K+', label: 'Appointments' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              {/* Main card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-slate-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Dr. Sarah Johnson</h3>
                    <p className="text-sm text-slate-500">Cardiologist</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">(128 reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <span>Next available: Today, 2:00 PM</span>
                </div>
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                  Book Appointment
                </Button>
              </motion.div>

              {/* Floating notification card */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -top-6 -right-8 bg-white rounded-2xl shadow-lg p-4 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Appointment Confirmed</p>
                    <p className="text-xs text-slate-500">Today at 3:30 PM</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating reminder card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-lg p-4 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Reminder Set</p>
                    <p className="text-xs text-slate-500">30 min before</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ─── */
function FeaturesSection() {
  const features = [
    {
      icon: CalendarCheck,
      title: 'Easy Booking',
      description: 'Book appointments with just a few clicks. View real-time availability and choose your preferred time slot.',
      color: 'from-teal-400 to-teal-600',
    },
    {
      icon: UserRound,
      title: 'Expert Doctors',
      description: 'Access a network of verified, experienced specialists across multiple medical fields.',
      color: 'from-emerald-400 to-emerald-600',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Private',
      description: 'Your health data is protected with enterprise-grade security and encryption.',
      color: 'from-cyan-400 to-cyan-600',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Book appointments anytime, anywhere. No more waiting on hold or busy signals.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Get automated reminders via email and notifications so you never miss an appointment.',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Star,
      title: 'Verified Reviews',
      description: 'Read honest feedback from real patients to find the right doctor for your needs.',
      color: 'from-cyan-500 to-emerald-500',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
              <Activity className="w-4 h-4" />
              Why Choose ClinicFlow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Healthcare Made Simple
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your health in one modern platform.
            </p>
          </div>
        </FadeInUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FadeInUp key={feature.title} delay={i * 0.1}>
              <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech Stack Section ─── */
function TechStackSection() {
  const techStack = [
    {
      category: 'Backend',
      icon: Server,
      items: [
        { name: '.NET 10', desc: 'Latest framework powering our API' },
        { name: 'Entity Framework Core 10', desc: 'Type-safe database operations' },
        { name: 'SQL Server', desc: 'Reliable relational database' },
        { name: 'JWT Auth', desc: 'Secure token-based authentication' },
      ],
    },
    {
      category: 'Frontend',
      icon: Globe,
      items: [
        { name: 'React 19', desc: 'Modern UI library' },
        { name: 'TypeScript', desc: 'Type-safe development' },
        { name: 'Tailwind CSS', desc: 'Utility-first styling' },
        { name: 'Framer Motion', desc: 'Smooth animations' },
      ],
    },
    {
      category: 'DevOps & Tools',
      icon: Layers,
      items: [
        { name: 'Docker', desc: 'Containerized deployment' },
        { name: 'Serilog + Seq', desc: 'Structured logging' },
        { name: 'Scalar API', desc: 'Interactive API docs' },
        { name: 'GitHub Actions', desc: 'CI/CD pipeline' },
      ],
    },
    {
      category: 'Architecture',
      icon: Code2,
      items: [
        { name: 'Clean Architecture', desc: 'Separation of concerns' },
        { name: 'Repository Pattern', desc: 'Abstracted data access' },
        { name: 'Unit of Work', desc: 'Transaction management' },
        { name: 'Result Pattern', desc: 'Explicit error handling' },
      ],
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
              <Database className="w-4 h-4" />
              Built with Modern Tech
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Our Technology Stack
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              ClinicFlow is built with cutting-edge technologies for performance, security, and scalability.
            </p>
          </div>
        </FadeInUp>

        <div className="grid sm:grid-cols-2 gap-8">
          {techStack.map((stack, i) => (
            <FadeInUp key={stack.category} delay={i * 0.15}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                    <stack.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{stack.category}</h3>
                </div>
                <div className="space-y-3">
                  {stack.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-teal-50/50 transition-colors">
                      <Zap className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works Section ─── */
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: Users,
      title: 'Create Account',
      description: 'Sign up as a patient in seconds with our streamlined registration process.',
    },
    {
      step: '02',
      icon: Stethoscope,
      title: 'Find a Doctor',
      description: 'Browse verified doctors by specialty, location, or rating.',
    },
    {
      step: '03',
      icon: CalendarCheck,
      title: 'Book Appointment',
      description: 'Choose an available time slot that works for your schedule.',
    },
    {
      step: '04',
      icon: HeartPulse,
      title: 'Get Care',
      description: 'Visit your doctor and receive the care you need.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Getting started with ClinicFlow is easy. Follow these simple steps.
            </p>
          </div>
        </FadeInUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <FadeInUp key={s.step} delay={i * 0.15}>
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-teal-100 absolute -top-2 left-1/2 -translate-x-1/2 -z-10">
                  {s.step}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.description}</p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-teal-500 to-emerald-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeInUp>
          <Building2 className="w-16 h-16 text-white/30 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-lg text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust ClinicFlow for their healthcare needs.
            Sign up today and book your first appointment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/patient">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg px-8"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/doctors">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 px-8"
              >
                Browse Doctors
              </Button>
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />
    </div>
  );
}
