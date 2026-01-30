import { supabase } from './supabase';

export interface StudentDocument {
    id: string;
    student_id: string;
    academy_id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    created_at: string;
    user_email?: string;
}

export const uploadStudentDocument = async (
    studentId: string,
    academyId: string,
    file: File
): Promise<StudentDocument | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}/${Date.now()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('student-documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('student-documents')
            .getPublicUrl(filePath);

        const { data: { session } } = await supabase.auth.getSession();

        const { data: docRecord, error: dbError } = await supabase
            .from('student_documents')
            .insert({
                student_id: studentId,
                academy_id: academyId,
                name: file.name,
                url: publicUrl,
                type: file.type || 'application/octet-stream',
                size: file.size,
                user_email: session?.user?.email
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return docRecord;
    } catch (err) {
        console.error('Error in uploadStudentDocument:', err);
        return null;
    }
};

export const getStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
    try {
        const { data, error } = await supabase
            .from('student_documents')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error in getStudentDocuments:', err);
        return [];
    }
};

export const deleteStudentDocument = async (docId: string, url: string): Promise<boolean> => {
    try {
        // Extract path from URL
        const urlParts = url.split('student-documents/');
        if (urlParts.length < 2) throw new Error('Invalid URL format');
        const filePath = urlParts[1];

        const { error: storageError } = await supabase.storage
            .from('student-documents')
            .remove([filePath]);

        if (storageError) throw storageError;

        const { error: dbError } = await supabase
            .from('student_documents')
            .delete()
            .eq('id', docId);

        if (dbError) throw dbError;

        return true;
    } catch (err) {
        console.error('Error in deleteStudentDocument:', err);
        return false;
    }
};
