
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input } from '../components/UI';
import { Loader2, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { Student } from '../types';

const StudentCheckIn: React.FC = () => {
    const [code, setCode] = useState('');
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

    const getBgColor = () => {
        switch (status) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'loading': return 'bg-blue-500';
            default: return 'bg-gray-100'; // idle
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${getBgColor()}`}>
            <div className="w-full max-w-2xl text-center space-y-8">
                {/* Header (Only visible on idle usually, but let's keep minimal) */}
                {status === 'idle' && (
                    <div className="animate-pulse">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl mb-6 text-gray-400">
                            <QrCode size={64} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-400 uppercase tracking-widest">Scan Your Card</h1>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="text-white">
                        <Loader2 size={80} className="animate-spin mx-auto mb-6" />
                        <h2 className="text-3xl font-bold uppercase tracking-widest">Verifying...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-white scale-110 transform transition-transform duration-300">
                        <CheckCircle size={100} className="mx-auto mb-6" />
                        <h2 className="text-5xl font-black uppercase tracking-tight mb-2">Attendance Confirmed!</h2>
                        {student && <p className="text-2xl font-medium mt-4">{student.name}</p>}
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-white">
                        <XCircle size={100} className="mx-auto mb-6" />
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Oops!</h2>
                        <p className="text-2xl font-medium mt-2">{message}</p>
                    </div>
                )}

                {/* Hidden Input for Scanner */}
                <input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="opacity-0 absolute top-0 left-0 w-full h-full cursor-default"
                    autoFocus
                />

                <div className="fixed bottom-4 right-4 text-xs text-white/50 uppercase tracking-widest font-bold">
                    Kiosk Mode Active
                </div>
            </div>
        </div>
    );
};

export default StudentCheckIn;
