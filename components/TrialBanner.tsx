
import React from 'react';
import { Academy } from '../types';
import { AlertTriangle, Clock } from 'lucide-react';

interface TrialBannerProps {
    academy: Academy | null;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ academy }) => {
    if (!academy || academy.subscription_plan !== 'trial') return null;

    const calculateDaysRemaining = () => {
        if (!academy.trial_end_date) return 0;
        const end = new Date(academy.trial_end_date);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysRemaining = calculateDaysRemaining();
    // Ajusta a base da barra de progresso. Se houver mais de 15 dias, usa o valor atual como 100% ou 30 como padrão.
    const progressBase = daysRemaining > 15 ? Math.max(daysRemaining, 30) : 15;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-1.5 rounded-full">
                    <Clock size={16} className="text-amber-500" />
                </div>
                <div>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest">
                        Trial Version
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter">
                        Enjoy full access to all features during your evaluation.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-tighter">
                        {daysRemaining} {daysRemaining === 1 ? 'day remaining' : 'days remaining'}
                    </span>
                    <div className="w-32 h-1 bg-amber-500/20 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            style={{ width: `${Math.min(100, (daysRemaining / progressBase) * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="bg-amber-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest cursor-default shadow-lg shadow-amber-500/20">
                    Trial Mode
                </div>
            </div>
        </div>
    );
};
