import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Stethoscope, User, LogOut, CalendarDays,
  Shield, ChevronDown, Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsApi } from '@/api';
import type { Notification } from '@/types';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Doctors', path: '/doctors' },
];

// Role-based profile and appointments routes
const profileRoute = (role: string | null) => {
  if (role === 'Doctor') return '/doctor/profile';
  if (role === 'Admin') return '/admin/dashboard';
  return '/patient/profile';
};

const appointmentsRoute = (role: string | null) => {
  if (role === 'Doctor') return '/doctor/appointments';
  return '/patient/appointments';
};

export function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const fetchNotifications = useCallback(() => {
    if (isAuthenticated) {
      notificationsApi.getMyNotifications(true)
        .then((res) => setNotifications(res.data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.length;
  const displayName = user ? `${user.firstName} ${user.lastName}` : '';
  const initials = user?.firstName?.[0]?.toUpperCase() ?? 'U';

  const handleLogout = () => { logout(); navigate('/'); };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications([]);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              ClinicFlow
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >{link.label}</Link>
            ))}
            {isAuthenticated && role === 'Admin' && (
              <Link to="/admin/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/admin/dashboard')
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >Dashboard</Link>
            )}
            {isAuthenticated && role === 'Doctor' && (
              <Link to="/doctor/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/doctor/dashboard')
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >Dashboard</Link>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <DropdownMenu open={notifOpen} onOpenChange={(open) => {
                  setNotifOpen(open);
                }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5 text-slate-600" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        {unreadCount > 0 && (
                          <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                      </div>
                    ) : (
                      <>
                        {notifications.slice(0, 5).map((n) => (
                          <DropdownMenuItem
                            key={n.id}
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer group"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                              <span className="font-medium text-sm text-slate-900 flex-1">{n.title}</span>
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-2 pl-4">{n.message}</span>
                          </DropdownMenuItem>
                        ))}
                        {notifications.length > 5 && (
                          <div
                            className="px-3 py-2 text-center text-xs text-teal-600 hover:text-teal-800 cursor-pointer border-t border-border"
                            onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                          >
                            View all {notifications.length} notifications
                          </div>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">
                        {user?.firstName ?? 'User'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        {role === 'Admin' && <Shield className="w-3 h-3" />}
                        {role}
                      </span>
                    </div>
                    <DropdownMenuItem onClick={() => navigate(profileRoute(role))} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(appointmentsRoute(role))} className="cursor-pointer">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {role === 'Doctor' ? 'My Appointments' : 'My Appointments'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-600 hover:text-slate-900">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register/patient')}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >{link.label}</Link>
              ))}
              <div className="pt-4 border-t border-border">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{role}</p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <button onClick={() => navigate(profileRoute(role))}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => navigate(appointmentsRoute(role))}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" /> My Appointments
                    </button>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => navigate('/login')} className="w-full">Sign In</Button>
                    <Button onClick={() => navigate('/register/patient')}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
