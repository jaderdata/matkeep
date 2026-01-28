
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, ChevronRight, User, GraduationCap, CreditCard, Activity, Loader2, UserPlus, Building2 } from 'lucide-react';
import AcademyDashboard from './views/AcademyDashboard';
import StudentManagement from './views/StudentManagement';
import AcademySettings from './views/AcademySettings';
import AcademyReports from './views/AcademyReports';
import AcademyRegistrationLink from './views/AcademyRegistrationLink';
import StudentPortal from './views/StudentPortal';
import PublicRegistration from './views/PublicRegistration';
import Login from './views/Login';
import AcademyWizard from './views/AcademyWizard';
import { MasterLayout } from './views/Master/MasterLayout';
import MasterDashboard from './views/Master/MasterDashboard';
import MasterAcademyList from './views/Master/MasterAcademyList';
import MasterAcademyRegistration from './views/Master/MasterAcademyRegistration';
import ForgotPassword from './views/ForgotPassword';
import StudentCheckIn from './views/StudentCheckIn';
import { PWAManager } from './components/PWAManager';
import { supabase } from './services/supabase';
import { Academy } from './types';
import { TrialBanner } from './components/TrialBanner';

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${isActive
        ? 'bg-gray-100 border-gray-900 text-gray-900'
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

// Redirect handler for unprotected routes when logged in
const AuthRedirect: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (session) return <Navigate to="/academy/dashboard" replace />;
  return <>{children}</>;
};

// Guard for protected routes
const RequireAuth: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireMasterAuth: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.email !== 'jader_dourado@hotmail.com') {
    return <Navigate to="/academy/dashboard" replace />;
  }
  return <>{children}</>;
};

const AcademyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const fetchAcademy = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        if (session.user.email === 'jader_dourado@hotmail.com') {
          const actingId = localStorage.getItem('master_acting_as_academy_id');
          if (!actingId) {
            window.location.href = '/#/master/dashboard';
            return;
          }
        }

        const actingId = localStorage.getItem('master_acting_as_academy_id');
        let query = supabase.from('academies').select('*');

        if (session.user.email === 'jader_dourado@hotmail.com' && actingId) {
          query = query.eq('id', actingId);
        } else {
          query = query.eq('admin_email', session.user.email);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) throw error;
        if (data) {
          setAcademy({
            id: data.id,
            name: data.name,
            address: data.address,
            contact: data.contact,
            logoUrl: data.logo_url,
            subscription_plan: data.subscription_plan,
            trial_start_date: data.trial_start_date,
            trial_end_date: data.trial_end_date,
            settings: { yellowFlagDays: data.yellow_flag_days, redFlagDays: data.red_flag_days }
          });
        }
      } catch (err) {
        console.error('Error fetching academy:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademy();

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ email: session.user.email, role: 'Instructor / Administrator' });
      }
    };
    fetchUser();

    // Listen for updates from settings
    window.addEventListener('academy_updated', fetchAcademy);
    return () => {
      window.removeEventListener('academy_updated', fetchAcademy);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;

  return (
    <div className="flex min-h-screen bg-white print:block">
      <PWAManager academy={academy} />
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-300 flex flex-col h-screen sticky top-0 bg-white z-20 print:hidden">
        <div className="p-6 border-b border-gray-300 flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="text-xl font-bold tracking-tight">MATKEEP</span>
        </div>

        <nav className="flex-1 py-4">
          <SidebarLink to="/academy/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarLink to="/academy/students" icon={<Users size={20} />} label="Students" />
          <SidebarLink to="/academy/registration-link" icon={<UserPlus size={20} />} label="Registration Link" />
          <SidebarLink to="/academy/reports" icon={<FileText size={20} />} label="Reports" />
          <SidebarLink to="/academy/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-300">
          <div className="flex items-center gap-3 px-2 py-2 mb-4">
            {academy?.logoUrl ? (
              <img src={academy.logoUrl} alt="Logo" className="w-8 h-8 bg-gray-200 border border-gray-300 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">M</div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate leading-tight">{academy?.name || 'Academy'}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                {user?.email ? user.email.split('@')[0] : 'Admin'} / {user?.role || 'Instr/Admin'}
              </span>
            </div>
          </div>
          {localStorage.getItem('master_acting_as_academy_id') && (
            <button
              onClick={() => {
                localStorage.removeItem('master_acting_as_academy_id');
                window.location.href = '/#/master/dashboard';
              }}
              className="flex items-center gap-3 px-4 py-2 w-full text-sm font-black text-amber-600 hover:bg-amber-100 transition-colors border border-amber-400 mb-2 uppercase tracking-tighter"
            >
              <Building2 size={18} />
              <span>Back to Master</span>
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem('master_acting_as_academy_id');
              supabase.auth.signOut();
            }}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <header className="h-16 border-b border-gray-300 bg-white flex items-center px-8 sticky top-0 z-10 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-widest text-gray-400">Academy Portal</h1>
            {!isOnline && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 text-[10px] font-black uppercase border border-amber-100 animate-pulse">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Offline Mode Active
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/public/register" className="text-xs font-bold text-blue-600 hover:underline">Public Registration Link</Link>
          </div>
        </header>
        <TrialBanner academy={academy} />
        <div className="p-8 flex-1 overflow-y-auto print:p-0 print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
};

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-900 flex items-center justify-center font-bold">M</div>
            <span className="font-bold tracking-tighter text-xl">MATKEEP</span>
          </div>
          <nav className="flex gap-6 text-sm font-medium uppercase tracking-tighter">
            <Link to="/student/dashboard" className="hover:text-gray-300">Home</Link>
            <Link to="/student/card" className="hover:text-gray-300">Card Pass</Link>
            <Link to="/student/profile" className="hover:text-gray-300">Profile</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;

  return (
    <HashRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<AuthRedirect session={session}><Login /></AuthRedirect>} />
        <Route path="/forgot-password" element={<AuthRedirect session={session}><ForgotPassword /></AuthRedirect>} />
        <Route path="/check-in" element={<RequireAuth session={session}><StudentCheckIn /></RequireAuth>} />
        <Route path="/register-academy" element={<AuthRedirect session={session}><AcademyWizard /></AuthRedirect>} />

        {/* Master Admin Routes */}
        <Route path="/master" element={<RequireMasterAuth session={session}><MasterLayout><Navigate to="/master/dashboard" replace /></MasterLayout></RequireMasterAuth>} />
        <Route path="/master/dashboard" element={<RequireMasterAuth session={session}><MasterLayout><MasterDashboard /></MasterLayout></RequireMasterAuth>} />
        <Route path="/master/academies" element={<RequireMasterAuth session={session}><MasterLayout><MasterAcademyList /></MasterLayout></RequireMasterAuth>} />
        <Route path="/master/registration-link" element={<RequireMasterAuth session={session}><MasterLayout><MasterAcademyRegistration /></MasterLayout></RequireMasterAuth>} />

        {/* Academy Private Routes */}
        <Route path="/academy" element={<RequireAuth session={session}><AcademyLayout><Navigate to="/academy/dashboard" replace /></AcademyLayout></RequireAuth>} />
        <Route path="/academy/dashboard" element={<RequireAuth session={session}><AcademyLayout><AcademyDashboard /></AcademyLayout></RequireAuth>} />
        <Route path="/academy/students" element={<RequireAuth session={session}><AcademyLayout><StudentManagement /></AcademyLayout></RequireAuth>} />
        <Route path="/academy/registration-link" element={<RequireAuth session={session}><AcademyLayout><AcademyRegistrationLink /></AcademyLayout></RequireAuth>} />
        <Route path="/academy/reports" element={<RequireAuth session={session}><AcademyLayout><AcademyReports /></AcademyLayout></RequireAuth>} />
        <Route path="/academy/settings" element={<RequireAuth session={session}><AcademyLayout><AcademySettings /></AcademyLayout></RequireAuth>} />

        {/* Student Portal (Unprotected for now or has its own auth) */}
        <Route path="/student/*" element={<StudentLayout><StudentPortal /></StudentLayout>} />

        {/* Public Registration */}
        <Route path="/public/register" element={<PublicRegistration />} />
        <Route path="/public/register/:academyId" element={<PublicRegistration />} />

        {/* Default Redirect */}
        <Route path="/" element={
          session
            ? (session.user.email === 'jader_dourado@hotmail.com' ? <Navigate to="/master/dashboard" replace /> : <Navigate to="/academy/dashboard" replace />)
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
