import React, { useMemo } from 'react';
import { Trophy, Flame, Loader2 } from 'lucide-react';
import { TotalStudentsIcon, ActiveStudentsIcon, InactiveStudentsIcon, AvgAttendanceIcon, YellowFlagIcon, RedFlagIcon, CalendarIcon } from '../components/CustomIcons';
import { Card, Badge } from '../components/UI';
import { FlagStatus, UserStatus, Student, Academy } from '../types';
import { useAcademy } from '../contexts/AcademyContext';
import { useStudents, useAttendance } from '../hooks/useQueries';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <Card className="p-6 relative overflow-hidden transition-ui hover:shadow-lg">
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-[var(--text-primary)]">{value}</h3>
        {trend && <p className="text-xs text-green-500 mt-2 flex items-center gap-1">{trend}</p>}
      </div>
      <div className={color}>
        {icon}
      </div>
    </div>
  </Card>
);

const AcademyDashboard: React.FC = () => {
  const { academy, academyId, loading: academyLoading } = useAcademy();
  const navigate = useNavigate();

  const { data: students = [], isLoading: studentsLoading } = useStudents(academyId);
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance(academyId);

  const loading = academyLoading || studentsLoading || attendanceLoading;

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === UserStatus.ATIVO).length;
  const inactiveStudents = totalStudents - activeStudents;
  const yellowFlags = students.filter(s => s.flag === 'YELLOW').length;
  const redFlags = students.filter(s => s.flag === 'RED').length;

  const birthdaysThisMonth = students.filter(s => {
    if (!s.birth_date) return false;
    try {
      const bDate = new Date(s.birth_date);
      return bDate.getMonth() === new Date().getMonth();
    } catch (e) {
      return false;
    }
  });

  const streaksRanking = useMemo(() => {
    if (!students.length || !attendance.length) return [];

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const results = students.map(student => {
      const studentAttendance = attendance
        .filter(a => a.student_id === student.id)
        .map(a => a.timestamp.split('T')[0]);

      const uniqueDates = Array.from(new Set(studentAttendance))
        .sort((a: string, b: string) => b.localeCompare(a));

      if (uniqueDates.length === 0) return { student, count: 0, active: false };

      const lastTrainingDate = uniqueDates[0];
      if (lastTrainingDate !== today && lastTrainingDate !== yesterday) {
        return { student, count: 0, active: false };
      }

      let count = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i] + 'T00:00:00');
        const next = new Date(uniqueDates[i + 1] + 'T00:00:00');
        const diffDays = Math.round((current.getTime() - next.getTime()) / 86400000);

        if (diffDays === 1) count++;
        else break;
      }
      return { student, count, active: true };
    });

    return results
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [students, attendance]);

  if (loading || academyLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-gray-500 text-sm">Summary of your academy's health today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} icon={<TotalStudentsIcon size={24} className="text-indigo-500" />} color="" />
        <StatCard title="Active Students" value={activeStudents} icon={<ActiveStudentsIcon size={24} className="text-green-500" />} color="" />
        <StatCard title="Inactive" value={inactiveStudents} icon={<InactiveStudentsIcon size={24} className="text-slate-500" />} color="" />
        <StatCard title="Avg Attendance" value="--" icon={<AvgAttendanceIcon size={24} className="text-blue-500" />} color="" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Yellow Flag" value={yellowFlags} icon={<YellowFlagIcon size={24} className="text-yellow-500" />} color="" />
        <StatCard title="Red Flag" value={redFlags} icon={<RedFlagIcon size={24} className="text-red-500" />} color="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Recent Alerts</h3>
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
                {students.filter(s => s.flag !== 'GREEN').length > 0 ? (
                  students.filter(s => s.flag !== 'GREEN').map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge color={s.flag === 'GREEN' ? 'green' : s.flag === 'YELLOW' ? 'yellow' : 'red'}>
                          {s.flag}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.last_attendance ? new Date(s.last_attendance).toLocaleDateString('en-US') : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-[10px] font-bold uppercase text-gray-900 hover:underline"
                          onClick={() => navigate('/academy/students')}
                        >
                          View Student
                        </button>
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

        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" /> Attendance Ranking
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {streaksRanking.length > 0 ? (
                streaksRanking.map((rank, index) => (
                  <div key={rank.student.id} className="flex items-center justify-between p-3 rounded-none bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] group hover:border-orange-500/50 hover:bg-orange-500/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                        #{index + 1}
                      </div>
                      <span className="text-xs font-black uppercase text-[var(--text-primary)]">{rank.student.name}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm group-hover:border-orange-300">
                      <Flame size={12} className={rank.count >= 3 ? 'text-red-500 animate-pulse' : 'text-orange-500'} />
                      <span className="text-[10px] font-black text-gray-900">{rank.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                    No active streaks yet.<br />Time to get on the mat!
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} className="text-blue-500" /> Birthdays this Month
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

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 text-[10px] font-bold leading-relaxed shadow-sm">
        <p className="uppercase font-black mb-3 text-[var(--text-primary)] tracking-widest text-[11px]">Monitoring Criteria</p>
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-3 text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-green-500 shadow-lg shadow-green-500/20"></div>
            <span className="font-black text-[var(--text-primary)]">GREEN:</span> Frequent student (attendance in less than {academy?.settings.yellowFlagDays || 7} days)
          </span>
          <span className="flex items-center gap-3 text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-yellow-500 shadow-lg shadow-yellow-500/20"></div>
            <span className="font-black text-[var(--text-primary)]">YELLOW:</span> {academy?.settings.yellowFlagDays || 7} to {(academy?.settings.redFlagDays || 14) - 1} days without (contact now)
          </span>
          <span className="flex items-center gap-3 text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-red-500 shadow-lg shadow-red-500/20"></div>
            <span className="font-black text-[var(--text-primary)]">RED:</span> {academy?.settings.redFlagDays || 14}+ days without (high churn risk)
          </span>
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;
