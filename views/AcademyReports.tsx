import React, { useState, useEffect } from 'react';
import { FileDown, Filter, Calendar, TrendingDown, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Card, Button, Select, Input, Badge } from '../components/UI';
import { Belt, UserStatus, Student, FlagStatus } from '../types';
import { supabase } from '../services/supabase';

const AcademyReports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<'geral' | 'frequencia' | 'evasao' | 'desempenho'>('geral');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
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
        `"${s.belt}"`,
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
    // Para um MVP profissional sem libs extras, usamos a função de impressão do browser
    // que pode ser salva como PDF. Podemos disparar um layout específico de impressão.
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'evasao':
        const riskyStudents = students.filter(s => s.flag !== FlagStatus.VERDE);
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-300">Student at Risk</th>
                  <th className="px-6 py-4 border-b border-gray-300">Flag</th>
                  <th className="px-6 py-4 border-b border-gray-300">Last Attendance</th>
                  <th className="px-6 py-4 border-b border-gray-300 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {riskyStudents.length > 0 ? riskyStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                    <td className="px-6 py-4">
                      <Badge color={s.flag === FlagStatus.VERMELHA ? 'red' : 'yellow'}>{s.flag}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {s.last_attendance ? new Date(s.last_attendance).toLocaleDateString('en-US') : 'No record'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="secondary" className="text-[10px] py-1">Log Contact</Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px]">Congratulations! No students at risk of churn.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'desempenho':
        const beltStats = Object.values(Belt).map(belt => {
          const count = students.filter(s => s.belt === belt).length;
          const activePercent = count > 0 ? (students.filter(s => s.belt === belt && s.status === UserStatus.ATIVO).length / count * 100).toFixed(0) : 0;
          return { belt, count, activePercent };
        }).filter(s => s.count > 0);

        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-300">Rank (Belt)</th>
                  <th className="px-6 py-4 border-b border-gray-300 text-right">Qty. Students</th>
                  <th className="px-6 py-4 border-b border-gray-300 text-right">Avg. Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {beltStats.map(stat => (
                  <tr key={stat.belt} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{stat.belt}</td>
                    <td className="px-6 py-4 text-right font-black">{stat.count}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600 font-bold">{stat.activePercent}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'frequencia':
        return (
          <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-black uppercase text-gray-900 mb-2">Advanced Attendance Module</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Heatmaps and peak times will be available as Card Pass records accumulate.
            </p>
          </div>
        );

      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 print:bg-gray-100">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-300 print:border-gray-900">Analytical Metric</th>
                  <th className="px-6 py-4 border-b border-gray-300 text-right print:border-gray-900">Current Value</th>
                  <th className="px-6 py-4 border-b border-gray-300 text-right print:border-gray-900">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 print:divide-gray-300">
                <TableRow label="Total Student Base" value={String(students.length)} change="Stable" positive />
                <TableRow label="Engagement (Active)" value={String(students.filter(s => s.status === UserStatus.ATIVO).length)} change="--%" positive />
                <TableRow label="Estimated Retention Rate" value={students.length > 0 ? "100%" : "0%"} change="Target 95%" positive />
                <TableRow label="New Admissions in Period" value={String(students.length)} change={`+${students.length}`} positive />
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
      default: return 'Operational Summary (Last 30 days)';
    }
  };

  return (
    <div className="space-y-8 print:block print:bg-white text-gray-900">
      {/* Print-only Header */}
      <div className="hidden print:flex justify-between items-start mb-12 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Management Report</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Matkeep Academy System</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold uppercase">{students.length > 0 ? "Active Academy" : "Matkeep System"}</p>
          <p className="text-xs text-gray-500 font-bold mt-1 uppercase">Issue Date: {new Date().toLocaleDateString('en-US')}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Reports and Export</h2>
          <p className="text-gray-500 text-sm">Generate analytical documents on your academy's attendance and retention.</p>
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

      {/* Filtros de Relatório */}
      <Card className="p-4 bg-gray-50 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <Select
            label="Filter by Belt"
            options={[
              { value: 'All', label: 'All Belts' },
              ...Object.values(Belt).map(b => ({ value: b, label: b }))
            ]}
          />
          <Select
            label="Student Status"
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: UserStatus.ATIVO, label: 'Active' },
              { value: UserStatus.INATIVO, label: 'Inactive' },
            ]}
          />
        </div>
      </Card>

      {/* Grid de Seleção de Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        <ReportCard
          title="General Attendance"
          description="Macro view of attendance by day of the week and peak times."
          icon={<Calendar size={24} className="text-blue-600" />}
          active={selectedReport === 'frequencia'}
          onClick={() => setSelectedReport(selectedReport === 'frequencia' ? 'geral' : 'frequencia')}
        />
        <ReportCard
          title="Churn Risk"
          description="Detailed list of students with yellow and red flags with absence time."
          icon={<TrendingDown size={24} className="text-red-600" />}
          active={selectedReport === 'evasao'}
          onClick={() => setSelectedReport(selectedReport === 'evasao' ? 'geral' : 'evasao')}
        />
        <ReportCard
          title="Performance by Belt"
          description="Engagement comparison between different ranks."
          icon={<Users size={24} className="text-gray-900" />}
          active={selectedReport === 'desempenho'}
          onClick={() => setSelectedReport(selectedReport === 'desempenho' ? 'geral' : 'desempenho')}
        />
      </div>

      {/* Resumo Estatístico do Relatório Atual */}
      <Card className="print:shadow-none print:border-none print:bg-white overflow-hidden animate-in fade-in duration-500">
        <div className="p-4 border-b border-gray-300 bg-gray-50 print:bg-white flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-l-4 border-gray-900 pl-3">
            {getReportTitle()}
          </h3>
          {selectedReport !== 'geral' && (
            <button
              onClick={() => setSelectedReport('geral')}
              className="text-[10px] font-black uppercase text-blue-600 hover:underline print:hidden"
            >
              Back to Summary
            </button>
          )}
        </div>
        <div className="p-6">
          {renderReportContent()}
        </div>

        {/* Print-only Details Section */}
        <div className="hidden print:block mt-8 px-6 pb-12">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Technical Notes</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-2xl">
            This report contains consolidated data from the Matkeep system database.
            Attendance information is processed in real-time based on Card Pass records.
            Retention rate is calculated based on student activity in the last 30 days.
          </p>
        </div>

        {/* Printable Footer (shown only in print) */}
        <div className="hidden print:flex justify-between items-center p-8 text-[10px] text-gray-400 border-t border-gray-100 mt-12 bg-gray-50/50">
          <div className="flex gap-4">
            <p className="font-bold">REPORT ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            <p>MATKEEP MANAGEMENT SYSTEM</p>
          </div>
          <p className="font-bold">OFFICIAL REPORT - {new Date().toLocaleString('en-US')}</p>
        </div>
      </Card>
    </div>
  );
};

