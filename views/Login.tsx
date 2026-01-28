
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Input, Button } from '../components/UI';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        setEmail('');
        setPassword('');
        setError(null);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user?.email === 'jader_dourado@hotmail.com') {
                navigate('/master/dashboard');
            } else {
                navigate('/academy/dashboard');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-8 shadow-xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">M</div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Matkeep Login</h2>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Administrative Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">
                            Forgot my password
                        </Link>
                    </div>

                    <Button type="submit" className="w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <p className="text-center text-[10px] text-gray-400 uppercase">
                    Access restricted to authorized administrators.
                </p>
            </Card>
        </div>
    );
};

export default Login;
