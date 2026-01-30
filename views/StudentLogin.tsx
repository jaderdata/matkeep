import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2, User, ChevronRight, Eye, EyeOff, Building2, MapPin, ArrowLeft, Lock } from 'lucide-react';
import { PWAManager } from '../components/PWAManager';

interface MatchingStudent {
    id: string;
    academy_id: string;
    academy_name?: string;
    academy_logo?: string;
    academy_address?: string;
}

type LoginStep = 'identify' | 'select_academy' | 'password';

const StudentLogin: React.FC = () => {
    const [step, setStep] = useState<LoginStep>('identify');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchingStudents, setMatchingStudents] = useState<MatchingStudent[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<MatchingStudent | null>(null);
    const navigate = useNavigate();

    const handleIdentify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const cleanIdentifier = identifier.trim();
            let query = supabase.from('students').select('id, academy_id');

            if (cleanIdentifier.includes('@')) {
                query = query.ilike('email', cleanIdentifier);
            } else {
                query = query.or(`card_pass_code.ilike.${cleanIdentifier}, internal_id.ilike.${cleanIdentifier} `);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setError('Student not found. Please check your email or ID.');
                setLoading(false);
                return;
            }

            // Buscar detalhes das academias
            const academyIds = data.map(s => s.academy_id).filter(Boolean);
            const { data: academies } = await supabase
                .from('academies')
                .select('id, name, logo_url, address')
                .in('id', academyIds);

            const enrichedStudents = data.map(student => {
                const academy = academies?.find(a => a.id === student.academy_id);
                return {
                    ...student,
                    academy_name: academy?.name || 'Academy',
                    academy_logo: academy?.logo_url,
                    academy_address: academy?.address
                };
            });

            setMatchingStudents(enrichedStudents);

            if (enrichedStudents.length === 1) {
                setSelectedStudent(enrichedStudents[0]);
                setStep('password');
            } else {
                setStep('select_academy');
            }
        } catch (err: any) {
            console.error('Erro ao identificar aluno:', err);
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !password) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: loginError } = await supabase
                .from('students')
                .select('id, password')
                .eq('id', selectedStudent.id)
                .single();

            if (loginError) throw loginError;

            if (data.password !== password) {
                setError('Invalid password. Please try again.');
                setLoading(false);
                return;
            }

            // Login bem sucedido
            localStorage.setItem('current_student_id', data.id);
            localStorage.setItem('student_session_key', btoa(data.password || '').substring(0, 10));
            navigate('/student/dashboard');

        } catch (err: any) {
            console.error('Erro no login:', err);
            setError('Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep('identify');
        setPassword('');
        setError(null);
        setSelectedStudent(null);
    };

    const renderHeader = () => {
        let title = "Student Portal";
        let subtitle = "Exclusive Access";
        let icon = <span className="text-white font-black text-2xl italic">M</span>;

        if (step === 'select_academy') {
            title = "Choose Academy";
            subtitle = "Multiple registrations found";
            icon = <Building2 className="text-white" size={24} />;
        } else if (step === 'password') {
            title = "Access Security";
            subtitle = `Logging into ${selectedStudent?.academy_name} `;
            icon = <Lock className="text-white" size={24} />;
        }

        return (
            <div className="p-8 pb-0 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                    {selectedStudent?.academy_logo && step === 'password' ? (
                        <img src={selectedStudent.academy_logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : icon}
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">
                    {title}
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                    {subtitle}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
            <PWAManager academy={null} />
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                {renderHeader()}

                <div className="p-8 pt-4">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 text-center animate-in shake duration-500">
                            <p className="text-xs font-black text-red-500 uppercase tracking-wide">{error}</p>
                        </div>
                    )}

                    {step === 'identify' && (
                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Email or Access Code
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <User className="text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Enter your email or ID..."
                                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 placeholder:text-gray-300 transition-all text-sm"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !identifier}
                                className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <>Next <ChevronRight size={20} /></>}
                            </button>
                        </form>
                    )}

                    {step === 'select_academy' && (
                        <div className="space-y-3">
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {matchingStudents.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setStep('password');
                                        }}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 hover:border-gray-900 bg-gray-50 hover:bg-white transition-all text-left flex items-center gap-4 group active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                            {student.academy_logo ? (
                                                <img src={student.academy_logo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 className="text-gray-300" size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate uppercase leading-tight">
                                                {student.academy_name}
                                            </p>
                                            {student.academy_address && (
                                                <p className="text-[9px] font-bold text-gray-400 uppercase truncate mt-1 flex items-center gap-1">
                                                    <MapPin size={8} />
                                                    {student.academy_address}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-gray-900 transition-colors" size={20} />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={resetFlow}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                        </div>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Account Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Lock className="text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password..."
                                        className="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 placeholder:text-gray-300 transition-all text-sm"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-900 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : 'Login Portal'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFlow}
                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Change Account
                                </button>
                            </div>
                        </form>
                    )}
                </div>


            </div>
        </div>
    );
};

export default StudentLogin;