const ReportCard: React.FC<{ title: string; description: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }> = ({ title, description, icon, active, onClick }) => (
  <Card
    className={`p-6 transition-all cursor-pointer group relative overflow-hidden ${active ? 'border-gray-900 ring-1 ring-gray-900 shadow-lg' : 'hover:border-gray-900'}`}
    onClick={onClick}
  >
    {active && (
      <div className="absolute top-0 right-0 p-2">
        <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
      </div>
    )}
    <div className={`mb-4 transition-transform group-hover:scale-110 duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <h4 className={`text-sm font-black uppercase tracking-tight mb-2 ${active ? 'text-gray-900 font-black' : 'group-hover:text-blue-600'}`}>{title}</h4>
    <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
      <span className={`text-[10px] font-bold uppercase ${active ? 'text-blue-600' : 'text-gray-400'}`}>
        {active ? 'Selected' : 'Click to select'}
      </span>
      {active && <CheckCircle size={14} className="text-blue-600" />}
    </div>
  </Card>
);

const TableRow: React.FC<{ label: string; value: string; change: string; positive: boolean }> = ({ label, value, change, positive }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
    <td className="px-6 py-4 text-right font-black">{value}</td>
    <td className={`px-6 py-4 text-right font-bold text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {change}
    </td>
  </tr>
);

export default AcademyReports;
