import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2, User, ChevronRight } from 'lucide-react';
import { PWAManager } from '../components/PWAManager';

const StudentLogin: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Tenta encontrar por Email OU Código (card_pass_code) OU ID Interno
            // Nota: Para simplificar, vamos verificar se input parece email ou numero
            let query = supabase.from('students').select('id, name');

            const cleanIdentifier = identifier.trim();

            if (cleanIdentifier.includes('@')) {
                // Use ilike for case-insensitive email match
                query = query.ilike('email', cleanIdentifier);
            } else {
                // Use ilike for card code or internal id
                query = query.or(`card_pass_code.ilike.${cleanIdentifier},internal_id.ilike.${cleanIdentifier}`);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;

            if (!data) {
                setError('Aluno não encontrado. Verifique seus dados.');
                setLoading(false);
                return;
            }

            // Login bem sucedido (Soft Login)
            localStorage.setItem('current_student_id', data.id);
            navigate('/student/dashboard');

        } catch (err: any) {
            console.error('Erro no login de aluno:', err);
            setError('Erro ao conectar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
            <PWAManager academy={null} />
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-3">
                        <span className="text-white font-black text-2xl italic">M</span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">
                        Portal do Aluno
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                        Acesso Exclusivo
                    </p>
                </div>

                <div className="p-8 pt-4">
                    <form onSubmit={handleLogin} className="space-y-6" autoComplete="on">
                        {error && (
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                                <p className="text-xs font-black text-red-500 uppercase tracking-wide">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="student-identifier" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                Email ou Código de Acesso
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <User className="text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                </div>
                                <input
                                    id="student-identifier"
                                    name="username"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Digite seu email ou ID..."
                                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 placeholder:text-gray-300 transition-all text-sm"
                                    required
                                    autoComplete="username"
                                    autoCapitalize="none"
                                />
                            </div>
                            {/* Hack para forçar o navegador a oferecer "Salvar Senha" mesmo sendo só um campo de identificação. 
                                Alguns gerenciadores de senha (comportamento de banco) preferem ver um campo de senha. 
                                Se o usuário digitar, vamos assumir que é só o user, mas o autocomplete 'username' deve bastar para o FaceID recuperar. */}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !identifier}
                            className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    Entrar
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Não tem acesso? Procure sua academia.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
