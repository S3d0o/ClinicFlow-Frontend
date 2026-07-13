import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import  { Navbar }  from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

// Public pages
import { LandingPage } from '@/pages/LandingPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { DoctorDetailsPage } from '@/pages/DoctorDetailsPage';

// Auth pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPatientPage } from '@/pages/RegisterPatientPage';
import { RegisterDoctorPage } from '@/pages/RegisterDoctorPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ConfirmEmailPage } from '@/pages/ConfirmEmailPage';

// Patient pages
import { PatientAppointmentsPage } from '@/pages/PatientAppointmentsPage';
import { BookAppointmentPage } from '@/pages/BookAppointmentPage';
import { PatientProfilePage } from '@/pages/PatientProfilePage';

// Doctor pages
import { DoctorDashboardPage } from '@/pages/DoctorDashboardPage';
import { DoctorAppointmentsPage } from '@/pages/DoctorAppointmentsPage';
import { DoctorSchedulesPage } from '@/pages/DoctorSchedulesPage';
import { DoctorProfilePage } from '@/pages/DoctorProfilePage';

// Admin pages
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminPendingDoctorsPage } from '@/pages/AdminPendingDoctorsPage';
import { AdminSpecialtiesPage } from '@/pages/AdminSpecialtiesPage';

// Shared pages
import { NotificationsPage } from '@/pages/NotificationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
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
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
