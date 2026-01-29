
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input } from '../components/UI';
import { Loader2, QrCode, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { supabase } from '../services/supabase';
import { Student } from '../types';

const StudentCheckIn: React.FC = () => {
    const [code, setCode] = useState('');
    const [lastScannedCode, setLastScannedCode] = useState('');
    const [debugLog, setDebugLog] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('Waiting for card scan...');
    const [student, setStudent] = useState<Student | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Keep focus on input
    useEffect(() => {
        const focusInput = () => inputRef.current?.focus();
        focusInput();
        window.addEventListener('click', focusInput);
        return () => window.removeEventListener('click', focusInput);
    }, []);

    const resetState = () => {
        setStatus('idle');
        setMessage('Waiting for card scan...');
        setStudent(null);
        setCode('');
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!code) return;

            setLastScannedCode(code); // SAVE IT FOR DEBUGGING
            setStatus('loading');
            setMessage('Processing...');

            // Call Service
            const result = await attendanceService.registerAttendance(code);

            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setStudent(result.student || null);
                // Play Success Sound (Optional)
            } else {
                setStatus('error');
                setMessage(result.message);
                setStudent(result.student || null);
                runDiagnostics(); // Auto-run diagnostics on error
                // Play Error Sound (Optional)
            }

            // Auto Reset after 3 seconds
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(resetState, 4000);

            // Clear input logic handled by resetState but we want to clear immediately for next scan?
            // Usually scanner sends Code + Enter. 
            setCode('');
        }
    };

    const runDiagnostics = async () => {
        const codeToCheck = lastScannedCode || code || '1000001';
        let logs = [`Time: ${new Date().toLocaleTimeString()}`, `Checking for code: "${codeToCheck}"`];

        try {
            const { data, error } = await supabase.from('students').select('*').eq('card_pass_code', codeToCheck);

            let found = data?.length || 0;
            if (found === 0 && /^\d+$/.test(codeToCheck)) {
                const { data: byId } = await supabase.from('students').select('*').eq('internal_id', parseInt(codeToCheck));
                if (byId && byId.length > 0) {
                    logs.push(`Found match by internal_id: ${byId[0].name}`);
                    found = byId.length;
                }
            }

            if (error) logs.push(`Error: ${error.message}`);
            else logs.push(`Found ${found} students matching code.`);

            // Check top 5 regardless of code to verify RLS
            const { data: all, error: allError } = await supabase.from('students').select('id, name, card_pass_code').limit(5);
            if (allError) logs.push(`RLS Check Error: ${allError.message}`);
            else logs.push(`RLS Check: Visible students = ${all?.length || 0}. First: ${all?.[0]?.name} (${all?.[0]?.card_pass_code})`);

        } catch (e: any) {
            logs.push(`Exception: ${e.message}`);
        }
        setDebugLog(logs.join('\n'));
    };

    const navigate = useNavigate();

    const [showDebug, setShowDebug] = useState(false);

    const getBgColor = () => {
        switch (status) {
            case 'success': return 'bg-emerald-500';
            case 'error': return 'bg-rose-600';
            case 'loading': return 'bg-blue-600';
            default: return 'bg-gray-900'; // idle - Dark Theme
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-700 ease-in-out relative overflow-hidden ${getBgColor()}`}>

            {/* Background Texture */}
            <div className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-700 ${status === 'idle' ? 'opacity-20' : 'opacity-10'}`}
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Navigation / Exit */}
            <button
                onClick={() => navigate('/academy/dashboard')}
                className="fixed top-8 left-8 z-50 p-4 rounded-2xl bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Main Content Card */}
            <div className="w-full max-w-3xl relative z-10 flex flex-col items-center">

                {/* IDLE STATE */}
                {status === 'idle' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                        <div className="relative mb-12">
                            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse"></div>
                            <div className="relative w-48 h-48 bg-white/10 rounded-[3rem] flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
                                <QrCode size={80} className="text-white/80" />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg animate-bounce">
                                Ready to Scan
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-center leading-none mb-6">
                            Welcome Back
                        </h1>
                        <p className="text-gray-400 text-lg font-medium tracking-wide uppercase">
                            Please scan your consistency card
                        </p>
                    </div>
                )}

                {/* LOADING STATE */}
                {status === 'loading' && (
                    <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                        <Loader2 size={100} className="text-white animate-spin mb-8 opacity-80" />
                        <h2 className="text-4xl font-black text-white uppercase tracking-widest animate-pulse">Verifying Identity...</h2>
                    </div>
                )}

                {/* SUCCESS STATE */}
                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="w-48 h-48 rounded-full border-8 border-white/20 overflow-hidden bg-emerald-800 shadow-2xl relative">
                                {student?.photo_url ? (
                                    <img
                                        src={student.photo_url}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-emerald-200">
                                        <CheckCircle size={80} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-emerald-400 text-emerald-900 p-3 rounded-full shadow-lg border-4 border-emerald-500">
                                <CheckCircle size={32} strokeWidth={3} />
                            </div>
                        </div>

                        <h2 className="text-5xl font-black text-white uppercase tracking-tight leading-none mb-2 drop-shadow-lg">
                            {student?.name?.split(' ')[0]}
                        </h2>
                        {student?.name?.split(' ').length > 1 && (
                            <h3 className="text-2xl font-bold text-emerald-100 uppercase tracking-widest mb-6 opacity-80">
                                {student?.name?.split(' ').slice(1).join(' ')}
                            </h3>
                        )}

                        <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30">
                            <p className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                                Attendance Confirmed
                            </p>
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center max-w-xl">
                        <div className="w-40 h-40 bg-rose-800/50 rounded-full flex items-center justify-center mb-8 border-4 border-rose-400/30">
                            <XCircle size={80} className="text-white" />
                        </div>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tight mb-4">Access Denied</h2>
                        <p className="text-xl font-bold text-rose-100 mb-8 leading-relaxed bg-rose-800/30 p-6 rounded-2xl border border-rose-500/30">
                            {message}
                        </p>
                        <p className="text-rose-200 uppercase text-xs font-bold tracking-widest animate-pulse">Please try again or contact staff</p>
                    </div>
                )}

                {/* VISIBLE INPUT FOR DEBUGGING (Opacity 0 normally) */}
                <input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="absolute opacity-0 w-full h-full cursor-default"
                    autoFocus
                    autoComplete="off"
                />

                {/* Footer / Debug Toggle */}
                <div className="fixed bottom-6 w-full px-8 flex justify-between items-end pointer-events-none">
                    <div className="text-left pointer-events-auto">
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors"
                        >
                            {showDebug ? 'Hide Diagnostics' : 'System Ready • v1.0'}
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                            Kiosk Mode Active
                        </p>
                    </div>
                </div>

                {/* DEBUG PANEL OVERLAY */}
                {showDebug && (
                    <div className="fixed inset-x-4 bottom-16 bg-black/90 text-green-400 font-mono text-xs p-6 rounded-2xl border border-green-900/50 shadow-2xl z-40 max-h-64 overflow-auto animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4 border-b border-green-900/50 pb-2">
                            <span className="font-bold">SYSTEM DIAGNOSTICS</span>
                            <div className="flex gap-4">
                                <span>Input: "{code}"</span>
                                <button onClick={runDiagnostics} className="bg-green-900/50 hover:bg-green-800 px-3 py-1 rounded text-white font-bold">RUN TEST</button>
                            </div>
                        </div>
                        <pre className="whitespace-pre-wrap">{debugLog || 'Waiting for system events...'}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCheckIn;
