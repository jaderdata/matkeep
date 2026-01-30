
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { Link, Copy, Check, QrCode, ExternalLink, UserPlus, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';

const AcademyRegistrationLink: React.FC = () => {
    const [academy, setAcademy] = useState<{ id: string, name: string, slug?: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAcademy = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                const { data } = await supabase
                    .from('academies')
                    .select('id, name, slug')
                    .eq('admin_email', session.user.email)
                    .maybeSingle();

                if (data) setAcademy(data);
            }
            setLoading(false);
        };
        fetchAcademy();
    }, []);

    const getBaseUrl = () => {
        // Remove trailing slash and any existing hash
        const url = window.location.href.split('#')[0];
        return url.endsWith('/') ? url.slice(0, -1) : url;
    };

    const baseUrl = getBaseUrl();



    // New Logic: explicitly constructs the path with /#/
    const registrationUrl = academy
        ? `${baseUrl}/#/public/register/${academy.slug || academy.id}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(registrationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    if (!academy) {
        return (
            <div className="p-8">
                <Card className="p-8 text-center bg-amber-50 border-amber-200">
                    <p className="text-amber-800 font-bold uppercase text-xs">Attention</p>
                    <p className="text-amber-600 text-sm mt-2">Unable to identify your academy. Check settings.</p>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl space-y-8 print:hidden">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Student Registration</h2>
                    <p className="text-gray-500 text-sm">This is your exclusive link. Share with new students so they can register themselves.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <UserPlus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Registration Link</h3>
                            <p className="text-gray-500 text-[10px] uppercase">Send to your new students via WhatsApp</p>
                        </div>

                        <div className="w-full space-y-3">
                            <div className="relative group">
                                <Input
                                    value={registrationUrl}
                                    readOnly
                                    className="pr-12 text-xs font-mono bg-gray-50"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-3 top-[34px] p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                    title="Copy Link"
                                >
                                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                            <Button className="w-full flex items-center justify-center gap-2" onClick={handleCopy}>
                                {copied ? 'Copied!' : 'Copy Registration Link'}
                            </Button>
                            <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={() => window.open(registrationUrl, '_blank')}>
                                <ExternalLink size={16} /> Test Link
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-8 flex flex-col items-center justify-center text-center gap-6 bg-gray-50 border-dashed">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <QRCode value={registrationUrl} size={150} />
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Counter QR Code</h3>
                            <p className="text-gray-500 text-[10px] uppercase">Print and place at the academy reception</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button variant="secondary" className="text-xs uppercase font-black tracking-widest flex items-center justify-center gap-2" onClick={() => window.print()}>
                                <Download size={14} /> Print A4 Sign
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 flex gap-4">
                    <div className="text-blue-500 shrink-0"><Link size={24} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 uppercase mb-1">Why use this link?</h4>
                        <ul className="text-xs text-blue-700 space-y-2 list-disc list-inside">
                            <li>Saves reception time at the counter.</li>
                            <li>Data enters correctly formatted.</li>
                            <li>Student sets their own password instantly.</li>
                            <li>Increases information accuracy (Email, Phone, Birth Date).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Layout de Impressão (Poster A4) */}
            <style>
                {`
                    @media print {
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                `}
            </style>
            <div className="hidden print:flex flex-col items-center justify-between w-[210mm] h-[297mm] p-12 text-center bg-white mx-auto">
                <div className="mt-8 space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tight text-gray-900 leading-tight">{academy?.name}</h1>
                    <p className="text-2xl text-gray-500 uppercase tracking-widest font-light">Student Portal</p>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 my-8">
                    <div className="p-6 bg-white border-[6px] border-gray-900 rounded-2xl shadow-xl">
                        <QRCode value={registrationUrl} size={350} />
                    </div>
                    <p className="mt-6 text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Scan to access</p>
                </div>

                <div className="space-y-8 mb-16 max-w-xl w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">How to register?</h2>
                    </div>

                    <ol className="text-left space-y-6 text-xl text-gray-600 bg-gray-50 p-10 rounded-2xl border border-gray-100 shadow-sm">
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">1</span>
                            <span>Open your phone's camera</span>
                        </li>
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">2</span>
                            <span>Point at the QR Code above</span>
                        </li>
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">3</span>
                            <span>Register or Login</span>
                        </li>
                    </ol>
                </div>

                <div className="text-xs text-gray-300 font-bold uppercase tracking-[0.3em] mb-4">
                    Developed by Matkeep
                </div>
            </div>
        </>
    );
};

export default AcademyRegistrationLink;
