
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI';
import { supabase } from '../../services/supabase';
import { Building2, Users, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';

const KPI: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = "text-gray-900" }) => (
    <Card className="p-5 border-l-4 border-amber-500 rounded-r-lg rounded-l-none">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={`text-3xl font-black ${color}`}>{value}</h3>
            </div>
            <div className="text-gray-400 opacity-50">{icon}</div>
        </div>
    </Card>
);

const MasterDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        academies: 0,
        students: 0,
        activeStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGlobalStats();
    }, []);

    const fetchGlobalStats = async () => {
        try {
            // Nota: Isso pode falhar se RLS não permitir. 
            // Em produção, precisaria de uma Edge Function ou User Role 'service_role'.
            const { count: academiesCount } = await supabase.from('academies').select('*', { count: 'exact', head: true });
            const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true });

            // Para alunos ativos, precisamos filtrar (count não funciona bem com filter no head as vezes, vamos tentar)
            const { count: activeCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Ativo');

            setStats({
                academies: academiesCount || 0,
                students: studentsCount || 0,
                activeStudents: activeCount || 0
            });
        } catch (err) {
            console.error('Erro ao buscar estatísticas globais:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">Global Overview</h2>
                <p className="text-gray-500 text-sm">Summary of the entire Matkeep platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPI label="Total Academies" value={stats.academies} icon={<Building2 size={32} />} />
                <KPI label="Total Students (Systemic)" value={stats.students} icon={<Users size={32} />} />
                <KPI label="Active Students" value={stats.activeStudents} icon={<TrendingUp size={32} />} color="text-green-600" />
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-4 text-amber-600 bg-amber-50 p-4 rounded border border-amber-200">
                    <AlertTriangle size={24} />
                    <div>
                        <h4 className="font-bold text-sm uppercase">Admin Attention</h4>
                        <p className="text-xs">This dashboard displays data from all tenancies. Be careful when performing bulk changes.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MasterDashboard;
