

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { ChevronRight, User, GraduationCap, CreditCard, Activity, Loader2, Building2, LogOut, Moon, Sun, X, Menu } from 'lucide-react';
import { DashboardIcon, StudentsIcon, StudentRegistrationIcon, CalendarIcon, CheckInIcon, ReportsIcon, SettingsIcon } from './components/CustomIcons';

import AcademyDashboard from './views/AcademyDashboard';
import StudentManagement from './views/StudentManagement';
import AcademySettings from './views/AcademySettings';
import AcademyReports from './views/AcademyReports';
import AcademyRegistrationLink from './views/AcademyRegistrationLink';
import StudentPortal from './views/StudentPortal';
import StudentAuthPortal from './views/StudentAuthPortal';
import Login from './views/Login';
import AcademyWizard from './views/AcademyWizard';
import { MasterLayout } from './views/Master/MasterLayout';
import MasterDashboard from './views/Master/MasterDashboard';
import MasterAcademyList from './views/Master/MasterAcademyList';
import MasterAcademyRegistration from './views/Master/MasterAcademyRegistration';
import PrivacyPolicy from './views/PrivacyPolicy';
import TermsOfUse from './views/TermsOfUse';
import ForgotPassword from './views/ForgotPassword';
import StudentCheckIn from './views/StudentCheckIn';
import AcademyCalendar from './views/AcademyCalendar';
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
      className={`flex items-center ${label ? 'gap-3' : 'justify-center'} px-4 py-2.5 text-sm font-normal border-l-3 transition-all duration-200 ${isActive
        ? 'bg-[var(--bg-secondary)] border-[var(--text-primary)] text-[var(--text-primary)] font-medium'
        : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
        }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </Link>
  );
};

// Redirect handler for unprotected routes when logged in
const AuthRedirect: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (session) {
    // If it's a master admin, don't auto-redirect to academy dashboard 
    // because they might be testing public links.
    const isMaster = session.user?.user_metadata?.role === 'master' || session.user?.app_metadata?.role === 'master';
    if (isMaster) {
      return <>{children}</>;
    }
    return <Navigate to="/academy/dashboard" replace />;
  }
  return <>{children}</>;
};

// Guard for protected routes
const RequireAuth: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireMasterAuth: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  // NEW: Check for master role via JWT claim instead of hardcoded email
  const isMaster = session.user?.user_metadata?.role === 'master' || session.user?.app_metadata?.role === 'master';
  if (!isMaster) {
    return <Navigate to="/academy/dashboard" replace />;
  }
  return <>{children}</>;
};

import { AcademyProvider, useAcademy } from './contexts/AcademyContext';

const AcademyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { academy, loading } = useAcademy();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Auto-hide state
  const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('theme') as 'light' | 'dark' || 'light');
  const SYSTEM_VERSION = 'v1.0.13';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ email: session.user.email, role: 'Instructor / Administrator' });
      }
    };
    fetchUser();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] print:block">
      <PWAManager academy={academy} />

      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsHidden(!isHidden)}
        onMouseEnter={() => setIsHidden(false)}
        className={`fixed top-4 ${isHidden ? 'left-4' : isCollapsed ? 'left-24' : 'left-[272px]'} z-50 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 print:hidden hover:scale-110 active:scale-95`}
        title={isHidden ? "Show Menu" : "Hide Menu"}
      >
        <div className={`w-5 h-0.5 bg-[var(--text-primary)] relative transition-all duration-300 ${!isHidden ? 'rotate-45 translate-y-1.5' : ''} after:absolute after:top-1.5 after:left-0 after:w-5 after:h-0.5 after:bg-[var(--text-primary)] ${!isHidden ? 'after:opacity-0' : ''} before:absolute before:-top-1.5 before:left-0 before:w-5 before:h-0.5 before:bg-[var(--text-primary)] ${!isHidden ? 'before:-rotate-90 before:translate-y-1.5' : ''} transition-all duration-300`}></div>
      </button>

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHidden(false)}
        onMouseLeave={() => setIsHidden(true)}
        className={`${isCollapsed ? 'w-20' : 'w-64'} ${isHidden ? '-translate-x-full' : 'translate-x-0'} border-r border-[var(--border-color)] flex flex-col h-screen fixed top-0 left-0 bg-[var(--bg-card)] z-40 transition-all duration-300 print:hidden shadow-[var(--shadow-md)]`}
      >
        <div className={`p-6 border-b border-[var(--border-color)] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">MK</span>
              <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">MATKEEP</span>
            </div>
          )}
          {isCollapsed && (
            <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">MK</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronRight size={18} className="rotate-180" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          <SidebarLink to="/academy/dashboard" icon={<DashboardIcon size={20} />} label={isCollapsed ? "" : "Dashboard"} />
          <SidebarLink to="/academy/students" icon={<StudentsIcon size={20} />} label={isCollapsed ? "" : "Students"} />
          <SidebarLink to="/academy/registration-link" icon={<StudentRegistrationIcon size={20} />} label={isCollapsed ? "" : "Student Registration"} />
          <SidebarLink to="/academy/calendar" icon={<CalendarIcon size={20} />} label={isCollapsed ? "" : "Academy Calendar"} />
          <SidebarLink to="/check-in" icon={<CheckInIcon size={20} />} label={isCollapsed ? "" : "Check-In Kiosk"} />
          <SidebarLink to="/academy/reports" icon={<ReportsIcon size={20} />} label={isCollapsed ? "" : "Reports"} />
          <SidebarLink to="/academy/settings" icon={<SettingsIcon size={20} />} label={isCollapsed ? "" : "Settings"} />
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] overflow-hidden space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-3 px-4 py-2 w-full text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all rounded-md ${isCollapsed ? 'justify-center' : ''}`}
            title={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
          >
            {theme === 'light' ? <Moon size={18} className="text-indigo-500" /> : <Sun size={18} className="text-amber-400" />}
            {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <div className={`flex items-center gap-3 px-2 py-2 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
            {academy?.logoUrl ? (
              <img src={academy.logoUrl} alt="Logo" className="w-8 h-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] object-cover shrink-0 shadow-sm" />
            ) : (
              <div className="w-8 h-8 bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px] font-black shrink-0">M</div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate leading-tight">{academy?.name || 'Academy'}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                  {user?.email === 'jader_dourado@hotmail.com' ? (
                    <span className="text-amber-600 font-black">MASTER ADMIN ACCESS</span>
                  ) : (
                    `${user?.email ? user.email.split('@')[0] : 'Admin'} / ${user?.role || 'Instr/Admin'}`
                  )}
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
                window.dispatchEvent(new CustomEvent('academy_updated'));
                window.location.href = '/#/master/dashboard';
              }}
              className={`flex items-center gap-3 px-4 py-2 w-full text-[10px] font-black text-amber-500 hover:bg-amber-500/10 transition-all border border-amber-500/30 mb-2 uppercase tracking-widest rounded-md ${isCollapsed ? 'justify-center' : ''}`}
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
            className={`flex items-center gap-3 px-4 py-2 w-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all rounded-md ${isCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block bg-[var(--bg-primary)]">

        <TrialBanner academy={academy} />
        <div className="p-8 flex-1 overflow-y-auto print:p-0 print:overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const SYSTEM_VERSION = 'v1.0.13';
  const location = useLocation();
  const { academyId } = useParams();
  const [academy, setAcademy] = useState<Academy | null>(null);

  useEffect(() => {
    const fetchAcademyForStudent = async () => {
      const studentId = localStorage.getItem('matkeep_student_id');
      const sessionKey = localStorage.getItem('matkeep_student_session_key');
      if (!studentId) return;

      try {
        // Validate UUID format to avoid 400 errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(studentId)) {
          console.error("Invalid Student UUID format");
          localStorage.removeItem('matkeep_student_id');
          localStorage.removeItem('matkeep_student_session_key');
          localStorage.removeItem('matkeep_student_email');
          window.location.hash = '#/';
          return;
        }

        // Use secure RPC
        const { data, error } = await supabase
          .rpc('get_student_profile', {
            p_student_id: studentId,
            p_session_key: sessionKey || ''
          })
          .maybeSingle();

        if (error) throw error;
        const student = data as any;

        if (student) {
          setAcademy({
            id: student.academy_id,
            name: student.academy_name,
            address: student.academy_address,
            contact: student.academy_contact,
            logoUrl: student.academy_logo,
            settings: {
              yellowFlagDays: student.yellow_flag_days || 7,
              redFlagDays: student.red_flag_days || 14
            }
          });
        } else {
          // If profile not found via RPC, it might be due to a session mismatch or temporary issue.
          console.warn("Student profile not found or session invalid.");
          const mustChange = localStorage.getItem('matkeep_student_must_change_password') === 'true';

          if (!mustChange) {
            // Clear invalid session to avoid endless 400s or mismatched state
            localStorage.removeItem('matkeep_student_id');
            localStorage.removeItem('matkeep_student_session_key');
            window.location.hash = '#/';
          }
        }
      } catch (err) {
        console.error("Layout Fetch Error:", err);
      }
    };
    fetchAcademyForStudent();
  }, [location.pathname]); // Run on path changes too to ensure sync

  const navItems = [
    { label: 'Home', path: `/student/portal/${academyId}/dashboard`, icon: <DashboardIcon size={22} /> },
    { label: 'Card', path: `/student/portal/${academyId}/card`, icon: <CreditCard size={22} /> },
    { label: 'Profile', path: `/student/portal/${academyId}/profile`, icon: <User size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-mesh flex flex-col pb-24 md:pb-0">
      <PWAManager academy={null} />
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
    // Validar User Agent para segurança (Session Binding)
    const validateUserAgent = async (currentSession: any) => {
      if (!currentSession?.user) return;

      const currentUA = navigator.userAgent;
      const storedUA = currentSession.user.user_metadata?.user_agent;

      if (!storedUA) {
        // Primeiro acesso ou legado: registrar UA
        console.log('Security: Binding session to browser...');
        await supabase.auth.updateUser({
          data: { user_agent: currentUA }
        });
      } else if (storedUA !== currentUA) {
        // Mismatch detectado
        console.warn('Security Alert: Browser mismatch detected.');
        alert("⚠️ SECURITY ALERT\n\nSystem detected a change in your browser environment.\nFor your security, please update your session by logging in again.");
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    };

    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) validateUserAgent(session);
    }).catch(() => setLoading(false));

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        validateUserAgent(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;

  return (
    <AcademyProvider>
      <HashRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<AuthRedirect session={session}><Login /></AuthRedirect>} />
          <Route path="/forgot-password" element={<AuthRedirect session={session}><ForgotPassword /></AuthRedirect>} />
          <Route path="/check-in" element={<RequireAuth session={session}><StudentCheckIn /></RequireAuth>} />
          <Route path="/register-academy" element={<AcademyWizard />} />

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
          <Route path="/academy/calendar" element={<RequireAuth session={session}><AcademyLayout><AcademyCalendar /></AcademyLayout></RequireAuth>} />
          <Route path="/academy/reports" element={<RequireAuth session={session}><AcademyLayout><AcademyReports /></AcademyLayout></RequireAuth>} />
          <Route path="/academy/settings" element={<RequireAuth session={session}><AcademyLayout><AcademySettings /></AcademyLayout></RequireAuth>} />

          {/* Student Portal - Unified Auth (Login + Register in one screen) */}
          {/* Both routes work: /student/auth/:academyId and legacy /public/register/:academyId */}
          <Route path="/student/auth/:academyId" element={<StudentAuthPortal />} />
          <Route path="/public/register/:academyId" element={<StudentAuthPortal />} />
          <Route path="/student/portal/:academyId/*" element={<StudentLayout><StudentPortal /></StudentLayout>} />
          <Route path="/student/portal/*" element={<StudentLayout><StudentPortal /></StudentLayout>} />
          <Route path="/student/*" element={<Navigate to="/" replace />} />

          {/* Legal Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />

          {/* Default Redirect */}
          <Route path="/" element={
            localStorage.getItem('matkeep_student_id')
              ? <Navigate to={`/student/portal/${localStorage.getItem('matkeep_academy_id')}`} replace />
              : session
                ? (session.user.email === 'jader_dourado@hotmail.com' ? <Navigate to="/master/dashboard" replace /> : <Navigate to="/academy/dashboard" replace />)
                : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AcademyProvider>
  );
};

export default App;
