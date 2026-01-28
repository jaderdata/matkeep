
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Card, Badge, Button } from '../components/UI';
import { CreditCard, Calendar, Activity, Download, User, Loader2, ChevronRight, Flame, GraduationCap, LogOut } from 'lucide-react';
import { Student } from '../types';
import { supabase } from '../services/supabase';
import { CameraCapture } from '../components/CameraCapture';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
    if (attendance.length === 0) return { count: 0, active: false };
    const uniqueDates = Array.from(new Set(attendance.map((a: any) => a.timestamp.split('T')[0])))
      .sort((a: string, b: string) => b.localeCompare(a));
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

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!student) return null;

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
                  className="h-full rounded-full bg-gradient-to-right from-primary to-pink-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000"
                  style={{ width: `${stats.xp}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 animate-glow rounded-full bg-primary/20 blur-xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-gray-800 p-1 shadow-2xl">
              {student.photo_url ? (
                <img src={student.photo_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
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
        <div className="glass items-center justify-center rounded-3xl p-6 border-none bg-primary text-white shadow-xl flex flex-col">
          <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">Consistency</span>
          <div className="flex items-center gap-2">
            <Flame size={24} className={streakStats.active ? "text-orange-400 animate-bounce" : "text-indigo-300 opacity-50"} />
            <span className="text-3xl font-black">{streakStats.count}D</span>
          </div>
        </div>
      </div>

      {/* Main Action: Digital Pass */}
      <button
        onClick={() => window.location.hash = '#/student/card'}
        className="group relative h-20 w-full overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all active:scale-95"
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
      </button>

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
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-card-container]') as HTMLElement;
          if (el) {
            el.style.padding = '40px';
            el.style.background = '#0f172a';
          }
        }
      });
      const link = document.createElement('a');
      link.download = `Matkeep-Pass-${student?.name?.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error('Error:', err); } finally { setDownloading(false); }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!student) return null;

  return (
    <div className="flex flex-col items-center gap-10 py-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center">
        <h2 className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 mb-2">Identification Node</h2>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Authorization</p>
      </div>

      <div className="w-full flex justify-center perspective-[1000px]">
        {/* The Card Container */}
        <div ref={cardRef} data-card-container className="bg-transparent p-0 w-full max-w-[400px]">
          <div className="relative aspect-[1.6/1] w-full bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10">
            {/* Background elements */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pink-600/20 blur-3xl opacity-50" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />

            <div className="relative h-full flex flex-col p-6 z-10">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white flex items-center justify-center text-gray-900 rounded-lg font-black italic shadow-lg shadow-white/10 text-xs">M</div>
                  <span className="font-black text-[10px] text-white tracking-widest italic pt-0.5">MATKEEP</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[7px] font-black uppercase tracking-widest text-primary">Premium Student</span>
                  </div>
                  <span className="text-[9px] font-mono font-black text-white/40 tracking-widest">#{student.internal_id || student.card_pass_code || '000000'}</span>
                </div>
              </div>

              {/* Card Content Row */}
              <div className="flex gap-5 items-center mb-4">
                <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-primary/30 bg-gray-800 shadow-inner shrink-0 text-white">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="Pass" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl uppercase">
                      {student.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white truncate leading-none mb-1">{student.name}</h3>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">{student.nickname || 'Student'}</p>
                  <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">{academyName}</p>
                </div>
              </div>

              {/* Barcode Section */}
              <div className="bg-white rounded-xl p-3 mt-auto flex flex-col items-center gap-1.5 shadow-xl ring-2 ring-black/50">
                <div className="opacity-80 scale-90">
                  <Barcode
                    value={String(student.internal_id || student.card_pass_code || '000000')}
                    width={1.2}
                    height={35}
                    displayValue={false}
                    margin={0}
                    background="#ffffff"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.3em]">ID Node</span>
                  <span className="text-[10px] font-black text-gray-900 tracking-[0.4em] font-mono">
                    {student.internal_id || student.card_pass_code || '000000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[400px]">
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="group h-16 w-full rounded-[1.5rem] bg-gray-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50 ring-1 ring-white/10"
        >
          {downloading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-primary group-hover:scale-110 transition-transform">
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

  React.useEffect(() => { fetchStudent(); }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(data);
      setEditForm({ phone: data.phone || '', birth_date: data.birth_date || '' });
    } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_student_id');
    window.location.hash = '/public/register';
  };

  const handleUpdatePhoto = async (base64Photo: string) => {
    if (!student) return;
    setUpdatingPhoto(true);
    try {
      const { error } = await supabase.from('students').update({ photo_url: base64Photo }).eq('id', student.id);
      if (error) throw error;
      setStudent({ ...student, photo_url: base64Photo });
    } catch (err) { console.error("Error:", err); } finally { setUpdatingPhoto(false); }
  };

  const handleSaveProfile = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('students').update({ phone: editForm.phone, birth_date: editForm.birth_date }).eq('id', student.id);
      if (error) throw error;
      setStudent({ ...student, ...editForm });
      setIsEditing(false);
    } catch (err) { console.error('Error:', err); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!student) return null;

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative h-40 w-40 cursor-pointer overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl transition-transform active:scale-95 group"
          onClick={() => setShowCamera(true)}
        >
          {student.photo_url ? (
            <img src={student.photo_url} alt="Profile" className="h-full w-full object-cover transition-opacity group-hover:opacity-50" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-black text-white italic">
              {student.name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-xl">
              <Activity className={updatingPhoto ? "animate-spin" : ""} size={24} />
            </div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-1">{student.name}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Node Identifier: {student.internal_id || '---'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { label: 'Mobile Contact', value: student.phone, key: 'phone', type: 'text' },
          { label: 'Date of Birth', value: student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '---', key: 'birth_date', type: 'date' },
        ].map((field, i) => (
          <div key={i} className="glass rounded-[1.5rem] p-6 flex flex-col gap-1 border-gray-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{field.label}</span>
            {isEditing ? (
              <input
                type={field.type}
                className="bg-transparent border-none p-0 text-lg font-black text-gray-900 outline-none w-full"
                value={field.key === 'phone' ? editForm.phone : editForm.birth_date}
                onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
              />
            ) : (
              <p className="text-lg font-black text-gray-900 italic tracking-tight">{field.value || 'Not set'}</p>
            )}
          </div>
        ))}

        <div className="glass rounded-[1.5rem] p-6 flex items-center justify-between border-gray-100 overflow-hidden relative">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Current Rank</span>
            <p className="text-lg font-black text-gray-900 italic tracking-tight uppercase">{student.belt} • {student.degrees}º Degree</p>
          </div>
          <div className="h-12 w-12 rounded-2xl border-4 border-gray-900 flex items-center justify-center" style={{ backgroundColor: student.belt?.toLowerCase() }}>
            <GraduationCap size={20} className="text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        {isEditing ? (
          <button onClick={handleSaveProfile} disabled={saving} className="h-16 w-full rounded-[1.2rem] bg-gray-900 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Sync'}
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="h-16 w-full rounded-[1.2rem] glass-dark text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            Edit Profile Node
          </button>
        )}

        <button onClick={handleLogout} className="h-14 w-full text-red-500 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-3">
          <LogOut size={16} /> Close Authentication Session
        </button>
      </div>

      {showCamera && (
        <CameraCapture onCapture={handleUpdatePhoto} onClose={() => setShowCamera(false)} initialImage={student.photo_url} />
      )}
    </div>
  );
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
