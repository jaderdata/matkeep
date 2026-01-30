
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Card, Badge, Button } from '../components/UI';
import { Download, User, Loader2, ChevronRight, Flame, GraduationCap, LogOut, LayoutDashboard, CreditCard, Activity, Calendar, Camera, Check, X, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { supabase } from '../services/supabase';
import { CameraCapture } from '../components/CameraCapture';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import { ResponsiveContainer } from 'recharts';
import { PWAManager } from '../components/PWAManager';
import { Academy } from '../types';
import { formatUSPhone } from '../utils';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl border border-gray-800 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{data.fullDate}</p>
        <p className="text-sm font-black flex items-center gap-2">
          {data.count} {data.count === 1 ? 'Class' : 'Classes'}
        </p>
      </div>
    );
  }
  return null;
};

const StudentDashboard = () => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const stats = React.useMemo(() => {
    const totalClasses = attendance.length;
    const level = Math.floor(totalClasses / 10) + 1;
    const xp = (totalClasses % 10) * 10;
    const classesThisMonth = attendance.filter(a => {
      const diff = (new Date().getTime() - new Date(a.timestamp).getTime()) / (1000 * 3600 * 24);
      return diff <= 30;
    }).length;

    // Belt progress (simple logic for now: 100 classes per belt/degree)
    const beltProgress = Math.min(((totalClasses % 100) / 100) * 100, 100);

    return { level, xp, totalClasses, classesThisMonth, beltProgress };
  }, [attendance]);

  const streakStats = React.useMemo(() => {
    if (!attendance || attendance.length === 0) return { count: 0, active: false };
    try {
      const uniqueDates = Array.from(new Set(attendance.map((a: any) => a.timestamp?.split('T')[0])))
        .filter(Boolean)
        .sort((a: string, b: string) => b.localeCompare(a));

      if (uniqueDates.length === 0) return { count: 0, active: false };

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastTrainingDate = uniqueDates[0];

      if (lastTrainingDate !== today && lastTrainingDate !== yesterday) return { count: 0, active: false };

      let count = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i] + 'T00:00:00');
        const next = new Date(uniqueDates[i + 1] + 'T00:00:00');
        const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) count++; else break;
      }
      return { count, active: true };
    } catch (e) {
      console.error("Streak calculation error:", e);
      return { count: 0, active: false };
    }
  }, [attendance]);

  const chartData = React.useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = attendance.filter(a => a.timestamp.split('T')[0] === dateStr).length;
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: count,
        isToday: i === 0
      });
    }
    return days;
  }, [attendance]);

  React.useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(data);
      const { data: attendanceData } = await supabase.from('attendance').select('*').eq('student_id', id).order('timestamp', { ascending: false });
      setAttendance(attendanceData || []);
    } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-20 min-h-[60vh]"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  if (!student) {
    // Redirect to login if no student is found
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Level & XP Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 text-white shadow-2xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary opacity-20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-pink-600 opacity-10 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Warwick Path</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-1">
              Level {stats.level}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Master Apprentice</p>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>XP Progress</span>
                <span className="text-primary">{stats.xp}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000"
                  style={{ width: `${stats.xp}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 animate-glow rounded-full bg-primary/20 blur-xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-gray-800 p-1 shadow-2xl">
              {student.photo_url ? (
                <img
                  src={student.photo_url.startsWith('data:') ? student.photo_url : `${student.photo_url}${student.photo_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ''; // Clear broken src
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-gray-500"><User size={40} /></div>';
                  }}
                />
              ) : (
                <User size={40} className="text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-dark flex flex-col items-center justify-center rounded-3xl p-6 shadow-sm">
          <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Classes</span>
          <span className="text-3xl font-black text-white">{stats.totalClasses}</span>
        </div>
        <div className="glass items-center justify-center rounded-3xl p-6 border-none bg-white text-gray-900 shadow-xl flex flex-col">
          <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">Consistency</span>
          <div className="flex items-center gap-2">
            <Flame size={24} className={streakStats.active ? "text-orange-500 animate-bounce" : "text-gray-300 opacity-50"} />
            <span className="text-3xl font-black text-gray-900">{streakStats.count}D</span>
          </div>
        </div>
      </div>

      {/* Main Action: Digital Pass */}
      <Link
        to="/student/card"
        className="group relative h-20 w-full overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all active:scale-95 flex items-center"
      >
        <div className="absolute inset-y-0 left-0 w-2 bg-gray-900 group-hover:w-full transition-all duration-500 opacity-10" />
        <div className="flex h-full items-center px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <CreditCard size={24} />
          </div>
          <div className="ml-4 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Quick Access</p>
            <p className="text-sm font-black uppercase tracking-tight text-gray-900">Open Digital Pass</p>
          </div>
          <ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-gray-900 transition-colors" />
        </div>
      </Link>

      {/* Training Intensity Section */}
      <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Training Frequency</h3>
            <p className="text-lg font-black text-gray-900">Last 7 Days</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
            <Activity size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-blue-600">Active</span>
          </div>
        </div>

        <div className="flex justify-between items-end h-32 gap-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative group">
                <div
                  className={`w-full rounded-xl transition-all duration-1000 ${d.count > 0 ? 'bg-primary shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'bg-gray-100'}`}
                  style={{ height: `${Math.max(d.count * 30, 20)}px` }}
                >
                  {d.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                      {d.count}
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase ${d.isToday ? 'text-primary' : 'text-gray-400'}`}>
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Milestone Section */}
      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1 ml-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Rank Progress</p>
            <p className="text-sm font-black uppercase text-gray-900">Next Degree / Belt</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase">
            <span className="text-gray-400">{student.belt}</span>
            <span className="text-amber-500">Next Level</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${stats.beltProgress}%` }}
            />
          </div>
          <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            Approx. {100 - (stats.totalClasses % 100)} Classes to next milestone
          </p>
        </div>
      </div>

      {/* Recent Log */}
      <div className="p-2">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 px-4">Recent Training</h4>
        <div className="space-y-3">
          {attendance.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-center gap-4 glass p-4 rounded-3xl border-gray-100 shadow-sm">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400">
                {new Date(a.timestamp).getDate()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase text-gray-900 leading-none">Training Confirmed</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                  {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CardPassView = () => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [academyName, setAcademyName] = React.useState('Academy');
  const [downloading, setDownloading] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(data);
      if (data.academy_id) {
        const { data: acaData } = await supabase.from('academies').select('name').eq('id', data.academy_id).maybeSingle();
        if (acaData) setAcademyName(acaData.name);
      }
    } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
  };

  const downloadCard = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0f172a',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-card-container]') as HTMLElement;
          if (el) {
            el.style.width = '400px';
            el.style.height = '620px'; // Updated to match new UI height
            el.style.transform = 'none';
            el.style.margin = '0';

            // Adjust internal spacing specifically for the capture to prevent cutting
            const infoBottom = el.querySelector('[data-info-bottom]') as HTMLElement;
            if (infoBottom) {
              infoBottom.style.marginTop = '-20px';
              infoBottom.style.position = 'relative';
              infoBottom.style.zIndex = '20';
            }
          }
        }
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Matkeep-Pass-${student?.name?.replace(/\s+/g, '-') || 'Student'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error:', err);
      alert(`Error generating image: ${err.message || 'Check connection or image permissions'}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-6 min-h-[60vh]">
        <div className="h-20 w-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
          <CreditCard size={40} />
        </div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Identify yourself to view your digital pass</p>
        <Link to="/student/dashboard" className="text-primary font-black uppercase text-xs hover:underline">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 py-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center">
        <h2 className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 mb-2">Identification Node</h2>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Digital Authentication System</p>
      </div>

      <div className="w-full flex justify-center py-4 px-4 overflow-x-auto">
        {/* The Card Container - Redesigned Vertical ID */}
        <div ref={cardRef} data-card-container style={{ width: '400px', height: '620px', padding: '0', margin: '0', flexShrink: 0 }}>
          <div className="relative w-full h-full" style={{ backgroundColor: '#0f172a', borderRadius: '3rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

            {/* Design Elements */}
            <div className="absolute top-0 left-0 right-0" style={{ height: '14rem', background: 'linear-gradient(to bottom, rgba(79, 70, 229, 0.2), transparent)' }} />
            <div className="absolute rounded-full" style={{ right: '-6rem', top: '-6rem', height: '18rem', width: '18rem', backgroundColor: 'rgba(79, 70, 229, 0.2)' }} />
            <div className="absolute rounded-full" style={{ left: '-5rem', bottom: '-5rem', height: '18rem', width: '18rem', backgroundColor: 'rgba(236, 72, 153, 0.1)' }} />

            {/* Header Area Removed */}
            <div className="relative z-10" style={{ paddingTop: '3rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3rem' }}>
            </div>

            {/* Photo Section */}
            <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
              <div style={{ height: '11.5rem', width: '11.5rem', borderRadius: '9999px', overflow: 'hidden', border: '6px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
                {student.photo_url ? (
                  <img
                    src={student.photo_url.startsWith('data:') ? student.photo_url : `${student.photo_url}${student.photo_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                    alt="Pass"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(student!.name) + "&background=1e293b&color=fff";
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '4rem', color: '#ffffff' }}>
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="relative z-20" style={{ marginTop: '1.5rem', paddingLeft: '2rem', paddingRight: '2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: '1', color: '#ffffff', marginBottom: '0.4rem' }}>
                {student.name}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.65em', fontStyle: 'italic', color: '#818cf8', opacity: 0.9 }}>
                  Student
                </p>
              </div>

              <div data-info-bottom style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>ID Number</p>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 900, color: '#ffffff' }}>#{student.internal_id || '000000'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>Affiliation</p>
                  <p style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: '1.2' }}>{academyName}</p>
                </div>
              </div>
            </div>

            {/* Barcode Footer Section */}
            <div className="relative z-10" style={{ marginTop: 'auto', paddingLeft: '2.2rem', paddingRight: '2.2rem', paddingBottom: '3rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '2.2rem', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', transform: 'scaleX(1.1)' }}>
                  <Barcode
                    value={String(student.card_pass_code || student.internal_id || '000000')}
                    width={2.8}
                    height={100}
                    displayValue={false}
                    margin={0}
                    background="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Overlay Gradient for Texture */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.12) 0%, transparent 70%)', opacity: 0.25 }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[400px]">
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="group h-16 w-full rounded-[1.5rem] bg-gray-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50" style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)' }}
        >
          {downloading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#6366f1' }}>
                <Download size={20} />
              </div>
              Save Digital Pass
            </>
          )}
        </button>
        <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-[0.3em] px-8 opacity-60">
          Node encryption active • Generated for secure access
        </p>
      </div>
    </div>
  );
};

