
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, MessageCircle, Phone, Mail, User, Activity, Trash2, Lock, Check, Calendar, Image } from 'lucide-react';
import { Card, Input, Button, Badge, Select } from '../components/UI';
import { FlagStatus, Belt, UserStatus, Student } from '../types';
import { supabase } from '../services/supabase';
import { attendanceService } from '../services/attendanceService';
import { Loader2, CreditCard, Hash, FileDown, ExternalLink } from 'lucide-react';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image'; // Replaced html2canvas for better modern CSS support
import { formatUSPhone } from '../utils';
import { StudentDocuments } from '../components/StudentDocuments';

import { useAcademy } from '../contexts/AcademyContext';

import { useStudents } from '../hooks/useQueries';
import { toast } from 'sonner';

const StudentManagement: React.FC = () => {
  const { academy, academyId, loading: academyLoading } = useAcademy();
  const { data: studentsData = [], isLoading: studentsLoading, refetch: refetchStudents } = useStudents(academyId);
  const students = studentsData;
  const loading = academyLoading || studentsLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelt, setFilterBelt] = useState('All');
  const [filterFlag, setFilterFlag] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    belt: Belt.BRANCA,
    degrees: 0
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    belt: Belt.BRANCA,
    degrees: 0,
    internal_id: '',
    card_pass_code: ''
  });

  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Photo Viewer Modal State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedStudentForPhoto, setSelectedStudentForPhoto] = useState<Student | null>(null);

  // Card Pass Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [downloadingCard, setDownloadingCard] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as HTMLElement).closest('.relative')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyId) return;

    setSaving(true);
    try {
      // 1. Check Global Email Uniqueness via RPC
      if (newStudent.email) {
        const { data: emailExists, error: rpcError } = await supabase
          .rpc('check_email_exists_global', { p_email: newStudent.email });

        if (rpcError) throw rpcError;

        if (emailExists) {
          toast.error('This email is already registered in the system (possibly in another academy). Global uniqueness is enforced.');
          setSaving(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...newStudent,
          academy_id: academyId,
          status: UserStatus.ATIVO,
          flag: FlagStatus.VERDE,
          card_pass_code: 'MK-' + Math.floor(10000000 + Math.random() * 90000000).toString()
        }])
        .select()
        .single();

      if (error) throw error;

      const seqCode = data.internal_id
        ? (10000000 + Number(data.internal_id)).toString()
        : Math.floor(1000000000 + Math.random() * 9000000000).toString();

      const { error: updateError } = await supabase
        .from('students')
        .update({ card_pass_code: seqCode })
        .eq('id', data.id);

      if (updateError) throw updateError;

      toast.success('Student registered successfully!');
      refetchStudents();
      setShowAddModal(false);
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        birth_date: '',
        belt: Belt.BRANCA,
        degrees: 0
      });
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error('Error registering student: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone,
      birth_date: student.birth_date || '',
      belt: student.belt,
      degrees: student.degrees,
      internal_id: String(student.internal_id || ''),
      card_pass_code: student.card_pass_code || ''
    });
    setShowEditModal(true);
    setActiveTab('details');
    setActiveMenuId(null);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          birth_date: editForm.birth_date,
          belt: editForm.belt,
          degrees: editForm.degrees,
          // card_pass_code: editForm.card_pass_code // Prevent editing if requested, or keep it?
          // User said "I don't want student to edit". 
          // Assuming we keep it editable by admin but generated automatically. 
          // User request "system registers sequential id".
          // I will keep it in the update payload for valid admin overwrites, but make the UI read-only by default or implied.
          // Re-reading: "vincule ao aluno e salve no banco" -> automatic.
          // The request implies the SYSTEM does it.
          // I'll leave the update here just in case, but rely on the insert logic for the sequence.
        })
        .eq('id', selectedStudent.id)
        .select()
        .single();


      if (error) throw error;

      toast.success('Student updated successfully!');
      refetchStudents();
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Error updating student:', err);
      toast.error('Error updating student: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

    try {
      // 1. Delete associated attendance records (Fix for Foreign Key Constraint)
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('student_id', studentId);

      if (attendanceError) {
        console.warn('Error deleting attendance records:', attendanceError);
      }

      // 2. Delete the student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      toast.success('Student deleted successfully!');
      refetchStudents();
      setActiveMenuId(null);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      toast.error('Error deleting student: ' + err.message);
    }
  };

  const handleOpenResetModal = (student: Student) => {
    setSelectedStudent(student);
    setNewPassword('123456'); // Default password as per user request
    setShowResetModal(true);
    setActiveMenuId(null);
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ password: newPassword })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast.success(`Password successfully changed to: ${newPassword}`);
      setShowResetModal(false);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error('Error changing password: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === UserStatus.ATIVO ? UserStatus.INATIVO : UserStatus.ATIVO;
    try {
      const { data, error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', student.id)
        .select()
        .single();

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
      refetchStudents();
      setActiveMenuId(null);
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error('Error changing status: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Belt', 'Degrees', 'Status', 'Flag', 'Last Attendance', 'Internal ID'];
    const csvContent = [
      headers.join(','),
      ...students.map(s => [
        `"${s.name}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${translateBelt(s.belt)}"`,
        s.degrees,
        `"${s.status}"`,
        `"${translateFlag(s.flag)}"`,
        `"${s.last_attendance ? new Date(s.last_attendance).toLocaleDateString() : 'Never'}"`,
        `"${s.internal_id || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `matkeep_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewCard = (student: Student) => {
    setSelectedStudentForCard(student);
    setShowCardModal(true);
    setActiveMenuId(null);
  };

  const handleDownloadCard = async () => {
    if (!selectedStudentForCard) return;
    setDownloadingCard(true);
    try {
      const cardElement = document.getElementById(`digital-pass-${selectedStudentForCard.id}`);
      if (!cardElement) throw new Error("Card element not found");

      // Use html-to-image's toPng for better support of modern CSS (like oklch)
      const dataUrl = await toPng(cardElement, {
        cacheBust: true,
        style: { transform: 'scale(1)' } // Reset any transforms
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `digital-pass-${selectedStudentForCard.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
      toast.success("Card downloaded successfully!");
    } catch (err) {
      console.error("Error downloading card:", err);
      toast.error("Failed to download card.");
    } finally {
      setDownloadingCard(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    const matchesBelt = filterBelt === 'All' || s.belt === filterBelt;
    const matchesFlag = filterFlag === 'All' || s.flag === filterFlag;
    return matchesSearch && matchesBelt && matchesFlag;
  });

  if (loading || academyLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Student Management</h2>
          <p className="text-gray-500 text-sm">View and manage all students linked to your academy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2" onClick={handleExportCSV}>
            <FileDown size={18} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-[var(--bg-secondary)]/30 border-none shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-6 relative group">
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 block">Search Students</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--text-primary)] transition-ui" size={16} />
              <input
                placeholder="Name, email or phone..."
                className="pl-10 p-3 h-[46px] border border-[var(--border-color)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]/20 rounded-none w-full transition-ui placeholder:text-[var(--text-secondary)] shadow-sm text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Select
              label="Belt Rank"
              options={[
                { value: 'All', label: 'All Belts' },
                ...Object.values(Belt).map(b => ({ value: b, label: b }))
              ]}
              value={filterBelt}
              onChange={e => setFilterBelt(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              label="Activity Flag"
              options={[
                { value: 'All', label: 'All Colors' },
                { value: FlagStatus.VERDE, label: 'Green' },
                { value: FlagStatus.AMARELA, label: 'Yellow' },
                { value: FlagStatus.VERMELHA, label: 'Red' },
              ]}
              value={filterFlag}
              onChange={e => setFilterFlag(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto min-h-[600px] pb-64">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-secondary)] text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Belt</th>
                <th className="px-6 py-4 text-center">Degrees</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Flag</th>
                <th className="px-6 py-4 text-center">Last Attendance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--text-primary)]">{student.name}</span>
                      <div className="flex gap-2 text-[10px] uppercase font-black tracking-tighter text-[var(--text-secondary)]">
                        <span>{student.phone}</span>
                        {student.internal_id && <span className="text-[var(--accent-primary)]">#{student.internal_id}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 font-bold text-[10px] uppercase border ${getBeltColor(student.belt)}`}>
                      {translateBelt(student.belt)} Belt
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-[var(--text-primary)]">{student.degrees}</td>
                  <td className="px-6 py-4">
                    <Badge color={student.status === UserStatus.ATIVO ? 'green' : 'gray'}>{student.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${getFlagColor(student.flag)}`}></div>
                      <span className="text-[10px] font-bold uppercase">{translateFlag(student.flag)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                    {student.last_attendance ? new Date(student.last_attendance).toLocaleDateString('en-US') : 'No record'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 relative">
                      {student.phone && (
                        <a
                          href={`https://wa.me/${student.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 border border-[var(--border-color)] hover:bg-green-500/10 text-green-500 transition-colors"
                          title="Send WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                      {student.flag !== FlagStatus.VERDE && (
                        <button className="p-1.5 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]" title="Mark Contact Made">
                          <MessageCircle size={14} className="text-blue-500" />
                        </button>
                      )}
                      <button
                        className="p-1.5 border border-gray-300 hover:bg-gray-100"
                        title="View Attendance History"
                        onClick={() => {
                          setSelectedStudentForHistory(student);
                          setShowHistoryModal(true);
                          setLoadingHistory(true);
                          attendanceService.getHistory(student.id).then(history => {
                            setHistoryData(history);
                            setLoadingHistory(false);
                          });
                        }}
                      >
                        <Calendar size={14} className="text-gray-600" />
                      </button>
                      <div className="relative">
                        <button
                          className={`p-1.5 border transition-all ${activeMenuId === student.id ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-primary)]' : 'border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                          onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {activeMenuId === student.id && (
                          <div className="absolute right-0 mt-3 w-56 bg-[var(--bg-card)] shadow-2xl z-50 border border-[var(--border-color)] rounded-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Student Options</p>
                            </div>
                            <div className="p-1">
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-[var(--bg-secondary)] flex items-center gap-3 text-[var(--text-primary)] transition-all group"
                                onClick={() => handleEdit(student)}
                              >
                                <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                  <User size={14} />
                                </div>
                                Edit Student
                              </button>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 flex items-center gap-3 text-gray-700 rounded-md transition-all group"
                                onClick={() => handleViewCard(student)}
                              >
                                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                  <CreditCard size={14} />
                                </div>
                                View Digital Pass
                              </button>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 flex items-center gap-3 text-gray-700 rounded-md transition-all group"
                                onClick={() => {
                                  setSelectedStudentForPhoto(student);
                                  setShowPhotoModal(true);
                                  setActiveMenuId(null);
                                }}
                              >
                                <div className="w-7 h-7 bg-purple-50 text-purple-600 flex items-center justify-center rounded transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                  <Image size={14} />
                                </div>
                                View Photo
                              </button>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 flex items-center gap-3 text-gray-700 rounded-md transition-all group"
                                onClick={() => handleToggleStatus(student)}
                              >
                                <div className="w-7 h-7 bg-gray-100 text-gray-600 flex items-center justify-center rounded transition-colors group-hover:bg-gray-900 group-hover:text-white">
                                  <Activity size={14} />
                                </div>
                                {student.status === UserStatus.ATIVO ? 'Deactivate Record' : 'Activate Record'}
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-black uppercase hover:bg-red-50 text-red-600 flex items-center gap-3 rounded-md transition-all group"
                                onClick={() => handleDelete(student.id)}
                              >
                                <div className="w-7 h-7 bg-red-50 text-red-600 flex items-center justify-center rounded transition-colors group-hover:bg-red-600 group-hover:text-white">
                                  <Trash2 size={14} />
                                </div>
                                Delete Student
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-amber-50 flex items-center gap-3 text-amber-700 rounded-md transition-all group"
                                onClick={() => handleOpenResetModal(student)}
                              >
                                <div className="w-7 h-7 bg-amber-50 text-amber-600 flex items-center justify-center rounded transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                  <Lock size={14} />
                                </div>
                                Reset Password
                              </button>
                              <div className="border-t border-[var(--border-color)] my-1"></div>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-[var(--accent-primary)]/10 flex items-center gap-3 text-[var(--text-primary)] transition-all group"
                                onClick={async () => {
                                  if (confirm(`Confirm manual attendance for ${student.name}?`)) {
                                    const res = await attendanceService.manualAttendance(student.id);
                                    if (res.success) {
                                      toast.success(res.message);
                                      refetchStudents();
                                    } else {
                                      toast.error(res.message);
                                    }
                                  }
                                  setActiveMenuId(null);
                                }}
                              >
                                <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                  <Check size={14} />
                                </div>
                                Mark Attendance
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 flex items-center gap-3 text-gray-700 rounded-md transition-all group"
                                onClick={async () => {
                                  setSelectedStudentForHistory(student);
                                  setShowHistoryModal(true);
                                  setLoadingHistory(true);
                                  const history = await attendanceService.getHistory(student.id);
                                  setHistoryData(history);
                                  setLoadingHistory(false);
                                  setActiveMenuId(null);
                                }}
                              >
                                <div className="w-7 h-7 bg-gray-50 text-gray-600 flex items-center justify-center rounded transition-colors group-hover:bg-gray-600 group-hover:text-white">
                                  <Calendar size={14} />
                                </div>
                                View History
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-gray-500 uppercase font-black text-xs opacity-50">
            No students found.
          </div>
        )}
      </Card>

      {/* Cadastro Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50">
                <h3 className="text-sm font-black uppercase tracking-widest">Register New Student</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Full Name"
                      required
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    autoComplete="new-password"
                  />
                  <Input
                    label="Phone / WhatsApp"
                    placeholder="(000) 000-0000"
                    required
                    value={newStudent.phone}
                    onChange={e => setNewStudent({ ...newStudent, phone: formatUSPhone(e.target.value) })}
                    autoComplete="new-password"
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    required
                    value={newStudent.birth_date}
                    onChange={e => setNewStudent({ ...newStudent, birth_date: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Belt"
                      options={Object.values(Belt).map(b => ({ value: b, label: b }))}
                      value={newStudent.belt}
                      onChange={e => setNewStudent({ ...newStudent, belt: e.target.value as Belt })}
                    />
                    <Select
                      label="Degrees"
                      options={[0, 1, 2, 3, 4].map(g => ({ value: String(g), label: String(g) }))}
                      value={String(newStudent.degrees)}
                      onChange={e => setNewStudent({ ...newStudent, degrees: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-[var(--border-color)]">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-2 inline" size={18} /> : null}
                    {saving ? 'Registering...' : 'Finalize Registration'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )
      }

      {/* Edição Modal */}
      {
        showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Edit Student</h3>
                <button onClick={() => setShowEditModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
              </div>

              <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <button
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'details' ? 'border-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-secondary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'documents' ? 'border-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-secondary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents
                </button>
              </div>

              {activeTab === 'details' ? (
                <form onSubmit={handleUpdateStudent} className="p-6 space-y-4" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Full Name"
                        required
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                    <Input
                      label="Email"
                      type="email"
                      required
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      autoComplete="new-password"
                    />
                    <Input
                      label="Phone / WhatsApp"
                      placeholder="(000) 000-0000"
                      required
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: formatUSPhone(e.target.value) })}
                      autoComplete="new-password"
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      required
                      value={editForm.birth_date}
                      onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        label="Belt"
                        options={Object.values(Belt).map(b => ({ value: b, label: b }))}
                        value={editForm.belt}
                        onChange={e => setEditForm({ ...editForm, belt: e.target.value as Belt })}
                      />
                      <Select
                        label="Degrees"
                        options={[0, 1, 2, 3, 4].map(g => ({ value: String(g), label: String(g) }))}
                        value={String(editForm.degrees)}
                        onChange={e => setEditForm({ ...editForm, degrees: Number(e.target.value) })}
                      />
                    </div>
                    <div className="md:col-span-2 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-4">
                      <div className="w-full flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Hash size={16} className="text-gray-400" />
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Sequential ID</span>
                        </div>
                        <span className="font-black text-gray-900 text-sm">
                          {editForm.internal_id || '---'}
                        </span>
                      </div>

                      <div className="w-full">
                        <Input
                          label="Card Pass / Barcode (Auto-Generated)"
                          value={editForm.card_pass_code}
                          onChange={e => setEditForm({ ...editForm, card_pass_code: e.target.value })}
                          placeholder="Scan or type code..."
                          disabled
                        />
                      </div>

                      <div className="bg-white p-4 rounded shadow-sm">
                        <Barcode
                          value={editForm.card_pass_code || '000000'}
                          width={1.5}
                          height={50}
                          fontSize={12}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving ? <Loader2 className="animate-spin mr-2 inline" size={18} /> : null}
                      {saving ? 'Updating...' : 'Save Changes'}
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-6">
                  <StudentDocuments studentId={selectedStudent?.id || ''} academyId={academyId || ''} />
                </div>
              )}
            </Card>
          </div >
        )
      }

      {/* Password Reset Modal */}
      {
        showResetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl">
              <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest">Reset Password</h3>
                <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
              </div>
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                {resetSuccess ? (
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center animate-in zoom-in duration-300">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="text-white" size={24} strokeWidth={3} />
                    </div>
                    <p className="text-sm font-black text-green-800 uppercase tracking-tight mb-2">Success!</p>
                    <p className="text-xs text-green-600 font-bold uppercase">{resetSuccess}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 mb-2">
                      <Lock size={14} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">
                        Default password set to 123456 for convenience. You can change it below if needed.
                      </p>
                    </div>
                    <Input
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1" disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Reset'}
                      </Button>
                      <Button variant="secondary" type="button" onClick={() => setShowResetModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Card>
          </div>
        )
      }

      {/* History Modal */}
      {
        showHistoryModal && selectedStudentForHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)] shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Attendance History</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-bold">{selectedStudentForHistory.name}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl">&times;</button>
              </div>

              <div className="p-0 overflow-y-auto flex-1">
                {loadingHistory ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : historyData.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase">No records found.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg-secondary)] sticky top-0">
                      <tr>
                        <th className="p-3 text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                        <th className="p-3 text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {historyData.map((record) => {
                        const date = new Date(record.timestamp);
                        return (
                          <tr key={record.id} className="hover:bg-[var(--bg-secondary)]">
                            <td className="p-3 text-[var(--text-primary)] font-medium">
                              {date.toLocaleDateString('en-US')}
                            </td>
                            <td className="p-3 text-[var(--text-secondary)] font-mono text-xs">
                              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0 text-center">
                <Button variant="secondary" onClick={() => setShowHistoryModal(false)} className="w-full">Close</Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Photo Viewer Modal */}
      {
        showPhotoModal && selectedStudentForPhoto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)] shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Student Photo</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-bold">{selectedStudentForPhoto.name}</p>
                </div>
                <button onClick={() => setShowPhotoModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl">&times;</button>
              </div>

              <div className="p-4 bg-gray-50 flex items-center justify-center flex-1 min-h-0 overflow-hidden">
                {selectedStudentForPhoto.photo_url ? (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <img
                      src={selectedStudentForPhoto.photo_url}
                      alt={`${selectedStudentForPhoto.name}'s photo`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg border-4 border-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3EPhoto not available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={64} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No photo available</p>
                    <p className="text-gray-400 text-xs">This student hasn't uploaded a profile photo yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center shrink-0">
                <Button variant="secondary" onClick={() => setShowPhotoModal(false)} className="w-full">Close</Button>
              </div>
            </Card>
          </div>
        )
      }
      {
        showCardModal && selectedStudentForCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowCardModal(false)}>
            <div className="w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>

              {/* Card Container - Reused from StudentPortal */}
              <div
                id={`digital-pass-${selectedStudentForCard.id}`}
                className="relative overflow-hidden bg-[#1a1b2e] text-white shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(79,70,229,0.3)]"
                style={{
                  borderRadius: '2.5rem',
                  aspectRatio: '0.62', // Card aspect ratio
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Top Arc Decoration */}
                <div className="absolute -top-[15%] -left-[10%] w-[120%] h-[35%] bg-indigo-600 rounded-[50%] opacity-20 blur-2xl" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full opacity-10 blur-3xl" />

                <div className="flex-1 flex flex-col items-center pt-10 px-6 relative z-10">
                  {/* Logo / Brand */}
                  <div style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.5 }}>
                    {academy?.logoUrl ?
                      <img src={academy.logoUrl} className="w-8 h-8 opacity-50 grayscale" alt="" /> :
                      <div className="text-[10px] font-black tracking-widest uppercase">MK</div>
                    }
                  </div>

                  {/* Photo Ring */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 p-1 relative z-10 bg-[#1a1b2e]">
                      <img
                        src={selectedStudentForCard.photo_url || `https://ui-avatars.com/api/?name=${selectedStudentForCard.name}&background=1e1b4b&color=818cf8`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-center leading-none mb-1">
                    {selectedStudentForCard.name}
                  </h2>
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-8">
                    Student
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-8 w-full mb-8">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">ID Number</p>
                      <p className="text-sm font-mono font-bold">#{selectedStudentForCard.internal_id || '---'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Affiliation</p>
                      <p className="text-xs font-black uppercase tracking-tight leading-tight">{academy?.name || 'Academy'}</p>
                    </div>
                  </div>

                  {/* Barcode Section */}
                  <div className="mt-auto w-full pb-8 px-4">
                    <div className="bg-white rounded-3xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
                      <div className="transform scale-x-110 origin-center">
                        <Barcode
                          value={String(selectedStudentForCard.card_pass_code || selectedStudentForCard.internal_id || '000000')}
                          width={2.2}
                          height={70}
                          displayValue={false}
                          margin={0}
                          background="#ffffff"
                        />
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-2 tracking-widest">
                        {selectedStudentForCard.card_pass_code || selectedStudentForCard.internal_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadCard}
                  disabled={downloadingCard}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {downloadingCard ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                  Download / Save
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

const translateBelt = (belt: string) => {
  const b = String(belt).toLowerCase();
  if (b.includes('branca') || b.includes('white')) return 'White';
  if (b.includes('cinza') || b.includes('gray')) {
    if (b.includes('branca') || b.includes('white')) return 'Gray and White';
    if (b.includes('preta') || b.includes('black')) return 'Gray and Black';
    return 'Gray';
  }
  if (b.includes('amarela') || b.includes('yellow')) {
    if (b.includes('branca') || b.includes('white')) return 'Yellow and White';
    if (b.includes('preta') || b.includes('black')) return 'Yellow and Black';
    return 'Yellow';
  }
  if (b.includes('laranja') || b.includes('orange')) {
    if (b.includes('branca') || b.includes('white')) return 'Orange and White';
    if (b.includes('preta') || b.includes('black')) return 'Orange and Black';
    return 'Orange';
  }
  if (b.includes('verde') || b.includes('green')) {
    if (b.includes('branca') || b.includes('white')) return 'Green and White';
    if (b.includes('preta') || b.includes('black')) return 'Green and Black';
    return 'Green';
  }
  if (b.includes('azul') || b.includes('blue')) return 'Blue';
  if (b.includes('roxa') || b.includes('purple')) return 'Purple';
  if (b.includes('marrom') || b.includes('brown')) return 'Brown';
  if (b.includes('preta') || b.includes('black')) return 'Black';
  if (b.includes('vermelha') || b.includes('red')) {
    if (b.includes('preta') || b.includes('black')) return 'Red and Black (7th Degree)';
    if (b.includes('branca') || b.includes('white')) return 'Red and White (8th Degree)';
    return 'Red (9th and 10th Degrees)';
  }
  return belt;
};

const translateFlag = (flag: string) => {
  const f = String(flag).toLowerCase();
  if (f === 'verde' || f === 'green') return 'Green';
  if (f === 'amarela' || f === 'yellow') return 'Yellow';
  if (f === 'vermelha' || f === 'red') return 'Red';
  return flag;
};

const getBeltColor = (belt: string) => {
  const b = String(belt).toLowerCase();

  if ((b.includes('white') || b.includes('branca')) && !b.includes(' ') && !b.includes('e')) return 'bg-white border-gray-300 text-gray-900';
  if (b.includes('gray') || b.includes('cinza')) return 'bg-slate-400 border-slate-500 text-white';
  if (b.includes('yellow') || b.includes('amarela')) return 'bg-yellow-400 border-yellow-500 text-black';
  if (b.includes('orange') || b.includes('laranja')) return 'bg-orange-500 border-orange-600 text-white';
  if ((b.includes('green') || b.includes('verde')) && !b.includes('blue') && !b.includes('azul')) return 'bg-green-600 border-green-700 text-white';
  if (b.includes('blue') || b.includes('azul')) return 'bg-blue-600 border-blue-700 text-white';
  if (b.includes('purple') || b.includes('roxa')) return 'bg-purple-700 border-purple-800 text-white';
  if (b.includes('brown') || b.includes('marrom')) return 'bg-amber-900 border-amber-950 text-white';
  if ((b.includes('black') || b.includes('preta')) && !b.includes('red') && !b.includes('vermelha') && !b.includes('gray') && !b.includes('cinza')) return 'bg-black border-gray-900 text-white';
  if (b.includes('red') || b.includes('vermelha')) return 'bg-red-600 border-red-700 text-white';

  return 'bg-gray-100 text-gray-900';
};

const getFlagColor = (flag: string) => {
  const f = String(flag).toLowerCase();
  if (f === 'verde' || f === 'green') return 'bg-green-500';
  if (f === 'amarela' || f === 'yellow') return 'bg-yellow-500';
  if (f === 'vermelha' || f === 'red') return 'bg-red-500';
  return 'bg-gray-500';
};

export default StudentManagement;
