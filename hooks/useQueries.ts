import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Student, UserStatus } from '../types';
import { toast } from 'sonner';

// Custom Hooks para centralizar a lógica de busca e mutação com cache e erro automático

export const useStudents = (academyId: string | null) => {
    return useQuery({
        queryKey: ['students', academyId],
        queryFn: async () => {
            if (!academyId) return [];
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('academy_id', academyId);

            if (error) throw error;
            return data as Student[];
        },
        enabled: !!academyId,
    });
};

export const useAttendance = (academyId: string | null) => {
    return useQuery({
        queryKey: ['attendance', academyId],
        queryFn: async () => {
            if (!academyId) return [];
            const { data, error } = await supabase
                .from('attendance')
                .select('student_id, timestamp')
                .eq('academy_id', academyId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!academyId,
    });
};

// Mutação genérica com feedback visual (Toast)
export const useSaveStudent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (student: Partial<Student>) => {
            const { data, error } = await supabase
                .from('students')
                .upsert(student)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            toast.success('Student saved successfully!');
        },
        onError: (error: any) => {
            toast.error(`Error saving student: ${error.message || 'Unknown error'}`);
        }
    });
};

// Events Hooks
export const useEvents = (academyId: string | null) => {
    return useQuery({
        queryKey: ['events', academyId],
        queryFn: async () => {
            if (!academyId) return [];
            const { data, error } = await supabase
                .from('academy_events')
                .select('*')
                .eq('academy_id', academyId)
                .order('start_time', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!academyId,
    });
};

export const useSaveEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (event: any) => {
            const { data, error } = await supabase
                .from('academy_events')
                .insert([event]);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Event saved successfully!');
        },
        onError: (error: any) => {
            toast.error(`Error saving event: ${error.message}`);
        }
    });
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('academy_events').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Event deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(`Error deleting event: ${error.message}`);
        }
    });
};
