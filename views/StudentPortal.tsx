
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Card, Badge, Button } from '../components/UI';
import { CreditCard, Calendar, Activity, Download, User, Loader2 } from 'lucide-react';
import { Student } from '../types';
import { supabase } from '../services/supabase';
import { CameraCapture } from '../components/CameraCapture';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PWAManager } from '../components/PWAManager';
import { Academy } from '../types';
import { formatUSPhone } from '../utils';

const StudentDashboard = () => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);

      // Fetch Attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', id)
        .order('timestamp', { ascending: false });

      setAttendance(attendanceData || []);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white border border-gray-300">
        <h2 className="text-xl font-black uppercase mb-2">Restricted Access</h2>
        <p className="text-gray-500 text-sm mb-4">No student identified in the system.</p>
        <Link to="/public/register">
          <Button variant="primary">Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
          {student.photo_url ? (
            <img src={student.photo_url} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{student.name}</h2>
          <div className="flex gap-2 mt-2">
            <Badge color="blue">Belt {student.belt}</Badge>
            <Badge color="gray">{student.degrees} Degrees</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
            <Activity size={16} /> Monthly Attendance
          </h3>
          <div className="h-48 w-full">
            {attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={
                  // Últimos 7 registros formatados
                  attendance.slice(0, 10).reverse().map(a => {
                    const d = new Date(a.timestamp);
                    return {
                      fullDate: d.toLocaleDateString('en-US'),
                      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                      day: d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
                      val: 1 // Constante para altura
                    }
                  })
                }>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: '900', fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 1.2]} />
                  <Tooltip
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black text-white p-3 rounded-xl shadow-2xl border-none">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{data.fullDate}</p>
                            <p className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                              <Calendar size={12} className="text-blue-400" /> {data.time}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#000"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#000', strokeWidth: 3, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200">
                <Activity size={32} className="text-gray-300 mb-2" />
                <p className="text-[10px] font-black uppercase text-gray-400">No data to display</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">30d Consistency</span>
            <span className="text-sm font-black text-gray-900">
              {attendance.filter(a => {
                const diff = (new Date().getTime() - new Date(a.timestamp).getTime()) / (1000 * 3600 * 24);
                return diff <= 30;
              }).length} Classes
            </span>
          </div>
        </Card>

        <Card className="p-6 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200">
          <CreditCard size={48} className="text-gray-300 mb-4" />
          <p className="text-xs font-bold text-gray-500 text-center uppercase mb-4 max-w-[200px]">Present your Card Pass to register attendance.</p>
          <Link to="/student/card">
            <Button variant="secondary">Open Card Pass</Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Recent Records
        </h3>
        {attendance.length > 0 ? (
          <div className="space-y-2">
            {attendance.slice(0, 5).map((record) => (
              <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 italic">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-gray-200 flex items-center justify-center rounded uppercase text-[10px] font-black">
                    {new Date(record.timestamp).toLocaleDateString('en-US', { day: '2-digit' })}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-gray-900">Training Confirmed</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(record.timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200">
            <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase text-gray-400">No records found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

const CardPassView = () => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [academyName, setAcademyName] = React.useState('Academia');
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);

      if (data.academy_id) {
        const { data: acaData } = await supabase
          .from('academies')
          .select('name')
          .eq('id', data.academy_id)
          .maybeSingle();
        if (acaData) setAcademyName(acaData.name);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `card-${student?.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;
  if (!student) return <div className="p-8 text-center">Registration not found.</div>;

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div ref={cardRef} className="p-6 bg-white">
        <Card className="w-[320px] bg-white overflow-hidden shadow-2xl border-2 border-gray-900">
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <span className="text-[10px] font-black tracking-widest">IDENTIFICATION</span>
            <span className="font-bold text-xs italic">MATKEEP</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-gray-100 border border-gray-300 flex items-center justify-center overflow-hidden">
              {student.photo_url ? (
                <img src={student.photo_url} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">{student.name}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">{academyName}</p>
            </div>
            <div className="w-full pt-4 border-t border-gray-100 flex flex-col items-center">
              <div className="bg-white p-1">
                <Barcode
                  value={String(student.internal_id || student.card_pass_code)}
                  width={1.2}
                  height={50}
                  fontSize={10}
                  fontOptions="bold"
                  margin={0}
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-end">
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase">Rank</p>
              <p className="text-[10px] font-bold uppercase">{student.belt}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-gray-400 uppercase">Issue Date</p>
              <p className="text-[10px] font-bold">{new Date().toLocaleDateString('en-US')}</p>
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={downloadCard} className="flex items-center gap-2">
        <Download size={18} /> Download Card Image
      </Button>
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
  const [editForm, setEditForm] = React.useState({
    phone: '',
    birth_date: ''
  });

  React.useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const id = localStorage.getItem('current_student_id');
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);
      setEditForm({
        phone: data.phone || '',
        birth_date: data.birth_date || ''
      });
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_student_id');
    window.location.hash = '/public/register';
  };

  const handleUpdatePhoto = async (base64Photo: string) => {
    if (!student) return;
    setUpdatingPhoto(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ photo_url: base64Photo })
        .eq('id', student.id);

      if (error) throw error;
      setStudent({ ...student, photo_url: base64Photo });
    } catch (err) {
      console.error("Error updating photo:", err);
      alert("Error saving photo to server.");
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          phone: editForm.phone,
          birth_date: editForm.birth_date
        })
        .eq('id', student.id);

      if (error) throw error;
      setStudent({ ...student, ...editForm });
      setIsEditing(false);
      alert('Data updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={48} /></div>;
  if (!student) return <div className="p-8 text-center text-gray-500">Profile not found.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4">
      <Card className="p-8">
        <div className="flex flex-col items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div
            className="w-32 h-32 bg-gray-900 flex items-center justify-center text-white text-4xl font-bold cursor-pointer overflow-hidden relative group"
            onClick={() => setShowCamera(true)}
          >
            {student.photo_url ? (
              <img src={student.photo_url} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              student.name.charAt(0)
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] font-bold uppercase gap-2">
              <Activity className={updatingPhoto ? "animate-spin" : ""} size={20} />
              {updatingPhoto ? "Saving..." : "Change Photo"}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight">{student.name}</h2>
            <p className="text-gray-500 font-medium">{student.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Phone</p>
            {isEditing ? (
              <input
                className="w-full bg-gray-50 border border-gray-200 p-2 font-bold focus:ring-1 focus:ring-gray-900 outline-none"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: formatUSPhone(e.target.value) })}
              />
            ) : (
              <p className="font-bold">{student.phone}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Date of Birth</p>
            {isEditing ? (
              <input
                type="date"
                className="w-full bg-gray-50 border border-gray-200 p-2 font-bold focus:ring-1 focus:ring-gray-900 outline-none"
                value={editForm.birth_date}
                onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })}
              />
            ) : (
              <p className="font-bold">{new Date(student.birth_date).toLocaleDateString('en-US')}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Rank</p>
            <p className="font-bold uppercase text-gray-400">Belt {student.belt} - {student.degrees} Degrees</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Sequential ID</p>
            <p className="font-mono text-xs text-gray-400 font-bold">{student.internal_id || '---'}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full flex items-center justify-center gap-2">
                {saving && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} className="w-full">Cancel</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full text-gray-900 border-gray-900 font-black">Edit Data</Button>
          )}
          <Button variant="secondary" className="w-full text-red-600 border-red-100 hover:bg-red-50 font-bold" onClick={handleLogout}>Logout</Button>
        </div>
      </Card>

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

const StudentPortal = () => {
  const [academy, setAcademy] = React.useState<Academy | null>(null);

  React.useEffect(() => {
    const fetchAcademyForStudent = async () => {
      const studentId = localStorage.getItem('current_student_id');
      if (!studentId) return;

      try {
        const { data: student } = await supabase.from('students').select('academy_id').eq('id', studentId).single();
        if (student?.academy_id) {
          const { data: academyData } = await supabase.from('academies').select('*').eq('id', student.academy_id).single();
          if (academyData) {
            setAcademy({
              id: academyData.id,
              name: academyData.name,
              address: academyData.address,
              contact: academyData.contact,
              logoUrl: academyData.logo_url,
              settings: { yellowFlagDays: academyData.yellow_flag_days, redFlagDays: academyData.red_flag_days }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching academy for student PWA:', err);
      }
    };
    fetchAcademyForStudent();
  }, []);

  return (
    <>
      <PWAManager academy={academy} />
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="card" element={<CardPassView />} />
        <Route path="profile" element={<ProfileView />} />
        <Route path="*" element={<Link to="dashboard" className="text-gray-900 font-bold hover:underline">Go to Home</Link>} />
      </Routes>
    </>
  );
};

export default StudentPortal;
