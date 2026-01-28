
import React, { useState } from 'react';
import { Card, Input, Button } from '../components/UI';
import { CheckCircle, Loader2, Award, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { formatUSPhone } from '../utils';

const AcademyWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        academyName: '',
        address: '',
        contact: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (formData.adminPassword !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // 1. Criar o usuário administrador no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.adminEmail,
                password: formData.adminPassword,
            });

            if (authError) throw authError;

            // 2. Criar a academia
            const academyId = 'aca-' + Math.random().toString(36).substr(2, 9);
            const { error: acaError } = await supabase
                .from('academies')
                .insert([{
                    id: academyId,
                    name: formData.academyName,
                    address: formData.address,
                    contact: formData.contact,
                    admin_email: formData.adminEmail,
                    logo_url: 'https://picsum.photos/seed/academy/200/200',
                    yellow_flag_days: 7,
                    red_flag_days: 14
                }]);

            if (acaError) throw acaError;

            // 3. Opcional: Vincular usuário à academia (se houver tabela de perfis/roles)
            // Para este MVP, o login com o email administrativo já dará acesso

            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Error creating academy');
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-6 shadow-2xl border-t-8 border-t-gray-900">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Academy Created!</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            The academy <strong>{formData.academyName}</strong> has been successfully registered.
                            A confirmation email has been sent to <strong>{formData.adminEmail}</strong>.
                        </p>
                    </div>
                    <div className="w-full space-y-3 pt-4">
                        <Button className="w-full py-4 text-sm font-bold uppercase tracking-widest" onClick={() => navigate('/login')}>
                            Go to Login
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <Card className="max-w-2xl w-full p-10 shadow-2xl border-t-8 border-t-gray-900">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-lg">M</div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Matkeep for Academies</h1>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">Start your professional management today</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Unit Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="Academy Name"
                                    placeholder="Ex: Gracie Barra Central"
                                    required
                                    value={formData.academyName}
                                    onChange={e => setFormData({ ...formData, academyName: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Full Address"
                                    placeholder="Street, Number, District, City - State"
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <Input
                                label="Phone / WhatsApp"
                                placeholder="(000) 000-0000"
                                required
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: formatUSPhone(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Administrator Access</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="Administrative Email"
                                    type="email"
                                    placeholder="admin@youracademy.com"
                                    required
                                    value={formData.adminEmail}
                                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                            </div>
                            <Input
                                label="Access Password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.adminPassword}
                                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <Button type="submit" className="w-full py-5 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Award size={20} />}
                            {loading ? 'Creating your Academy...' : 'Register Academy and Access'}
                        </Button>
                        <p className="text-center text-[9px] text-gray-400 mt-6 uppercase font-bold tracking-widest leading-loose">
                            By clicking register, you confirm you are legally responsible for the unit and accept our professional terms of use.
                        </p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AcademyWizard;
