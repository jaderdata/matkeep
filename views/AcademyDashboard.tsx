
import React from 'react';
import { Users, UserCheck, UserMinus, AlertTriangle, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Card, Badge } from '../components/UI';
import { FlagStatus, UserStatus, Student, Academy } from '../types';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

const KPI: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = "text-gray-900" }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-3xl font-black ${color}`}>{value}</h3>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  </Card>
);

const AcademyDashboard: React.FC = () => {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [academy, setAcademy] = React.useState<Academy | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const init = async () => {
      const acaId = await fetchAcademy();
      await fetchStudents(acaId || undefined);
      setLoading(false);
    };
    init();
  }, []);

  const fetchAcademy = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return null;

      let query = supabase.from('academies').select('*');

      if (session.user.email !== 'jader_dourado@hotmail.com') {
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
          settings: { yellowFlagDays: data.yellow_flag_days, redFlagDays: data.red_flag_days }
        });
        return data.id; // Retorna o ID para o fetchStudents
      }
    } catch (err) {
      console.error('Error fetching academy:', err);
    }
    return null;
  };

  const fetchStudents = async (academyId?: string) => {
    try {
      let query = supabase.from('students').select('*');
      if (academyId) {
        query = query.eq('academy_id', academyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === UserStatus.ATIVO).length;
  const inactiveStudents = totalStudents - activeStudents;
  const yellowFlags = students.filter(s => s.flag === FlagStatus.AMARELA).length;
  const redFlags = students.filter(s => s.flag === FlagStatus.VERMELHA).length;

  const birthdaysThisMonth = students.filter(s => {
    if (!s.birth_date) return false;
    try {
      // Ajuste para lidar com string de data ISO ou YYYY-MM-DD
      const bDate = new Date(s.birth_date);
      return bDate.getMonth() === new Date().getMonth();
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Dashboard</h2>
        <p className="text-gray-500 text-sm">Summary of your academy's health today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Students" value={totalStudents} icon={<Users size={24} />} />
        <KPI label="Active Students" value={activeStudents} icon={<UserCheck size={24} />} />
        <KPI label="Inactive" value={inactiveStudents} icon={<UserMinus size={24} />} color="text-gray-400" />
        <KPI label="Avg Attendance" value="--" icon={<TrendingUp size={24} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPI label="Yellow Flag" value={yellowFlags} icon={<AlertTriangle size={24} />} color="text-yellow-600" />
        <KPI label="Red Flag" value={redFlags} icon={<AlertTriangle size={24} />} color="text-red-600" />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas Recentes */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-300 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Recent Alerts</h3>
            <Badge color="red">Churn Risk</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-300">Student</th>
                  <th className="px-4 py-3 border-b border-gray-300">Status</th>
                  <th className="px-4 py-3 border-b border-gray-300">Last Attendance</th>
                  <th className="px-4 py-3 border-b border-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {students.filter(s => s.flag !== FlagStatus.VERDE).length > 0 ? (
                  students.filter(s => s.flag !== FlagStatus.VERDE).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge color={s.flag === FlagStatus.AMARELA ? 'yellow' : 'red'}>
                          {s.flag}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.last_attendance ? new Date(s.last_attendance).toLocaleDateString('en-US') : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-[10px] font-bold uppercase text-gray-900 hover:underline">View Student</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic text-xs uppercase">
                      No critical alerts at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Widgets Laterais */}
        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" /> Attendance Ranking
              </h3>
            </div>
            <div className="p-4 text-center py-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                Attendance data will be displayed as classes are registered.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" /> Birthdays this Month
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {birthdaysThisMonth.length > 0 ? (
                birthdaysThisMonth.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 text-sm border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                      {new Date(s.birth_date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 flex items-center justify-center text-gray-400 py-8 italic text-sm">
                  No birthdays this month.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Tooltip Fixo Explicativo */}
      <div className="bg-gray-900 text-white p-4 text-[11px] font-medium leading-relaxed">
        <p className="uppercase font-black mb-1 opacity-60">Monitoring Criteria:</p>
        <div className="flex flex-wrap gap-6">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500"></div> GREEN: Frequent student (attendance in less than {academy?.settings.yellowFlagDays || 7} days)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500"></div> YELLOW: {academy?.settings.yellowFlagDays || 7} to {(academy?.settings.redFlagDays || 14) - 1} days without attendance (contact now)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500"></div> RED: {academy?.settings.redFlagDays || 14}+ days without attendance (high churn risk)
          </span>
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;
