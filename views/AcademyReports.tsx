import React, { useState, useEffect } from 'react';
import { FileDown, Calendar, TrendingDown, Users, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import { Card, Button, Select, Input, Badge } from '../components/UI';
import { Belt, UserStatus, Student, FlagStatus } from '../types';
import { supabase } from '../services/supabase';
import { useAcademy } from '../contexts/AcademyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AcademyReports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<'geral' | 'frequencia' | 'evasao' | 'desempenho' | 'atividades'>('geral');
  const [logs, setLogs] = useState<any[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [contactChannel, setContactChannel] = useState<'WhatsApp' | 'SMS' | 'Ligação' | 'Presencial'>('WhatsApp');
  const [contactObservation, setContactObservation] = useState('');
  const { academyId } = useAcademy();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchLogs = async () => {
    if (!academyId) return;
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('academy_id', academyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('academy_id', academyId);
      if (error) throw error;
      setStudents(data || []);
      fetchLogs();
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogContact = async () => {
    if (!selectedStudent || !academyId) return;
    try {
      const contactLog = {
        date: new Date().toISOString(),
        channel: contactChannel,
        observation: contactObservation
      };

      const { data, error } = await supabase
        .rpc('log_student_contact', {
          p_student_id: selectedStudent.id,
          p_contact_log: contactLog
        });

      if (error) throw error;

      alert('Contact logged successfully!');
      setShowContactModal(false);
      setContactObservation('');
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      console.error('Error logging contact:', err);
      alert(`Failed to log contact: ${err.message || 'Please try again.'}`);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Belt', 'Degrees', 'Status', 'Flag', 'Registration Date'];
    const csvRows = [
      headers.join(','),
      ...students.map(s => [
        `"${s.name}"`,
        `"${s.email}"`,
        `"${s.phone}"`,
        `"${s.belt_level}"`,
        s.degrees,
        `"${s.status}"`,
        `"${s.flag}"`,
        s.birth_date ? new Date(s.birth_date).toLocaleDateString() : ''
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = getReportTitle();
    const timestamp = new Date().toLocaleString();

    // Add Header
    doc.setFontSize(18);
    doc.text('MATKEEP - Academy Report', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 32);
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 14, 38);

    let head: string[][] = [];
    let body: string[][] = [];

    switch (selectedReport) {
      case 'evasao':
        const riskyStudents = students.filter(s => s.flag !== 'GREEN');
        head = [['Student Name', 'Risk Flag', 'Last Attendance']];
        body = riskyStudents.map(s => [
          s.name,
          s.flag,
          s.last_attendance ? new Date(s.last_attendance).toLocaleDateString('en-US') : 'No record'
        ]);
        break;

      case 'desempenho':
        const beltStats = Object.values(Belt).map(belt => {
          const count = students.filter(s => s.belt_level === belt).length;
          const activePercent = count > 0 ? (students.filter(s => s.belt_level === belt && s.status === UserStatus.ATIVO).length / count * 100).toFixed(0) : 0;
          return { belt, count, activePercent };
        }).filter(s => s.count > 0);
        head = [['Rank (Belt)', 'Qty. Students', 'Avg. Engagement']];
        body = beltStats.map(stat => [
          stat.belt,
          String(stat.count),
          `${stat.activePercent}%`
        ]);
        break;

      case 'atividades':
        head = [['Date & Time', 'User', 'Action', 'Description']];
        body = logs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user_email || 'Sistema',
          log.action.toUpperCase(),
          log.description || ''
        ]);
        break;

      case 'geral':
        const activeCount = students.filter(s => s.status === UserStatus.ATIVO).length;
        const retention = students.length > 0 ? Math.round((activeCount / students.length) * 100) : 0;
        const newStudents = students.filter(s => {
          const d = s.created_at ? new Date(s.created_at).getTime() : 0;
          const start = startDate ? new Date(startDate).getTime() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
          const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
          return d >= start && d <= end;
        }).length;

        head = [['Analytical Metric', 'Current Value', 'Performance']];
        body = [
          ['Total Student Base', String(students.length), 'Stable'],
          ['Engagement (Active)', String(activeCount), `${students.length > 0 ? Math.round(activeCount / students.length * 100) : 0}%`],
          ['Estimated Retention Rate', `${retention}%`, 'Target 95%'],
          ['New Admissions', String(newStudents), `+${newStudents}`]
        ];
        break;

      case 'frequencia':
        // For now, simpler output since it's a placeholder in UI
        doc.setFontSize(12);
        doc.text('Advanced Attendance Module - Heatmaps and peak times coming soon.', 14, 50);
        doc.save(`matkeep_report_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
    }

    if (body.length > 0) {
      autoTable(doc, {
        head: head,
        body: body,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 }
      });
    } else {
      doc.text('No data available for this report.', 14, 50);
    }

    doc.save(`matkeep_report_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--text-secondary)]" size={48} />
      </div>
    );
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'evasao':
        const riskyStudents = students.filter(s => s.flag !== 'GREEN');
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-secondary)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Student at Risk</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Flag</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Last Attendance</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {riskyStudents.length > 0 ? riskyStudents.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{s.name}</td>
                    <td className="px-6 py-4">
                      <Badge color={s.flag === 'RED' ? 'red' : 'yellow'}>{s.flag}</Badge>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {s.last_attendance ? new Date(s.last_attendance).toLocaleDateString('en-US') : 'No record'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        className="text-[10px] py-1"
                        onClick={() => {
                          setSelectedStudent(s);
                          setShowContactModal(true);
                        }}
                      >
                        Log Contact
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)] font-bold uppercase text-[10px]">Congratulations! No students at risk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'desempenho':
        const beltStats = Object.values(Belt).map(belt => {
          const count = students.filter(s => s.belt_level === belt).length;
          const activePercent = count > 0 ? (students.filter(s => s.belt_level === belt && s.status === UserStatus.ATIVO).length / count * 100).toFixed(0) : 0;
          return { belt, count, activePercent };
        }).filter(s => s.count > 0);
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-secondary)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Rank (Belt)</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Qty. Students</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Avg. Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {beltStats.map(stat => (
                  <tr key={stat.belt} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{stat.belt}</td>
                    <td className="px-6 py-4 text-right font-black text-[var(--text-primary)]">{stat.count}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-500 font-bold">{stat.activePercent}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'atividades':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-secondary)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Date & Time</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">User</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Action</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{log.user_email || 'Sistema'}</td>
                    <td className="px-6 py-4">
                      <Badge color={log.action === 'login' ? 'blue' : 'gray'}>{log.action.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] truncate max-w-xs">{log.description}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)] font-bold uppercase text-[10px]">No activity records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'frequencia':
        return (
          <div className="p-12 text-center bg-[var(--bg-secondary)]/30 border border-dashed border-[var(--border-color)]">
            <Calendar size={48} className="text-[var(--text-secondary)] mx-auto mb-4" />
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)] mb-2">Advanced Attendance Module</h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Heatmaps and peak times will be available soon.
            </p>
          </div>
        );

      default:
        const activeCountUI = students.filter(s => s.status === UserStatus.ATIVO).length;
        const retentionUI = students.length > 0 ? Math.round((activeCountUI / students.length) * 100) : 0;
        const newStudentsUI = students.filter(s => {
          const d = s.created_at ? new Date(s.created_at).getTime() : 0;
          const start = startDate ? new Date(startDate).getTime() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
          const end = endDate ? new Date(endDate).getTime() : new Date().getTime(); // End of today if not set? Actually input type date is string YYYY-MM-DD. 
          // If endDate is set, we want end of that day.
          // If endDate is string YYYY-MM-DD, new Date(endDate).getTime() is UTC midnight. 
          // Let's assume broad range.
          return d >= start && d <= (endDate ? new Date(endDate).getTime() + 86400000 : new Date().getTime());
        }).length;

        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-secondary)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Analytical Metric</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Current Value</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                <TableRow label="Total Student Base" value={String(students.length)} change="Stable" positive />
                <TableRow label="Engagement (Active)" value={String(activeCountUI)} change={`${students.length > 0 ? Math.round(activeCountUI / students.length * 100) : 0}%`} positive />
                <TableRow label="Estimated Retention Rate" value={`${retentionUI}%`} change="Target 95%" positive={retentionUI >= 95} />
                <TableRow label="New Admissions" value={String(newStudentsUI)} change={`+${newStudentsUI}`} positive />
              </tbody>
            </table>
          </div>
        );
    }
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'evasao': return 'Details: Churn Risk';
      case 'desempenho': return 'Details: Performance by Belt';
      case 'frequencia': return 'Details: General Attendance';
      case 'atividades': return 'Transparência: Atividade do Sistema';
      default: return 'Operational Summary';
    }
  };

  return (
    <div className="space-y-8 print:block print:bg-white text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Reports and Export</h2>
          <p className="text-[var(--text-secondary)] text-sm">Generate analytical documents on your academy's attendance and retention.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2" onClick={handleExportCSV}>
            <FileDown size={18} />
            <span>Export CSV</span>
          </Button>
          <Button className="flex items-center gap-2" onClick={handleExportPDF}>
            <FileDown size={18} />
            <span>Generate PDF</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-[var(--bg-secondary)]/30 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <Select label="Filter by Belt" options={[{ value: 'All', label: 'All Belts' }, ...Object.values(Belt).map(b => ({ value: b, label: b }))]} />
          <Select label="Student Status" options={[{ value: 'All', label: 'All Statuses' }, { value: UserStatus.ATIVO, label: 'Active' }, { value: UserStatus.INATIVO, label: 'Inactive' }]} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <ReportCard title="Attendance" description="Macro view peaks." icon={<Calendar size={24} className="text-blue-500" />} active={selectedReport === 'frequencia'} onClick={() => setSelectedReport('frequencia')} />
        <ReportCard title="Churn Risk" description="Yellow/Red flags." icon={<TrendingDown size={24} className="text-red-500" />} active={selectedReport === 'evasao'} onClick={() => setSelectedReport('evasao')} />
        <ReportCard title="Performance" description="By rank focus." icon={<Users size={24} className="text-indigo-500" />} active={selectedReport === 'desempenho'} onClick={() => setSelectedReport('desempenho')} />
        <ReportCard title="Activity" description="Audit logs." icon={<ShieldAlert size={24} className="text-orange-500" />} active={selectedReport === 'atividades'} onClick={() => setSelectedReport('atividades')} />
      </div>

      <Card className="print:shadow-none print:border-none animate-in fade-in duration-500 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-l-4 border-[var(--accent-primary)] pl-3">
            {getReportTitle()}
          </h3>
          {selectedReport !== 'geral' && (
            <button onClick={() => setSelectedReport('geral')} className="text-[10px] font-black uppercase text-[var(--accent-primary)] hover:underline print:hidden">
              Back to Summary
            </button>
          )}
        </div>
        <div className="p-6">
          {renderReportContent()}
        </div>
      </Card>

      {/* Contact Log Modal */}
      {showContactModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black uppercase mb-4">Log Contact - {selectedStudent.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Channel</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value as any)}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Ligação">Phone Call</option>
                  <option value="Presencial">In Person</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Observation</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Notes about the contact..."
                  value={contactObservation}
                  onChange={(e) => setContactObservation(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowContactModal(false);
                  setContactObservation('');
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleLogContact}
              >
                Save Contact
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportCard: React.FC<{ title: string; description: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }> = ({ title, description, icon, active, onClick }) => (
  <Card className={`p-6 transition-all cursor-pointer group relative overflow-hidden ${active ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]' : 'hover:border-[var(--accent-primary)]'}`} onClick={onClick}>
    <div className={`mb-4 transition-transform group-hover:scale-110 duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <h4 className={`text-sm font-black uppercase tracking-tight mb-2 ${active ? 'text-[var(--text-primary)]' : 'group-hover:text-[var(--accent-primary)]'}`}>{title}</h4>
    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
  </Card>
);

const TableRow: React.FC<{ label: string; value: string; change: string; positive: boolean }> = ({ label, value, change, positive }) => (
  <tr className="hover:bg-[var(--bg-secondary)]/40">
    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{label}</td>
    <td className="px-6 py-4 text-right font-black text-[var(--text-primary)]">{value}</td>
    <td className={`px-6 py-4 text-right font-bold text-xs ${positive ? 'text-green-500' : 'text-red-500'}`}>
      {change}
    </td>
  </tr>
);

export default AcademyReports;
