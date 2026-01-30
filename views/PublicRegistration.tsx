
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Input, Button, Select, Checkbox } from '../components/UI';
import { Belt, Academy, UserStatus, FlagStatus } from '../types';
import { CheckCircle, Loader2, Camera as CameraIcon, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { CameraCapture } from '../components/CameraCapture';
import { offlineService } from '../services/offline';
import { PWAManager } from '../components/PWAManager';
import { formatUSPhone } from '../utils';

const PublicRegistration: React.FC = () => {
  const { academyId: urlAcademyId } = useParams<{ academyId: string }>();

  const [view, setView] = useState<'login' | 'register'>('register');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);

  // ... existing state ...
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    belt: Belt.BRANCA,
    degrees: 0,
    password: '',
    confirmPassword: '',
    photo: null as string | null
  });
  const [showCamera, setShowCamera] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [academyLoading, setAcademyLoading] = useState(true);
  const [academyNotFound, setAcademyNotFound] = useState(false);

  const [loginStep, setLoginStep] = useState<'identify' | 'select_academy' | 'password'>('identify');
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const passwordValidation = React.useMemo(() => {
    const pass = formData.password;
    return {
      length: pass.length >= 6,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      match: pass === formData.confirmPassword && pass !== ''
    };
  }, [formData.password, formData.confirmPassword]);

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      belt: Belt.BRANCA,
      degrees: 0,
      password: '',
      confirmPassword: '',
      photo: null
    });
    setLoginData({ identifier: '', password: '' });
    setRememberMe(false);
    setSaveCredentials(false);
    setError(null);
  };

  useEffect(() => {
    resetForm();
    // Forced secondary clear to fight aggressive browser autofill
    setTimeout(() => {
      setLoginData({ identifier: '', password: '' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    }, 100);

    const fetchAcademy = async () => {
      if (!urlAcademyId) {
        setAcademyLoading(false);
        setAcademyNotFound(true);
        return;
      }

      setAcademyLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('academies')
          .select('*')
          .or(`id.eq.${urlAcademyId},slug.eq.${urlAcademyId}`)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setAcademy({
            id: data.id,
            name: data.name,
            address: data.address,
            contact: data.contact,
            logoUrl: data.logo_url,
            settings: { yellowFlagDays: data.yellow_flag_days, redFlagDays: data.red_flag_days }
          });
          setAcademyNotFound(false);
        } else {
          setAcademyNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching academy:', err);
        setAcademyNotFound(true);
      } finally {
        setAcademyLoading(false);
      }
    };
    fetchAcademy();
  }, [urlAcademyId]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanIdentifier = loginData.identifier.trim();
      let query = supabase.from('students').select('*');

      if (cleanIdentifier.includes('@')) {
        query = query.ilike('email', cleanIdentifier);
      } else {
        query = query.or(`card_pass_code.ilike.${cleanIdentifier},internal_id.ilike.${cleanIdentifier}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!data || data.length === 0) throw new Error('Invalid credentials. Check your email or access code.');

      // Buscar detalhes das academias
      const academyIds = data.map((s: any) => s.academy_id).filter(Boolean);
      const { data: academies } = await supabase
        .from('academies')
        .select('id, name, logo_url, address')
        .in('id', academyIds);

      const enrichedStudents = data.map((student: any) => {
        const academy = academies?.find(a => a.id === student.academy_id);
        return {
          ...student,
          academy_name: academy?.name || 'Academy',
          academy_logo: academy?.logo_url,
          academy_address: academy?.address
        };
      });

      setMatchingStudents(enrichedStudents);

      if (enrichedStudents.length === 1) {
        setSelectedStudent(enrichedStudents[0]);
        setLoginStep('password');
      } else {
        setLoginStep('select_academy');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !loginData.password) return;

    setLoading(true);
    setError(null);

    try {
      if (selectedStudent.password !== loginData.password) {
        throw new Error('Invalid password. Please try again.');
      }

      // Handle Remember Me / Save Credentials
      if (rememberMe || saveCredentials) {
        localStorage.setItem('student_remember_email', loginData.identifier);
      } else {
        localStorage.removeItem('student_remember_email');
      }

      if (saveCredentials) {
        localStorage.setItem('student_save_pass', loginData.password);
      } else {
        localStorage.removeItem('student_save_pass');
      }

      localStorage.setItem('current_student_id', selectedStudent.id);
      localStorage.setItem('student_session_key', btoa(selectedStudent.password || '').substring(0, 10));
      window.location.hash = '/student/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetLoginFlow = () => {
    setLoginStep('identify');
    setSelectedStudent(null);
    setLoginData({ ...loginData, password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const studentData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      birth_date: formData.birthDate,
      belt: formData.belt,
      degrees: formData.degrees,
      password: formData.password,
      status: UserStatus.ATIVO,
      flag: FlagStatus.VERDE,
      card_pass_code: 'MK-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      academy_id: academy?.id,
      photo_url: formData.photo
    };

    try {
      if (!passwordValidation.length || !passwordValidation.special) {
        throw new Error('Password does not meet requirements');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Check for existing student with same email in this academy
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('email', formData.email)
        .eq('academy_id', academy?.id) // Optional: restrict to same academy or globally? Usually email should be unique globally or per academy. Let's assume per academy for now or just warn.
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingStudent) {
        throw new Error('A student with this email already exists. Please login instead.');
      }

      if (!navigator.onLine) {
        await offlineService.saveAction('students', studentData);
        setStep(2);
        return;
      }

      const { data, error: sbError } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();

      if (sbError) throw sbError;

      localStorage.setItem('current_student_id', data.id);
      localStorage.setItem('student_session_key', btoa(data.password || '').substring(0, 10));
      setStep(2);
    } catch (err: any) {
      if (!navigator.onLine) {
        await offlineService.saveAction('students', studentData);
        setStep(2);
      } else {
        setError(err.message || 'Error registering');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <PWAManager academy={academy} />
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
          <CheckCircle size={64} className="text-green-500" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Registration Complete!</h2>
          <p className="text-gray-500 text-sm">Your registration has been sent to <strong>{academy?.name}</strong>. You can now access the student portal.</p>
          <div className="flex flex-col w-full gap-2">
            <Button className="w-full" onClick={() => window.location.hash = '/student/dashboard'}>Access Student Portal</Button>
            <Button variant="secondary" className="w-full" onClick={resetForm}>Register Another Student</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (academyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (academyNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Academy Not Found</h1>
            <p className="text-gray-500 text-sm">The registration link you used is invalid or outdated. Please request a new link or scan the QR code at your academy.</p>
          </div>
          <Button className="w-full" onClick={() => window.location.hash = '/login'}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <PWAManager academy={academy || undefined} />
      <Card className="max-w-xl w-full p-8">
        <div className="mb-8 text-center">
          {selectedStudent?.academy_logo && loginStep === 'password' ? (
            <img src={selectedStudent.academy_logo} alt="Logo" className="w-16 h-16 object-cover mx-auto mb-4 border border-gray-200" />
          ) : academy?.logoUrl ? (
            <img src={academy.logoUrl} alt="Logo" className="w-16 h-16 object-cover mx-auto mb-4 border border-gray-200" />
          ) : (
            <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">M</div>
          )}
          <h1 className="text-2xl font-black uppercase tracking-tight">STUDENT PORTAL</h1>
          <p className="text-gray-500 text-sm mt-1">
            {selectedStudent && loginStep === 'password' ? selectedStudent.academy_name : academy?.name}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${view === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setView('login')}
          >
            I AM ALREADY A STUDENT
          </button>
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${view === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setView('register')}
          >
            I WANT TO REGISTER
          </button>
        </div>

        {view === 'login' ? (
          loginStep === 'identify' ? (
            <form onSubmit={handleIdentify} className="space-y-6" autoComplete="off">
              <Input
                label="Email or Access Code"
                placeholder="Enter email or student ID..."
                value={loginData.identifier}
                onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                required
                autoComplete="off"
                name="student_auth_identifier"
              />
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Next'}
              </Button>
            </form>
          ) : loginStep === 'select_academy' ? (
            <div className="space-y-4 animate-in zoom-in duration-500">
              <div className="text-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Select Academy</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Choose which location to access</p>
              </div>

              <div className="space-y-3">
                {matchingStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setLoginStep('password');
                    }}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-gray-900 bg-gray-50 hover:bg-white transition-all text-left flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {student.academy_logo ? (
                        <img src={student.academy_logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">M</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate uppercase">{student.academy_name}</p>
                      {student.academy_address && (
                        <p className="text-[8px] font-bold text-gray-400 uppercase truncate mt-0.5">{student.academy_address}</p>
                      )}
                    </div>
                  </button>
                ))}
                <button
                  onClick={resetLoginFlow}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Back to Identication
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFinalLogin} className="space-y-6" autoComplete="off">
              <div className="text-center mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Logging into {selectedStudent?.academy_name}
                </p>
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="Your password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                autoComplete="new-password"
                name="student_auth_password"
              />
              <div className="flex flex-col gap-3">
                <Checkbox
                  id="student-remember"
                  label="Remember Me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <Checkbox
                  id="student-save"
                  label="Save Credentials"
                  checked={saveCredentials}
                  onChange={(e) => setSaveCredentials(e.target.checked)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full py-3" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Enter Portal'}
                </Button>
                <button
                  type="button"
                  onClick={resetLoginFlow}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Change Account
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center">
              <div
                className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                onClick={() => setShowCamera(true)}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Foto Aluno" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <CameraIcon size={32} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Add Photo</span>
                  </>
                )}
                {formData.photo && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase">
                    Change Photo
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    placeholder="Ex: John Doe"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="new-password"
                />
                <Input
                  label="Phone / WhatsApp"
                  placeholder="(000) 000-0000"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: formatUSPhone(e.target.value) })}
                  autoComplete="new-password"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Belt" options={Object.values(Belt).map(b => ({ value: b, label: b }))} value={formData.belt} onChange={e => setFormData({ ...formData, belt: e.target.value as Belt })} />
                  <Select label="Degrees" options={[0, 1, 2, 3, 4].map(g => ({ value: String(g), label: String(g) }))} value={String(formData.degrees)} onChange={e => setFormData({ ...formData, degrees: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    name="student_reg_password"
                  />
                  {/* Password Conditions */}
                  <div className="grid grid-cols-2 gap-2 px-2">
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${passwordValidation.length ? 'text-green-500' : 'text-red-400'}`}>
                      {passwordValidation.length ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
                      Min 6 Chars
                    </div>
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${passwordValidation.special ? 'text-green-500' : 'text-red-400'}`}>
                      {passwordValidation.special ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
                      1 Special Char
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Input
                    label="Confirm Password"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    name="student_reg_confirm_password"
                  />
                  {formData.confirmPassword !== '' && !passwordValidation.match && (
                    <div className="flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest text-red-500 animate-pulse">
                      <AlertCircle size={12} strokeWidth={4} />
                      Passwords do not match
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-4 text-lg flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'Finalize Registration'}
                </Button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest leading-loose">
                  By registering, you agree to our <Link to="/terms-of-use" className="underline hover:text-gray-600">terms of use</Link> and <Link to="/privacy-policy" className="underline hover:text-gray-600">privacy policy</Link>.
                </p>
              </div>
            </form>

            {showCamera && (
              <CameraCapture
                onCapture={(img) => setFormData({ ...formData, photo: img })}
                onClose={() => setShowCamera(false)}
                initialImage={formData.photo}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PublicRegistration;
