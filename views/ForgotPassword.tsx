
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Input, Button } from '../components/UI';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/#/reset-update-password',
            });

            if (error) throw error;

            setStatus('success');
            setMessage('If the email is registered, you will receive a recovery link shortly.');
        } catch (err: any) {
            console.error('Reset error:', err);
            setStatus('error');
            setMessage(err.message || 'Error sending recovery email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">M</div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Recover Password</h2>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Administrative Portal</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm border border-green-200">
                            {message}
                        </div>
                        <Link to="/login">
                            <Button variant="secondary" className="w-full">Back to Login</Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase border border-red-100">
                                {message}
                            </div>
                        )}

                        <p className="text-sm text-gray-600">
                            Enter your email below and we will send you a link to reset your password.
                        </p>

                        <Input
                            label="Registered Email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Button type="submit" className="w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                            {loading ? 'Sending...' : 'Send Recovery Link'}
                        </Button>

                        <Link to="/login" className="block text-center text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest mt-4">
                            <span className="flex items-center justify-center gap-2"><ArrowLeft size={12} /> Back</span>
                        </Link>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default ForgotPassword;
