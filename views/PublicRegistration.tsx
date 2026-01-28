
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Input, Button, Select } from '../components/UI';
import { Belt, Academy, UserStatus, FlagStatus } from '../types';
import { CheckCircle, Loader2, Camera as CameraIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { CameraCapture } from '../components/CameraCapture';
import { offlineService } from '../services/offline';
import { PWAManager } from '../components/PWAManager';
import { formatUSPhone } from '../utils';

const PublicRegistration: React.FC = () => {
  const { academyId: urlAcademyId } = useParams<{ academyId: string }>();

  const [view, setView] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });

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
  const [academyId, setAcademyId] = useState<string>('');
  const [academyName, setAcademyName] = useState<string>('');
  const [academy, setAcademy] = useState<Academy | null>(null);

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
    setError(null);
  };

  useEffect(() => {
    resetForm();
    const fetchAcademy = async () => {
      let query = supabase.from('academies').select('*');

      if (urlAcademyId) {
        query = query.eq('id', urlAcademyId);
      } else {
        query = query.limit(1);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        setAcademyId(data.id);
        setAcademyName(data.name);
        setAcademy({
          id: data.id,
          name: data.name,
          address: data.address,
          contact: data.contact,
          logoUrl: data.logo_url,
          settings: { yellowFlagDays: data.yellow_flag_days, redFlagDays: data.red_flag_days }
        });
      }
    };
    fetchAcademy();
  }, [urlAcademyId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password) // Note: user requested simple auth for now
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invalid email or password.');

      // Check if trying to login to a different academy via specific link (optional security, but good UX)
      if (urlAcademyId && data.academy_id !== urlAcademyId) {
        // Optionally warn, but for now we let them in to their own dashboard
        // console.warn('Logging into student account from different academy link');
      }

      localStorage.setItem('current_student_id', data.id);
      window.location.hash = '/student/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
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
      academy_id: academyId,
      photo_url: formData.photo
    };

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
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
          <p className="text-gray-500 text-sm">Your registration has been sent to <strong>{academyName}</strong>. You can now access the student portal.</p>
          <div className="flex flex-col w-full gap-2">
            <Button className="w-full" onClick={() => window.location.hash = '/student/dashboard'}>Access Student Portal</Button>
            <Button variant="secondary" className="w-full" onClick={resetForm}>Register Another Student</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <PWAManager academy={academy} />
      <Card className="max-w-xl w-full p-8">
        <div className="mb-8 text-center">
          {academy?.logoUrl ? (
            <img src={academy.logoUrl} alt="Logo" className="w-16 h-16 object-cover mx-auto mb-4 border border-gray-200" />
          ) : (
            <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">M</div>
          )}
          <h1 className="text-2xl font-black uppercase tracking-tight">STUDENT PORTAL</h1>
          <p className="text-gray-500 text-sm mt-1">{academyName}</p>
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
          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Enter Portal'}
            </Button>
          </form>
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
                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-4 text-lg flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'Finalize Registration'}
                </Button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                  By registering, you agree to the academy terms.
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
