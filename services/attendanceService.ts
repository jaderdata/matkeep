
import { supabase } from './supabase';
import { Student } from '../types';

export interface AttendanceResult {
    success: boolean;
    message: string;
    student?: Student;
}

export const attendanceService = {
    async registerAttendance(code: string, academyId?: string, excludeCooldown: boolean = false): Promise<AttendanceResult> {
        try {
            // 1. Find Student
            let student = null;
            let query = supabase.from('students').select('*');

            // STRICT ISOLATION: If academyId is provided, enforce it.
            if (academyId) {
                query = query.eq('academy_id', academyId);
            }

            // First try strict match on card_pass_code
            const { data: byCode } = await query
                .eq('card_pass_code', code)
                .maybeSingle();

            if (byCode) {
                student = byCode;
            } else if (/^\d+$/.test(code)) {
                // If not found and code is numeric, try internal_id (legacy/fallback)
                // We must rebuild the query to ensure isolation is applied again
                let idQuery = supabase.from('students').select('*');
                if (academyId) {
                    idQuery = idQuery.eq('academy_id', academyId);
                }

                const { data: byId } = await idQuery
                    .eq('internal_id', parseInt(code))
                    .maybeSingle();

                if (byId) student = byId;
            } else {
                // NEW: Fallback to phone_e164 if available
                // This allows check-in by phone number as secondary identifier
                let phoneQuery = supabase.from('students').select('*');
                if (academyId) {
                    phoneQuery = phoneQuery.eq('academy_id', academyId);
                }

                // Extract digits only from code and format to E.164
                const digitsOnly = code.replace(/\D/g, '');
                let phoneToMatch = '';

                if (digitsOnly.length === 11) {
                    // Assume Brazilian phone without country code
                    phoneToMatch = '+55' + digitsOnly;
                } else if (digitsOnly.length > 11) {
                    // Assume already has country code
                    phoneToMatch = '+' + digitsOnly;
                }

                if (phoneToMatch) {
                    const { data: byPhone } = await phoneQuery
                        .eq('phone_e164', phoneToMatch)
                        .maybeSingle();

                    if (byPhone) student = byPhone;
                }
            }

            if (!student) {
                return { success: false, message: 'Student not found or invalid code.' };
            }

            // NEW: Check if student is archived (soft deleted)
            if (student.archived_at) {
                return {
                    success: false,
                    message: 'This student has been archived and cannot check in. Please contact an administrator.',
                    student
                };
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
                        message: `Attendance already confirmed recently. Please wait ${remaining} min to register again.`,
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
                    check_in_time: new Date().toISOString()
                    // check_in_method defaults to 'card' in DB
                });

            if (insertError) {
                // Fallback if table doesn't exist yet, we still update the student execution
                console.warn('Attendance history table might be missing:', insertError);
            }

            // 4. Update Student Last Attendance
            const { data: freshStudent, error: updateError } = await supabase
                .from('students')
                .update({
                    last_attendance: new Date().toISOString()
                    // In a real app we might also increment degrees or check belt progress here
                })
                .eq('id', student.id)
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, message: `Attendance confirmed: ${freshStudent.name}`, student: freshStudent };

        } catch (error: any) {
            console.error('Attendance Error:', error);
            return { success: false, message: 'Error registering attendance.' };
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
                return { success: false, message: 'Student not found.' };
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
                        message: `Already confirmed recently. Please wait ${remaining} min to register again.`,
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
                    check_in_time: new Date().toISOString(),
                    check_in_method: 'manual'
                });

            // 4. Update Student
            const { data: freshStudent, error: updateError } = await supabase
                .from('students')
                .update({ last_attendance: new Date().toISOString() })
                .eq('id', student.id)
                .select()
                .single();

            if (updateError || insertError) throw updateError || insertError;

            return { success: true, message: 'Manual attendance registered.', student: freshStudent };

        } catch (err: any) {
            console.error('Detailed Manual Error:', err);
            return { success: false, message: 'Error registering manual attendance: ' + (err.message || 'Unknown') };
        }
    },
    async getHistory(studentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('check_in_time', { ascending: false })
            .limit(50); // Limit to last 50 for performance

        if (error) {
            console.error('Error fetching history:', error);
            return [];
        }
        return data || [];
    }
};