const ProfileView = () => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showCamera, setShowCamera] = React.useState(false);
  const [updatingPhoto, setUpdatingPhoto] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ phone: '', birth_date: '' });
  const [passwordForm, setPasswordForm] = React.useState({ current: '', new: '', confirm: '' });
  const [showPasswordFields, setShowPasswordFields] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const passwordValidation = React.useMemo(() => {
    const { new: pass } = passwordForm;
    return {
      length: pass.length >= 6,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      match: pass === passwordForm.confirm && pass !== ''
    };
  }, [passwordForm]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      return `${month}/${day}/${year}`;
    } catch {
      return dateStr;
    }
  };

  React.useEffect(() => { fetchStudent(); }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(data);
      setEditForm({
        phone: data.phone || '',
        birth_date: data.birth_date || ''
      });
    } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_student_id');
    localStorage.removeItem('student_session_key');
    window.location.hash = '/public/register';
  };

  const handleUpdatePhoto = async (base64Photo: string) => {
    if (!student) return;
    setUpdatingPhoto(true);
    try {
      const { error } = await supabase.from('students').update({ photo_url: base64Photo }).eq('id', student.id);
      if (error) {
        console.error("Database error:", error);
        alert("Fail to sync photo to cloud. Please try a smaller file or better connection.");
        throw error;
      }
      setStudent({ ...student, photo_url: base64Photo });
    } catch (err) {
      console.error("Error updating photo:", err);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!student) return;
    setSaving(true);
    try {
      // Validate password if being changed
      if (showPasswordFields) {
        if (!passwordValidation.length || !passwordValidation.special) {
          alert('Password does not meet the requirements.');
          setSaving(false);
          return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
          alert('Passwords do not match.');
          setSaving(false);
          return;
        }

        const { error: passError } = await supabase.from('students').update({
          password: passwordForm.new
        }).eq('id', student.id);

        if (passError) throw passError;
      }

      const { error } = await supabase.from('students').update({
        phone: editForm.phone,
        birth_date: editForm.birth_date
      }).eq('id', student.id);
      if (error) throw error;
      setStudent({ ...student, ...editForm, ...(showPasswordFields ? { password: passwordForm.new } : {}) });
      setIsEditing(false);

      if (showPasswordFields) {
        setSuccessMessage('Password updated successfully! Re-authenticating...');
        setTimeout(() => {
          handleLogout();
        }, 2000);
      }

      setShowPasswordFields(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) { console.error('Error:', err); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 flex justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-6 min-h-[60vh]">
        <div className="h-20 w-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
          <User size={40} />
        </div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Student profile not found</p>
        <Link to="/student/dashboard" className="text-primary font-black uppercase text-xs hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      {successMessage && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-[1.5rem] flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="bg-green-500 rounded-full p-1">
            <Check size={14} className="text-white" strokeWidth={4} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-green-600">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative h-40 w-40 cursor-pointer overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl transition-all active:scale-95 group"
          onClick={() => setShowCamera(true)}
        >
          {student.photo_url ? (
            <img
              src={student.photo_url.startsWith('data:') ? student.photo_url : `${student.photo_url}${student.photo_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
              alt="Profile"
              className={`h-full w-full object-cover transition-all ${isEditing ? 'opacity-40 scale-110' : 'group-hover:opacity-60'}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.name) + "&background=0f172a&color=fff";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-black text-white italic">
              {student.name.charAt(0)}
            </div>
          )}

          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all bg-black/40 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-xl mb-2">
              {updatingPhoto ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Change Photo</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-1">{student.name}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Node Identifier: {student.internal_id || '---'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { label: 'Mobile Contact', value: student.phone, key: 'phone', type: 'text', placeholder: '(00) 00000-0000' },
          { label: 'Date of Birth', value: formatDisplayDate(student.birth_date), key: 'birth_date', type: 'date' },
        ].map((field, i) => (
          <div key={i} className={`glass rounded-[1.8rem] p-6 flex flex-col gap-1 transition-all ${isEditing ? 'ring-2 ring-primary/20 bg-white shadow-lg' : 'border-gray-100'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{field.label}</span>
            {isEditing ? (
              <input
                type={field.type}
                placeholder={field.placeholder}
                className="bg-transparent border-none p-0 text-lg font-black text-gray-900 outline-none w-full placeholder:text-gray-300"
                value={(editForm as any)[field.key]}
                onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
              />
            ) : (
              <p className="text-lg font-black text-gray-900 italic tracking-tight">{field.value || '---'}</p>
            )}
          </div>
        ))}

        <div className="glass rounded-[1.8rem] p-6 flex items-center justify-between border-gray-100 overflow-hidden relative bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Current Rank</span>
            <p className="text-lg font-black text-gray-900 italic tracking-tight uppercase">{student.belt} • {student.degrees}º Degree</p>
          </div>
          {(() => {
            const styles = getBeltStyle(student.belt);
            return (
              <div
                className={`h-14 w-14 rounded-[1.2rem] border-4 flex items-center justify-center shadow-lg transition-all duration-500 ${styles.bg} ${styles.border}`}
              >
                <GraduationCap size={24} className={styles.text} />
              </div>
            );
          })()}
        </div>

        {isEditing && (
          <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Credentials</span>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-[10px] font-black uppercase text-primary hover:underline"
              >
                {showPasswordFields ? 'Hide Password Options' : 'Change Password'}
              </button>
            </div>

            {showPasswordFields && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="glass rounded-[1.5rem] p-5 flex flex-col gap-1 border-primary/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">New Password</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="bg-transparent border-none p-0 text-lg font-black text-gray-900 outline-none w-full placeholder:text-gray-200"
                      value={passwordForm.new}
                      onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    />
                  </div>

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

                  <div className="glass rounded-[1.5rem] p-5 flex flex-col gap-1 border-primary/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Repeat New Password</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="bg-transparent border-none p-0 text-lg font-black text-gray-900 outline-none w-full placeholder:text-gray-200"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    />
                  </div>

                  {passwordForm.confirm !== '' && !passwordValidation.match && (
                    <div className="flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest text-red-500 animate-pulse">
                      <AlertCircle size={12} strokeWidth={4} />
                      Passwords do not match
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsEditing(false)}
              className="h-16 w-full rounded-[1.2rem] bg-gray-100 text-gray-500 font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="h-16 w-full rounded-[1.2rem] bg-gray-900 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Sync'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="h-16 w-full rounded-[1.2rem] bg-gray-900 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-black active:scale-95"
          >
            <Activity size={20} className="text-primary" />
            Edit Profile Node
          </button>
        )}

        <button
          onClick={handleLogout}
          className="h-14 w-full text-red-500 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-red-50 rounded-[1.2rem] transition-all flex items-center justify-center gap-3 mt-4"
        >
          <LogOut size={16} /> Close Authentication Session
        </button>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleUpdatePhoto}
          onClose={() => setShowCamera(false)}
          initialImage={student.photo_url}
        />
      )}
    </div>
  );
};

const getBeltStyle = (belt: string) => {
  const b = String(belt).toLowerCase();

  if ((b.includes('white') || b.includes('branca')) && !b.includes(' ') && !b.includes('e'))
    return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900' };

  if (b.includes('gray') || b.includes('cinza'))
    return { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-white' };

  if (b.includes('yellow') || b.includes('amarela'))
    return { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-black' };

  if (b.includes('orange') || b.includes('laranja'))
    return { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' };

  if ((b.includes('green') || b.includes('verde')) && !b.includes('blue') && !b.includes('azul'))
    return { bg: 'bg-green-600', border: 'border-green-700', text: 'text-white' };

  if (b.includes('blue') || b.includes('azul'))
    return { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' };

  if (b.includes('purple') || b.includes('roxa'))
    return { bg: 'bg-purple-700', border: 'border-purple-800', text: 'text-white' };

  if (b.includes('brown') || b.includes('marrom'))
    return { bg: 'bg-[#5c2d13]', border: 'border-[#3d1e0d]', text: 'text-white' };

  if ((b.includes('black') || b.includes('preta')) && !b.includes('red') && !b.includes('vermelha') && !b.includes('gray') && !b.includes('cinza'))
    return { bg: 'bg-black', border: 'border-gray-700', text: 'text-white' };

  if (b.includes('red') || b.includes('vermelha'))
    return { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white' };

  return { bg: 'bg-gray-900', border: 'border-black', text: 'text-white' };
};

const StudentPortal = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="card" element={<CardPassView />} />
      <Route path="profile" element={<ProfileView />} />
      <Route path="*" element={<Link to="dashboard" className="text-gray-900 font-bold hover:underline px-4">Go to Home</Link>} />
    </Routes>
  );
};

export default StudentPortal;
