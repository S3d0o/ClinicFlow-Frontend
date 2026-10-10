import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import  { Navbar }  from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { LoadingState } from '@/components/states';

// The landing page loads eagerly for the fastest first paint; every other page is split into its
// own chunk and loaded on first visit (recharts, for example, only loads for the admin dashboard).
import { LandingPage } from '@/pages/LandingPage';

const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

// Public pages
const DoctorsPage = page(() => import('@/pages/DoctorsPage'), 'DoctorsPage');
const DoctorDetailsPage = page(() => import('@/pages/DoctorDetailsPage'), 'DoctorDetailsPage');

// Auth pages
const LoginPage = page(() => import('@/pages/LoginPage'), 'LoginPage');
const RegisterPatientPage = page(() => import('@/pages/RegisterPatientPage'), 'RegisterPatientPage');
const RegisterDoctorPage = page(() => import('@/pages/RegisterDoctorPage'), 'RegisterDoctorPage');
const ForgotPasswordPage = page(() => import('@/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage');
const ConfirmEmailPage = page(() => import('@/pages/ConfirmEmailPage'), 'ConfirmEmailPage');

// Patient pages
const PatientAppointmentsPage = page(() => import('@/pages/PatientAppointmentsPage'), 'PatientAppointmentsPage');
const BookAppointmentPage = page(() => import('@/pages/BookAppointmentPage'), 'BookAppointmentPage');
const PatientProfilePage = page(() => import('@/pages/PatientProfilePage'), 'PatientProfilePage');

// Doctor pages
const DoctorDashboardPage = page(() => import('@/pages/DoctorDashboardPage'), 'DoctorDashboardPage');
const DoctorAppointmentsPage = page(() => import('@/pages/DoctorAppointmentsPage'), 'DoctorAppointmentsPage');
const DoctorSchedulesPage = page(() => import('@/pages/DoctorSchedulesPage'), 'DoctorSchedulesPage');
const DoctorProfilePage = page(() => import('@/pages/DoctorProfilePage'), 'DoctorProfilePage');

// Admin pages
const AdminDashboardPage = page(() => import('@/pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminPendingDoctorsPage = page(() => import('@/pages/AdminPendingDoctorsPage'), 'AdminPendingDoctorsPage');
const AdminSpecialtiesPage = page(() => import('@/pages/AdminSpecialtiesPage'), 'AdminSpecialtiesPage');

// Shared pages
const NotificationsPage = page(() => import('@/pages/NotificationsPage'), 'NotificationsPage');
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage');

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Checking your session…" className="min-h-[60vh]" />;
  }

  if (!isAuthenticated) {
    // Remember where the user was going so LoginPage can send them back afterwards
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  // Hash routing keeps the scroll position between pages; start each page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
        className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<LoadingState label="Loading…" className="min-h-[50vh]" />}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
      <Route path="/doctors" element={<AppLayout><DoctorsPage /></AppLayout>} />
      <Route path="/doctors/:id" element={<AppLayout><DoctorDetailsPage /></AppLayout>} />

      {/* Auth routes */}
      <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
      <Route path="/register/patient" element={<AppLayout><RegisterPatientPage /></AppLayout>} />
      <Route path="/register/doctor" element={<AppLayout><RegisterDoctorPage /></AppLayout>} />
      <Route path="/forgot-password" element={<AppLayout><ForgotPasswordPage /></AppLayout>} />
      <Route path="/reset-password" element={<AppLayout><ResetPasswordPage /></AppLayout>} />
      <Route path="/confirm-email" element={<AppLayout><ConfirmEmailPage /></AppLayout>} />

      {/* Patient routes */}
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <AppLayout><PatientAppointmentsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/book/:doctorId"
        element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <AppLayout><BookAppointmentPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <AppLayout><PatientProfilePage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Doctor routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <AppLayout><DoctorDashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <AppLayout><DoctorAppointmentsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/schedules"
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <AppLayout><DoctorSchedulesPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <AppLayout><DoctorProfilePage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout><AdminDashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pending-doctors"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout><AdminPendingDoctorsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/specialties"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppLayout><AdminSpecialtiesPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared routes */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout><NotificationsPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
