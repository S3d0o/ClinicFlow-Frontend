import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AppShell } from '@/components/shell/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { LoadingState } from '@/components/states';
import { homeByRole, postLoginPath } from '@/lib/navigation';
import type { UserRole } from '@/types';

// The landing page loads eagerly for the fastest first paint; every other page is split into its
// own chunk and loaded on first visit.
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

/** Layout route for signed-in pages. `roles` limits it to those roles; others go to their own home. */
function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where the user was going so LoginPage can send them back afterwards
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={homeByRole[role]} replace />;
  }

  return <Outlet />;
}

/** Layout route for sign-in and sign-up pages: signed-in users are sent on to where they belong. */
function GuestOnlyRoute() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (isAuthenticated && role) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={postLoginPath(role, from)} replace />;
  }

  return <Outlet />;
}

// Wraps every route and stays mounted across navigation. Signed-in users get the sidebar shell;
// visitors get the top navbar and full footer.
function AppLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, role, isLoading } = useAuth();

  // Hash routing keeps the scroll position between pages; start each page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Wait for the session restore so signed-in users don't see the visitor navbar flash first, and
  // route guards don't redirect before the session is known
  if (isLoading) {
    return <LoadingState label="Loading…" className="min-h-screen" />;
  }

  const content = (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<LoadingState label="Loading…" className="min-h-[50vh]" />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <>
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
        className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      {isAuthenticated && role ? (
        <AppShell>{content}</AppShell>
      ) : (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {content}
          </main>
          <Footer />
        </div>
      )}
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailsPage />} />

        {/* Auth routes */}
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/patient" element={<RegisterPatientPage />} />
          <Route path="/register/doctor" element={<RegisterDoctorPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        {/* Opened from email links, so they work whether or not someone is signed in */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />

        {/* Patient routes */}
        <Route element={<ProtectedRoute roles={['Patient']} />}>
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/book/:doctorId" element={<BookAppointmentPage />} />
          <Route path="/patient/profile" element={<PatientProfilePage />} />
        </Route>

        {/* Doctor routes */}
        <Route element={<ProtectedRoute roles={['Doctor']} />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          <Route path="/doctor/schedules" element={<DoctorSchedulesPage />} />
          <Route path="/doctor/profile" element={<DoctorProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/pending-doctors" element={<AdminPendingDoctorsPage />} />
          <Route path="/admin/specialties" element={<AdminSpecialtiesPage />} />
        </Route>

        {/* Shared routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
