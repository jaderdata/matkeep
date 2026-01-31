import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { checkRateLimit, recordAttempt, resetRateLimit, getAttemptCount } from '../services/rateLimitService';
import { Loader2, User, ChevronRight, Eye, EyeOff, Building2, MapPin, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
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

            // NEW: Check rate limit for this identifier
            const { isLimited, remainingTime } = checkRateLimit(cleanIdentifier);
            if (isLimited) {
                setError(`Too many attempts. Please wait ${remainingTime} seconds.`);
                setLoading(false);
                return;
            }

            // Use Secure RPC to identify student without public table access
            const { data, error: fetchError } = await supabase
                .rpc('identify_student', { p_identifier: cleanIdentifier });

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                // NEW: Record attempt
                recordAttempt(cleanIdentifier);
                const attempts = getAttemptCount(cleanIdentifier);
                const remaining = 3 - attempts;
                setError(`Student not found. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please try again later.'}`);
                setLoading(false);
                return;
            }

            // Map RPC result to component state
            const enrichedStudents: MatchingStudent[] = data.map((s: any) => ({
                id: s.student_id,
                academy_id: s.academy_id,
                academy_name: s.academy_name,
                academy_logo: s.logo_url,
                academy_address: s.academy_address
            }));

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
            // NEW: Check rate limit for this student ID
            const { isLimited, remainingTime } = checkRateLimit(`password_${selectedStudent.id}`);
            if (isLimited) {
                setError(`Too many incorrect attempts. Please wait ${remainingTime} seconds.`);
                setLoading(false);
                return;
            }

            const { data, error: loginError } = await supabase
                .from('students')
                .select('id, password, must_change_password, session_key, academy_id, email')
                .eq('id', selectedStudent.id)
                .single();

            if (loginError) throw loginError;

            if (data.password !== password) {
                // NEW: Record failed attempt
                recordAttempt(`password_${selectedStudent.id}`);
                const attempts = getAttemptCount(`password_${selectedStudent.id}`);
                const remaining = 3 - attempts;
                setError(`Invalid password. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please try again later.'}`);
                setLoading(false);
                return;
            }

            // NEW: Reset rate limit on successful login
            resetRateLimit(identifier);
            resetRateLimit(`password_${selectedStudent.id}`);

            // Login bem sucedido
            localStorage.setItem('matkeep_student_id', data.id);
            localStorage.setItem('matkeep_student_session_key', data.session_key || '');
            localStorage.setItem('matkeep_student_email', data.email || '');
            localStorage.setItem('matkeep_academy_id', data.academy_id);

            // NEW: If must_change_password, redirect to change password screen
            // This will be intercepted in StudentPortal.tsx
            if (data.must_change_password) {
                localStorage.setItem('matkeep_student_must_change_password', 'true');
            }

            navigate('/student/portal');

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
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 items-start animate-in shake duration-500">
                            <AlertCircle size={16} className="text-red-500 mt-1 shrink-0" />
                            <p className="text-xs font-bold text-red-600">{error}</p>
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
