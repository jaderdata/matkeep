
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../../components/UI';
import { supabase } from '../../services/supabase';
import { Loader2, Search, Building2, ExternalLink } from 'lucide-react';
import { Academy } from '../../types';

import { useNavigate } from 'react-router-dom';

const MasterAcademyList: React.FC = () => {
    const navigate = useNavigate();
    const [academies, setAcademies] = useState<Academy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAcademies();
    }, []);

    const fetchAcademies = async () => {
        try {
            const { data, error } = await supabase
                .from('academies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Mapeia para o tipo Academy (ajustando campos se necessário)
            const formattedData: Academy[] = (data || []).map(a => ({
                id: a.id,
                name: a.name,
                address: a.address,
                contact: a.contact,
                logoUrl: a.logo_url,
                subscription_plan: a.subscription_plan || 'trial',
                trial_start_date: a.trial_start_date,
                trial_end_date: a.trial_end_date,
                settings: { yellowFlagDays: a.yellow_flag_days, redFlagDays: a.red_flag_days }
            }));

            setAcademies(formattedData);
        } catch (err) {
            console.error('Erro ao buscar academias:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManage = (academyId: string) => {
        localStorage.setItem('master_acting_as_academy_id', academyId);
        window.dispatchEvent(new CustomEvent('academy_updated'));
        navigate('/academy/dashboard');
    };

    const handleTogglePlan = async (academyId: string, currentPlan: 'trial' | 'definitive') => {
        const newPlan = currentPlan === 'trial' ? 'definitive' : 'trial';
        try {
            const { error } = await supabase
                .from('academies')
                .update({ subscription_plan: newPlan })
                .eq('id', academyId);

            if (error) throw error;
            fetchAcademies();
        } catch (err) {
            console.error('Erro ao atualizar plano:', err);
            alert('Error updating plan');
        }
    };

    const handleAddTrialDays = async (academyId: string, currentEndDate: string | undefined) => {
        const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
        const newDate = new Date(baseDate.getTime() + (15 * 24 * 60 * 60 * 1000));

        try {
            const { error } = await supabase
                .from('academies')
                .update({ trial_end_date: newDate.toISOString() })
                .eq('id', academyId);

            if (error) throw error;
            fetchAcademies();
        } catch (err) {
            console.error('Erro ao adicionar dias:', err);
            alert('Error adding days');
        }
    };

    const handleSetTrialDays = async (academyId: string) => {
        const days = prompt('How many trial days do you want to set from today?');
        if (days === null) return;

        const numDays = parseInt(days);
        if (isNaN(numDays)) {
            alert('Please enter a valid number.');
            return;
        }

        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + numDays);

        try {
            const { error } = await supabase
                .from('academies')
                .update({
                    trial_end_date: newEndDate.toISOString(),
                    subscription_plan: 'trial' // Garante que volta para trial se mudar os dias
                })
                .eq('id', academyId);

            if (error) throw error;
            fetchAcademies();
        } catch (err) {
            console.error('Erro ao definir dias:', err);
            alert('Error setting days');
        }
    };

    const filteredAcademies = academies.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.contact && a.contact.includes(searchTerm))
    );

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">Academy Management</h2>
                    <p className="text-gray-500 text-sm">Complete list of registered partners.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="primary"
                        className="font-black uppercase tracking-widest text-[10px] h-8 flex items-center"
                        onClick={() => navigate('/register-academy')}
                    >
                        + New Academy
                    </Button>
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                        Total: {academies.length}
                    </div>
                </div>
            </div>

            <Card className="p-6">
                <div className="mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name or Contact..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Academy</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Admin Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAcademies.length > 0 ? (
                                filteredAcademies.map(acc => (
                                    <tr key={acc.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                    {acc.logoUrl ? <img src={acc.logoUrl} className="w-full h-full object-cover rounded" /> : <Building2 size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{acc.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{acc.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{acc.contact || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge color={acc.subscription_plan === 'definitive' ? 'blue' : 'yellow'}>
                                                    {acc.subscription_plan === 'definitive' ? 'Definitive' : 'Trial'}
                                                </Badge>
                                                {acc.subscription_plan === 'trial' && acc.trial_end_date && (
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        Expires: {new Date(acc.trial_end_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge color="green">Active</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="text-[10px] h-8"
                                                    onClick={() => handleTogglePlan(acc.id, acc.subscription_plan || 'trial')}
                                                >
                                                    Change Plan
                                                </Button>
                                                {acc.subscription_plan === 'trial' && (
                                                    <Button
                                                        variant="secondary"
                                                        className="text-[10px] h-8"
                                                        onClick={() => handleAddTrialDays(acc.id, acc.trial_end_date)}
                                                    >
                                                        +15 Days
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    className="text-[10px] h-8"
                                                    onClick={() => handleSetTrialDays(acc.id)}
                                                >
                                                    Set Days
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="text-[10px] h-8"
                                                    onClick={() => handleManage(acc.id)}
                                                >
                                                    Manage
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                        No academies found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default MasterAcademyList;
