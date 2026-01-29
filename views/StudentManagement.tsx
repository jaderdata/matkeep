
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, MessageCircle, Phone, Mail, User, Activity, Trash2, Lock, Check, Calendar } from 'lucide-react';
import { Card, Input, Button, Badge, Select } from '../components/UI';
import { FlagStatus, Belt, UserStatus, Student } from '../types';
import { supabase } from '../services/supabase';
import { attendanceService } from '../services/attendanceService';
import { Loader2, CreditCard, Hash } from 'lucide-react';
import Barcode from 'react-barcode';
import { formatUSPhone } from '../utils';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelt, setFilterBelt] = useState('All');
  const [filterFlag, setFilterFlag] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  React.useEffect(() => {
    const initialize = async () => {
      // Tenta buscar a primeira academia disponível
      const { data: acaData } = await supabase.from('academies').select('id').limit(1).maybeSingle();
      if (acaData) {
        setAcademyId(acaData.id);
        fetchStudents(acaData.id);
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as HTMLElement).closest('.relative')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const fetchStudents = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('academy_id', id);

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyId) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...newStudent,
          academy_id: academyId,
          status: UserStatus.ATIVO,
          flag: FlagStatus.VERDE,
          card_pass_code: 'PENDING'
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate Sequential Code based on DB internal_id
      // Format: 10000000 + internal_id (e.g., 10000001, 10000002)
      const seqCode = data.internal_id
        ? (10000000 + Number(data.internal_id)).toString()
        : Math.floor(10000000 + Math.random() * 9000000).toString();

      const { data: finalData, error: updateError } = await supabase
        .from('students')
        .update({ card_pass_code: seqCode })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setStudents(prev => [finalData, ...prev]);
      setShowAddModal(false);
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        birth_date: '',
        belt: Belt.BRANCA,
        degrees: 0
      });
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Error registering student.');
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
      internal_id: student.internal_id || '',
      card_pass_code: student.card_pass_code || ''
    });
    setShowEditModal(true);
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

      setStudents(prev => prev.map(s => s.id === data.id ? data : s));
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Error updating student.');
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
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setActiveMenuId(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Error deleting student.');
    }
  };

  const handleOpenResetModal = (student: Student) => {
    setSelectedStudent(student);
    setNewPassword('mudar123'); // Default suggestions
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

      alert(`Password successfully changed to: ${newPassword}`);
      setShowResetModal(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Error changing password.');
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
      setStudents(prev => prev.map(s => s.id === data.id ? data : s));
      setActiveMenuId(null);
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Error changing status.');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchesBelt = filterBelt === 'All' || s.belt === filterBelt;
    const matchesFlag = filterFlag === 'All' || s.flag === filterFlag;
    return matchesSearch && matchesBelt && matchesFlag;
  });

  if (loading) {
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
        <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          <span>Register Student</span>
        </Button>
      </div>

      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Search Student"
              placeholder="Name, Phone or Card Pass..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            label="Filter by Belt"
            options={[
              { value: 'All', label: 'All Belts' },
              ...Object.values(Belt).map(b => ({ value: b, label: b }))
            ]}
            value={filterBelt}
            onChange={e => setFilterBelt(e.target.value)}
          />
          <Select
            label="Filter by Flag"
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
      </Card>

      <Card>
        <div className="overflow-x-auto min-h-[600px] pb-64">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-300">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Belt</th>
                <th className="px-6 py-4">Degrees</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Flag</th>
                <th className="px-6 py-4">Last Attendance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{student.name}</span>
                      <span className="text-xs text-gray-500">{student.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 font-bold text-[10px] uppercase border ${getBeltColor(student.belt)}`}>
                      {translateBelt(student.belt)} Belt
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">{student.degrees}</td>
                  <td className="px-6 py-4">
                    <Badge color={student.status === UserStatus.ATIVO ? 'green' : 'gray'}>{student.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${getFlagColor(student.flag)}`}></div>
                      <span className="text-[10px] font-bold uppercase">{translateFlag(student.flag)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">
                    {student.last_attendance ? new Date(student.last_attendance).toLocaleDateString('en-US') : 'No record'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 relative">
                      {student.flag !== FlagStatus.VERDE && (
                        <button className="p-1.5 border border-gray-300 hover:bg-gray-100" title="Mark Contact Made">
                          <MessageCircle size={14} className="text-blue-600" />
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
                          className={`p-1.5 border transition-all ${activeMenuId === student.id ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300 hover:bg-gray-100'}`}
                          onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {activeMenuId === student.id && (
                          <div className="absolute right-0 mt-3 w-56 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 border border-gray-100 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Options</p>
                            </div>
                            <div className="p-1">
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 flex items-center gap-3 text-gray-700 rounded-md transition-all group"
                                onClick={() => handleEdit(student)}
                              >
                                <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                  <User size={14} />
                                </div>
                                Edit Student
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
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="w-full text-left px-3 py-2.5 text-xs font-bold uppercase hover:bg-blue-50 flex items-center gap-3 text-blue-700 rounded-md transition-all group"
                                onClick={async () => {
                                  if (confirm(`Confirm manual attendance for ${student.name}?`)) {
                                    const res = await attendanceService.manualAttendance(student.id);
                                    alert(res.message);
                                    if (res.success) fetchStudents(academyId); // Refresh to see updated timestamp if we displayed it
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
      {showAddModal && (
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
              <div className="flex gap-2 pt-4 border-t border-gray-100">
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
      )}

      {/* Edição Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black uppercase tracking-widest">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
            </div>
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
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Set a new password for this student.</p>
              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </form>
          </Card>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStudentForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Attendance History</h3>
                <p className="text-xs text-gray-500 font-bold">{selectedStudentForHistory.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-900 text-xl">&times;</button>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
              ) : historyData.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase">No records found.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="p-3 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.map((record) => {
                      const date = new Date(record.timestamp);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-700 font-medium">
                            {date.toLocaleDateString('en-US')}
                          </td>
                          <td className="p-3 text-gray-500 font-mono text-xs">
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 text-center">
              <Button variant="secondary" onClick={() => setShowHistoryModal(false)} className="w-full">Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
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
