
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Building2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../services/supabase';

const MasterSidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${isActive
                ? 'bg-amber-50 border-amber-500 text-amber-700'
                : 'border-transparent text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
};

export const MasterLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Escura para diferenciar do painel normal */}
            <aside className="w-64 bg-gray-950 text-white flex flex-col h-screen sticky top-0 z-20">
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500 flex items-center justify-center text-gray-900 font-bold text-xl rounded">M</div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight">MATKEEP</span>
                        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Master Admin</span>
                    </div>
                </div>

                <nav className="flex-1 py-4">
                    <MasterSidebarLink to="/master/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <MasterSidebarLink to="/master/academies" icon={<Building2 size={20} />} label="Academies" />
                    <MasterSidebarLink to="/master/registration-link" icon={<LinkIcon size={20} />} label="Registration Link" />
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-2 py-2 mb-4">
                        <div className="w-8 h-8 bg-gray-800 flex items-center justify-center text-amber-500 rounded-full">
                            <ShieldCheck size={16} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate leading-tight text-white">Super Admin</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                                Full Access
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-400 hover:bg-gray-900 transition-colors rounded"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
                    <h1 className="text-sm font-bold uppercase tracking-widest text-gray-500">Master Control Panel</h1>
                </header>
                <div className="p-8 flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
