import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UI';
import { FileUp, Trash2, FileText, Loader2, Download, ExternalLink } from 'lucide-react';
import { uploadStudentDocument, getStudentDocuments, deleteStudentDocument, StudentDocument } from '../services/storageService';

interface StudentDocumentsProps {
    studentId: string;
    academyId: string;
}

export const StudentDocuments: React.FC<StudentDocumentsProps> = ({ studentId, academyId }) => {
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        const docs = await getStudentDocuments(studentId);
        setDocuments(docs);
        setLoading(false);
    };

    useEffect(() => {
        fetchDocuments();
    }, [studentId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const newDoc = await uploadStudentDocument(studentId, academyId, file);
        if (newDoc) {
            setDocuments([newDoc, ...documents]);
        }
        setUploading(false);
        // Reset input
        e.target.value = '';
    };

    const handleDelete = async (docId: string, url: string) => {
        if (!confirm('Deseja realmente excluir este documento?')) return;

        const success = await deleteStudentDocument(docId, url);
        if (success) {
            setDocuments(documents.filter(d => d.id !== docId));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <FileText size={18} />
                        Documentos do Aluno
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Armazene termos, atestados e contratos</p>
                </div>

                <label className="cursor-pointer">
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <div className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold uppercase hover:bg-black transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                        {uploading ? 'Enviando...' : 'Anexar Documento'}
                    </div>
                </label>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-gray-300" size={32} />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100">
                    <FileText className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-xs text-gray-400 font-medium uppercase">Nenhum documento anexado</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {documents.map(doc => (
                        <div key={doc.id} className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 bg-white flex items-center justify-center border border-gray-200 shrink-0">
                                    <FileText size={20} className="text-gray-400" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold text-gray-900 truncate">{doc.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{formatSize(doc.size)}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                    title="Abrir"
                                >
                                    <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc.id, doc.url)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
