import { supabase } from './supabase';

export type AuditAction =
    | 'login'
    | 'logout'
    | 'update_academy_settings'
    | 'update_academy_logo'
    | 'change_password'
    | 'create_student'
    | 'update_student'
    | 'delete_student'
    | 'student_checkin'
    | 'update_belt'
    | 'update_flag';

export interface AuditLog {
    id?: string;
    academy_id: string;
    user_email: string;
    action: AuditAction;
    description: string;
    metadata?: Record<string, any>;
    created_at?: string;
}

/**
 * Register an audit log entry
 */
export const logAuditActivity = async (
    academyId: string,
    action: AuditAction,
    description: string,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const auditLog: AuditLog = {
            academy_id: academyId,
            user_email: session.user.email,
            action,
            description,
            metadata: metadata || {}
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(auditLog);

        if (error) {
            console.error('Error logging audit activity:', error);
        }
    } catch (err) {
        console.error('Failed to log audit activity:', err);
    }
};

/**
 * Get recent audit logs for an academy
 */
export const getRecentAuditLogs = async (
    academyId: string,
    limit: number = 5
): Promise<AuditLog[]> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('academy_id', academyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        return [];
    }
};

/**
 * Get action display name
 */
export const getActionDisplayName = (action: AuditAction): string => {
    const actionNames: Record<AuditAction, string> = {
        login: 'Login',
        logout: 'Logout',
        update_academy_settings: 'Updated Settings',
        update_academy_logo: 'Updated Logo',
        change_password: 'Changed Password',
        create_student: 'Created Student',
        update_student: 'Updated Student',
        delete_student: 'Deleted Student',
        student_checkin: 'Student Check-in',
        update_belt: 'Updated Belt',
        update_flag: 'Updated Flag'
    };

    return actionNames[action] || action;
};
