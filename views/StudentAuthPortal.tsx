import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { checkRateLimit, recordAttempt, resetRateLimit, getAttemptCount } from '../services/rateLimitService';
import { formatPhoneToE164, normalizeFullName } from '../utils';
import { Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { PWAManager } from '../components/PWAManager';
import { Academy, Belt } from '../types';

type AuthMode = 'login' | 'register';
type PasswordStrength = 'weak' | 'medium' | 'strong';

const StudentAuthPortal: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { academyId } = useParams();

  // LOGIN FORM
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // REGISTER FORM
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerBirthDate, setRegisterBirthDate] = useState('');
  const [registerBelt, setRegisterBelt] = useState<string>(Belt.BRANCA);
  const [registerDegrees, setRegisterDegrees] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  // Fetch academy on mount
  React.useEffect(() => {
    const fetchAcademy = async () => {
      if (!academyId) return;
      try {
        // Try lookup by id first (UUID). If not found, try by slug (friendly id).
        let academyData: any = null;

        const byId = await supabase
          .from('academies')
          .select('*')
          .eq('id', academyId)
          .maybeSingle();

        if (byId.error) throw byId.error;
        academyData = byId.data;

        if (!academyData) {
          const bySlug = await supabase
            .from('academies')
            .select('*')
            .eq('slug', academyId)
            .maybeSingle();
          if (bySlug.error) throw bySlug.error;
          academyData = bySlug.data;
        }

        if (!academyData) {
          setError('Academy not found. Please check your link.');
          return;
        }

        // Normalize DB fields (snake_case) into our `Academy` type (camelCase)
        const normalized: Academy = {
          id: academyData.id,
          name: academyData.name,
          logoUrl: academyData.logo_url || undefined,
          slug: academyData.slug,
          address: academyData.address || '',
          contact: academyData.contact || '',
          subscription_plan: academyData.subscription_plan,
          trial_start_date: academyData.trial_start_date,
          trial_end_date: academyData.trial_end_date,
          settings: {
            yellowFlagDays: academyData.yellow_flag_days || 7,
            redFlagDays: academyData.red_flag_days || 14
          }
        } as Academy;

        setAcademy(normalized);
      } catch (err) {
        console.error('Academy not found:', err);
        setError('Academy not found. Please check your link.');
      }
    };

    fetchAcademy();
  }, [academyId]);

  // PASSWORD STRENGTH CHECKER
  const checkPasswordStrength = (password: string): PasswordStrength => {
    if (password.length < 6) return 'weak';
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);

    if (hasSpecial && hasNumbers && hasUpper) return 'strong';
    if ((hasSpecial || hasNumbers || hasUpper) && password.length >= 6) return 'medium';
    return 'weak';
  };

  const handlePasswordChange = (password: string) => {
    setRegisterPassword(password);
    setPasswordStrength(checkPasswordStrength(password));
  };

  // HANDLE LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Check rate limit
      const { isLimited, remainingTime } = checkRateLimit(loginEmail);
      if (isLimited) {
        setError(`Too many attempts. Please wait ${remainingTime} seconds.`);
        setLoading(false);
        return;
      }

      // Verify credentials against students table
      const { data: student } = await supabase
        .from('students')
        .select('id, password, session_key, academy_id, must_change_password, internal_id, card_pass_code')
        .eq('email', loginEmail.trim())
        .maybeSingle();

      if (!student) {
        setError('Email not found. Check if you are registered.');
        setLoading(false);
        return;
      }

      // Check if archived
      const { data: archivedCheck } = await supabase
        .from('students')
        .select('archived_at')
        .eq('id', student.id)
        .maybeSingle();

      if (archivedCheck?.archived_at) {
        setError('This account has been archived. Please contact your academy admin.');
        setLoading(false);
        return;
      }

      // Verify password (plain text for MVP - should hash in production)
      if (student.password !== loginPassword) {
        recordAttempt(loginEmail);
        const attempts = getAttemptCount(loginEmail);
        const remaining = 3 - attempts;
        setError(`Invalid email or password. ${remaining > 0 ? `${remaining} attempts remaining.` : ''}`);
        setLoading(false);
        return;
      }

      // Success - reset rate limit
      resetRateLimit(loginEmail);

      // Check if password needs change
      if (student.must_change_password) {
        localStorage.setItem('matkeep_student_must_change_password', 'true');
      }

      // Store session
      localStorage.setItem('matkeep_student_id', student.id);
      localStorage.setItem('matkeep_student_session_key', student.session_key || '');
      localStorage.setItem('matkeep_student_email', loginEmail.trim());
      localStorage.setItem('matkeep_academy_id', student.academy_id);

      // Redirect to student portal
      navigate(`/student/portal/${student.academy_id}`);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // HANDLE REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPhone || !registerPassword || !registerBirthDate) {
      setError('Please fill all fields.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength === 'weak') {
      setError('Password must be at least 6 characters with 1 special character.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const email = registerEmail.trim();

      // Check rate limit
      const { isLimited, remainingTime } = checkRateLimit(`register_${email}`);
      if (isLimited) {
        setError(`Too many registration attempts. Please wait ${remainingTime} seconds.`);
        setLoading(false);
        return;
      }

      // Format phone to E.164
      const phoneE164 = formatPhoneToE164(registerPhone);

      // Normalize name
      const nameNormalized = normalizeFullName(registerName);

      // Check if student already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('academy_id', academy?.id || academyId || '')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        setError('This email is already registered in this academy.');
        recordAttempt(`register_${email}`);
        setLoading(false);
        return;
      }

      // Insert new student
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          academy_id: academy?.id || academyId,
          email,
          name: registerName,
          phone: registerPhone,
          phone_e164: phoneE164,
          full_name_normalized: nameNormalized,
          password: registerPassword,
          status: 'Active',
          belt_level: registerBelt,
          degrees: registerDegrees,
          birth_date: registerBirthDate,
          must_change_password: false,
          flag: 'GREEN',
          card_pass_code: 'MK-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          created_at: new Date().toISOString()
        })
        .select('id, session_key, internal_id, card_pass_code')
        .single();

      if (insertError) {
        console.error('Registration error:', insertError);
        if (insertError.message.includes('unique') || insertError.message.includes('students_email_key')) {
          setError('This email is already registered as a student in another academy.');
        } else if (insertError.message.includes('belongs to an Academy Owner')) {
          setError('This email is linked to an Academy Owner profile and cannot be used by a student.');
        } else {
          setError(`Registration failed: ${insertError.message || 'Unknown error'}`);
        }
        recordAttempt(`register_${email}`);
        setLoading(false);
        return;
      }

      // Success
      resetRateLimit(`register_${email}`);

      // Auto-login
      localStorage.setItem('matkeep_student_id', newStudent.id);
      localStorage.setItem('matkeep_student_session_key', newStudent.session_key || '');
      localStorage.setItem('matkeep_student_email', email);
      localStorage.setItem('matkeep_academy_id', academy?.id || academyId || '');

      // Redirect to student portal
      navigate(`/student/portal/${academy?.id || academyId}`);
    } catch (err: any) {
      console.error('Register error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <PWAManager academy={academy} />

      <div className="w-full max-w-md">
        {/* ACADEMY HEADER */}
        {academy && (
          <div className="text-center mb-8">
            {academy.logoUrl && (
              <img
                src={academy.logoUrl}
                alt={academy.name}
                className="h-16 w-16 mx-auto mb-4 rounded-lg"
              />
            )}
            <h1 className="text-3xl font-bold text-white mb-1">STUDENT PORTAL</h1>
            <p className="text-slate-300">{academy.name}</p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-slate-700/50 p-1 rounded-lg">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${mode === 'login'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${mode === 'register'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            REGISTER
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                EMAIL OR PHONE
              </label>
              <input
                type="text"
                placeholder="your@email.com or +55 11 99999999"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : null}
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                FULL NAME
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                EMAIL
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                PHONE
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  DATE OF BIRTH
                </label>
                <input
                  type="date"
                  value={registerBirthDate}
                  onChange={(e) => setRegisterBirthDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  CURRENT RANK
                </label>
                <select
                  value={registerBelt}
                  onChange={(e) => setRegisterBelt(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:border-blue-500 focus:outline-none transition"
                >
                  {Object.entries(Belt).map(([key, value]) => (
                    <option key={key} value={value} className="bg-slate-800">{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                DEGREES ({registerDegrees})
              </label>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={registerDegrees}
                onChange={(e) => setRegisterDegrees(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mt-1">
                <span>0 Degrees</span>
                <span>4 Degrees</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 chars + 1 special char"
                  value={registerPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* PASSWORD STRENGTH */}
              <div className="mt-2 flex gap-1">
                {['weak', 'medium', 'strong'].map((strength) => (
                  <div
                    key={strength}
                    className={`flex-1 h-1 rounded-full transition ${(strength === 'weak' && (passwordStrength === 'weak' || passwordStrength === 'medium' || passwordStrength === 'strong')) ||
                      (strength === 'medium' && (passwordStrength === 'medium' || passwordStrength === 'strong')) ||
                      (strength === 'strong' && passwordStrength === 'strong')
                      ? passwordStrength === 'weak'
                        ? 'bg-red-500'
                        : passwordStrength === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      : 'bg-slate-600'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : null}
              {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentAuthPortal;
