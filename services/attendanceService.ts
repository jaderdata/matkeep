
import { supabase } from './supabase';
import { Student } from '../types';

export interface AttendanceResult {
    success: boolean;
    message: string;
    student?: Student;
}

export const attendanceService = {
    async registerAttendance(code: string, excludeCooldown: boolean = false): Promise<AttendanceResult> {
        try {
            // 1. Find Student
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('card_pass_code', code)
                .single();

            if (studentError || !student) {
                return { success: false, message: 'Aluno não encontrado ou código inválido.' };
            }

            // 2. Check 60-minute rule
            if (!excludeCooldown && student.last_attendance) {
                const lastTime = new Date(student.last_attendance).getTime();
                const now = new Date().getTime();
                const diffMinutes = (now - lastTime) / (1000 * 60);

                if (diffMinutes < 60) {
                    const remaining = Math.ceil(60 - diffMinutes);
                    return {
                        success: false,
                        message: `Presença já confirmada recentemente. Aguarde ${remaining} min para registrar novamente.`,
                        student
                    };
                }
            }

            // 3. Register Attendance
            const { error: insertError } = await supabase
                .from('attendance')
                .insert({
                    student_id: student.id,
                    academy_id: student.academy_id,
                    timestamp: new Date().toISOString()
                });

            if (insertError) {
                // Fallback if table doesn't exist yet, we still update the student execution
                console.warn('Attendance history table might be missing:', insertError);
            }

            // 4. Update Student Last Attendance
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    last_attendance: new Date().toISOString()
                    // In a real app we might also increment degrees or check belt progress here
                })
                .eq('id', student.id);

            if (updateError) throw updateError;

            return { success: true, message: `Presença confirmada: ${student.name}`, student };

        } catch (error: any) {
            console.error('Attendance Error:', error);
            return { success: false, message: 'Erro ao registrar presença.' };
        }
    },

    async manualAttendance(studentId: string, force: boolean = false): Promise<AttendanceResult> {
        try {
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (studentError || !student) {
                return { success: false, message: 'Aluno não encontrado.' };
            }

            // 60-minute rule check
            if (!force && student.last_attendance) {
                const lastTime = new Date(student.last_attendance).getTime();
                const now = new Date().getTime();
                const diffMinutes = (now - lastTime) / (1000 * 60);

                if (diffMinutes < 60) {
                    const remaining = Math.ceil(60 - diffMinutes);
                    return {
                        success: false,
                        message: `Já confirmou recentemente. Aguarde ${remaining} min para registrar novamente.`,
                        student
                    };
                }
            }

            // 3. Register Attendance
            const { error: insertError } = await supabase
                .from('attendance')
                .insert({
                    student_id: student.id,
                    academy_id: student.academy_id,
                    timestamp: new Date().toISOString()
                });

            // 4. Update Student
            const { error: updateError } = await supabase
                .from('students')
                .update({ last_attendance: new Date().toISOString() })
                .eq('id', student.id);

            if (updateError || insertError) throw updateError || insertError;

            return { success: true, message: 'Presença manual registrada.', student };

        } catch (err: any) {
            console.error('Detailed Manual Error:', err);
            return { success: false, message: 'Erro ao registrar manual: ' + (err.message || 'Desconhecido') };
        }
    },
    async getHistory(studentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('timestamp', { ascending: false })
            .limit(50); // Limit to last 50 for performance

        if (error) {
            console.error('Error fetching history:', error);
            return [];
        }
        return data || [];
    }
};
