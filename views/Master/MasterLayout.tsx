import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Building2, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabase';

const MasterSidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            title={label || undefined}
            className={`flex items-center ${label ? 'gap-3' : 'justify-center'} px-4 py-3 text-sm font-medium border-l-4 transition-colors ${isActive
                ? 'bg-amber-50 border-amber-500 text-amber-700'
                : 'border-transparent text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
        >
            {icon}
            {label && <span>{label}</span>}
        </Link>
    );
};

export const MasterLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const SYSTEM_VERSION = 'v2.0.8';

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Escura para diferenciar do painel normal */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-950 text-white flex flex-col h-screen sticky top-0 z-20 transition-all duration-300`}>
                <div className={`p-6 border-b border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-lg font-bold tracking-tight">MATKEEP</span>
                            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Master Admin</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <div className="w-5 h-0.5 bg-gray-400 relative after:absolute after:top-1.5 after:left-0 after:w-5 after:h-0.5 after:bg-gray-400 before:absolute before:-top-1.5 before:left-0 before:w-5 before:h-0.5 before:bg-gray-400"></div>}
                    </button>
                </div>

                <nav className="flex-1 py-4">
                    <MasterSidebarLink to="/master/dashboard" icon={<LayoutDashboard size={20} />} label={isCollapsed ? "" : "Overview"} />
                    <MasterSidebarLink to="/master/academies" icon={<Building2 size={20} />} label={isCollapsed ? "" : "Academies"} />
                    <MasterSidebarLink to="/master/registration-link" icon={<LinkIcon size={20} />} label={isCollapsed ? "" : "Registration Link"} />
                </nav>

                <div className="p-4 border-t border-gray-800 overflow-hidden">
                    <div className={`flex items-center gap-3 px-2 py-2 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 bg-gray-800 flex items-center justify-center text-amber-500 rounded-full shrink-0">
                            <ShieldCheck size={16} />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold truncate leading-tight text-white">Super Admin</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                                    Full Access
                                </span>
                                <span className="text-[9px] text-gray-600 font-medium mt-1">Version {SYSTEM_VERSION}</span>
                            </div>
                        )}
                    </div>
                    {isCollapsed && (
                        <div className="flex flex-col items-center gap-1 mb-4 mt-2">
                            <span className="text-[9px] text-gray-600 font-medium">{SYSTEM_VERSION}</span>
                        </div>
                    )}
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className={`flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-400 hover:bg-gray-900 transition-colors rounded ${isCollapsed ? 'justify-center' : ''}`}
                        title="Logout"
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span>Logout</span>}
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
