
import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Academy } from '../types';

interface AcademyContextType {
    academy: Academy | null;
    academyId: string | null;
    loading: boolean;
    refreshAcademy: () => void;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();

    const { data: rawAcademy, isLoading: loading, refetch: refreshAcademy } = useQuery({
        queryKey: ['academy'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.email) return null;

            // Special case for Master Admin
            if (session.user.email === 'jader_dourado@hotmail.com') {
                const actingId = localStorage.getItem('master_acting_as_academy_id');
                if (actingId) {
                    const { data, error } = await supabase
                        .from('academies')
                        .select('*')
                        .eq('id', actingId)
                        .maybeSingle();
                    if (error) throw error;
                    return data;
                }
            }

            // Normal Academy Admin
            const { data, error } = await supabase
                .from('academies')
                .select('*')
                .eq('admin_email', session.user.email)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour stale time for academy settings
    });

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            refreshAcademy();
        });

        const handleUpdate = () => refreshAcademy();
        window.addEventListener('academy_updated', handleUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('academy_updated', handleUpdate);
        };
    }, [refreshAcademy]);

    const academy: Academy | null = rawAcademy ? {
        id: rawAcademy.id,
        name: rawAcademy.name,
        address: rawAcademy.address,
        contact: rawAcademy.contact,
        logoUrl: rawAcademy.logo_url,
        slug: rawAcademy.slug,
        subscription_plan: rawAcademy.subscription_plan,
        trial_start_date: rawAcademy.trial_start_date,
        trial_end_date: rawAcademy.trial_end_date,
        settings: {
            yellowFlagDays: rawAcademy.yellow_flag_days,
            redFlagDays: rawAcademy.red_flag_days
        }
    } : null;

    const academyId = academy?.id || null;

    return (
        <AcademyContext.Provider value={{ academy, academyId, loading, refreshAcademy: () => { refreshAcademy(); } }}>
            {children}
        </AcademyContext.Provider>
    );
};

export const useAcademy = () => {
    const context = useContext(AcademyContext);
    if (context === undefined) {
        throw new Error('useAcademy must be used within an AcademyProvider');
    }
    return context;
};
