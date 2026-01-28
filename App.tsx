
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
      title={label || undefined}
      className={`flex items-center ${label ? 'gap-3' : 'justify-center'} px-4 py-3 text-sm font-medium border-l-4 transition-colors ${isActive
        ? 'bg-gray-100 border-gray-900 text-gray-900'
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      {icon}
      {label && <span>{label}</span>}
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const SYSTEM_VERSION = 'v1.0.9';

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
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} border-r border-gray-300 flex flex-col h-screen sticky top-0 bg-white z-20 transition-all duration-300 print:hidden`}>
        <div className={`p-6 border-b border-gray-300 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-white font-bold text-xl shrink-0">M</div>
              <span className="text-xl font-bold tracking-tight">MATKEEP</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <div className="w-5 h-0.5 bg-gray-900 relative after:absolute after:top-1.5 after:left-0 after:w-5 after:h-0.5 after:bg-gray-900 before:absolute before:-top-1.5 before:left-0 before:w-5 before:h-0.5 before:bg-gray-900"></div>}
          </button>
        </div>

        <nav className="flex-1 py-4">
          <SidebarLink to="/academy/dashboard" icon={<LayoutDashboard size={20} />} label={isCollapsed ? "" : "Dashboard"} />
          <SidebarLink to="/academy/students" icon={<Users size={20} />} label={isCollapsed ? "" : "Students"} />
          <SidebarLink to="/academy/registration-link" icon={<UserPlus size={20} />} label={isCollapsed ? "" : "Registration Link"} />
          <SidebarLink to="/academy/reports" icon={<FileText size={20} />} label={isCollapsed ? "" : "Reports"} />
          <SidebarLink to="/academy/settings" icon={<Settings size={20} />} label={isCollapsed ? "" : "Settings"} />
        </nav>

        <div className="p-4 border-t border-gray-300 overflow-hidden">
          <div className={`flex items-center gap-3 px-2 py-2 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
            {academy?.logoUrl ? (
              <img src={academy.logoUrl} alt="Logo" className="w-8 h-8 bg-gray-200 border border-gray-300 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">M</div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate leading-tight">{academy?.name || 'Academy'}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                  {user?.email ? user.email.split('@')[0] : 'Admin'} / {user?.role || 'Instr/Admin'}
                </span>
                <span className="text-[9px] text-gray-400 font-medium mt-1">Version {SYSTEM_VERSION}</span>
              </div>
            )}
          </div>
          {isCollapsed && (
            <div className="flex flex-col items-center gap-1 mb-4 mt-2">
              <span className="text-[9px] text-gray-400 font-medium">{SYSTEM_VERSION}</span>
            </div>
          )}
          {localStorage.getItem('master_acting_as_academy_id') && (
            <button
              onClick={() => {
                localStorage.removeItem('master_acting_as_academy_id');
                window.location.href = '/#/master/dashboard';
              }}
              className={`flex items-center gap-3 px-4 py-2 w-full text-sm font-black text-amber-600 hover:bg-amber-100 transition-colors border border-amber-400 mb-2 uppercase tracking-tighter ${isCollapsed ? 'justify-center' : ''}`}
              title="Back to Master"
            >
              <Building2 size={18} />
              {!isCollapsed && <span>Back to Master</span>}
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem('master_acting_as_academy_id');
              supabase.auth.signOut();
            }}
            className={`flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent ${isCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
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
  const SYSTEM_VERSION = 'v1.0.9';
  const location = useLocation();
  const [academy, setAcademy] = useState<Academy | null>(null);

  useEffect(() => {
    const fetchAcademyForStudent = async () => {
      const studentId = localStorage.getItem('current_student_id');
      if (!studentId) return;
      try {
        const { data: student } = await supabase.from('students').select('academy_id').eq('id', studentId).single();
        if (student?.academy_id) {
          const { data: academyData } = await supabase.from('academies').select('*').eq('id', student.academy_id).single();
          if (academyData) setAcademy({
            id: academyData.id,
            name: academyData.name,
            address: academyData.address,
            contact: academyData.contact,
            logoUrl: academyData.logo_url,
            settings: { yellowFlagDays: academyData.yellow_flag_days, redFlagDays: academyData.red_flag_days }
          });
        }
      } catch (err) { console.error(err); }
    };
    fetchAcademyForStudent();
  }, []);

  const navItems = [
    { label: 'Home', path: '/student/dashboard', icon: <LayoutDashboard size={22} /> },
    { label: 'Card', path: '/student/card', icon: <CreditCard size={22} /> },
    { label: 'Profile', path: '/student/profile', icon: <User size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-mesh flex flex-col pb-24 md:pb-0">
      <PWAManager academy={academy} />
      {/* Translucent Header */}
      <header className="glass sticky top-0 z-[60] px-6 py-4 md:px-12 print:hidden backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-900 flex items-center justify-center text-white font-black rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">M</div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-lg leading-none italic uppercase text-gray-900">MATKEEP</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400">Student Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex gap-8 items-center h-full">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group py-2 
                  ${location.pathname === item.path ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto flex-1 w-full p-6 md:p-12 animate-in fade-in duration-1000">
        {children}
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass-dark rounded-[2rem] flex justify-around items-center px-4 z-[70] shadow-2xl border border-white/10 print:hidden overflow-hidden">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-16 h-16 transition-all duration-300
                ${isActive ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300 text-sm'}`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-glow" />
              )}
              <div className={`p-2 transition-all duration-300 relative z-10 ${isActive ? 'bg-primary rounded-xl rotate-0 shadow-lg' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 relative z-10 
                ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <footer className="hidden md:block p-12 max-w-4xl mx-auto w-full text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em] opacity-40">
        &copy; 2026 MATKEEP CORE • {SYSTEM_VERSION}
      </footer>
    </div>
  );
};

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
