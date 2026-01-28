
import React, { useState } from 'react';
import { Card, Button, Input } from '../../components/UI';
import { Link, Copy, Check, QrCode, ExternalLink, Building2, Download } from 'lucide-react';
import QRCode from 'react-qr-code';

const MasterAcademyRegistration: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const registrationUrl = `${window.location.origin}/#/register-academy`;

    const handleCopy = () => {
        navigator.clipboard.writeText(registrationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="max-w-4xl space-y-8 print:hidden">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Academy Creation Link</h2>
                    <p className="text-gray-500 text-sm">Share this link with gym owners so they can register their academy on the platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                            <Building2 size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Registration Link</h3>
                            <p className="text-gray-500 text-[10px] uppercase">Send to new partners</p>
                        </div>

                        <div className="w-full space-y-3">
                            <div className="relative group">
                                <Input
                                    value={registrationUrl}
                                    readOnly
                                    className="pr-12 text-xs font-mono bg-gray-50 mb-4"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-3 top-[34px] p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                    title="Copy Link"
                                >
                                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                            <Button className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white border-none" onClick={handleCopy}>
                                {copied ? 'Copied!' : 'Copy Registration Link'}
                            </Button>
                            <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={() => window.open(registrationUrl, '_blank')}>
                                <ExternalLink size={16} /> Test Link
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-8 flex flex-col items-center justify-center text-center gap-6 bg-gray-50 border-dashed">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <QRCode id="registration-qr-code" value={registrationUrl} size={150} />
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Registration QR Code</h3>
                            <p className="text-gray-500 text-[10px] uppercase">For presentations or physical materials</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Button
                                variant="outline"
                                className="text-xs uppercase font-black tracking-widest flex items-center justify-center gap-2"
                                onClick={() => {
                                    const svg = document.getElementById('registration-qr-code');
                                    if (svg) {
                                        const svgData = new XMLSerializer().serializeToString(svg);
                                        const canvas = document.createElement('canvas');
                                        const ctx = canvas.getContext('2d');
                                        const img = new Image();
                                        const size = 2000;
                                        canvas.width = size;
                                        canvas.height = size;
                                        img.onload = () => {
                                            if (ctx) {
                                                ctx.fillStyle = 'white';
                                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                ctx.drawImage(img, 0, 0, size, size);
                                                const pngFile = canvas.toDataURL('image/png');
                                                const downloadLink = document.createElement('a');
                                                downloadLink.download = 'matkeep-registration-qr.png';
                                                downloadLink.href = pngFile;
                                                downloadLink.click();
                                            }
                                        };
                                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                                    }
                                }}
                            >
                                <Download size={14} /> PNG (High Res)
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 flex gap-4">
                    <div className="text-amber-500 shrink-0"><Link size={24} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 uppercase mb-1">How it works?</h4>
                        <ul className="text-xs text-amber-700 space-y-2 list-disc list-inside">
                            <li>The owner accesses the link and fills out the academy details.</li>
                            <li>A new account is automatically created for the administrator.</li>
                            <li>The academy starts with a default trial period.</li>
                            <li>The Master Admin can manage the new academy in the "Academies" list.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Print Layout */}
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
                    <h1 className="text-5xl font-black uppercase tracking-tight text-gray-900 leading-tight">MATKEEP</h1>
                    <p className="text-2xl text-gray-500 uppercase tracking-widest font-light">Academy Registration</p>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 my-8">
                    <div className="p-6 bg-white border-[6px] border-amber-500 rounded-2xl shadow-xl">
                        <QRCode value={registrationUrl} size={350} />
                    </div>
                    <p className="mt-6 text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Scan to register your academy</p>
                </div>

                <div className="space-y-8 mb-16 max-w-xl w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Simplified Management</h2>
                    </div>

                    <ol className="text-left space-y-6 text-xl text-gray-600 bg-gray-50 p-10 rounded-2xl border border-gray-100 shadow-sm">
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">1</span>
                            <span>Scan the QR Code</span>
                        </li>
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">2</span>
                            <span>Fill in your academy details</span>
                        </li>
                        <li className="flex items-center gap-6">
                            <span className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">3</span>
                            <span>Scale your management</span>
                        </li>
                    </ol>
                </div>

                <div className="text-xs text-gray-300 font-bold uppercase tracking-[0.3em] mb-4">
                    MATKEEP - MASTER ADMIN PLATFORM
                </div>
            </div>
        </>
    );
};

export default MasterAcademyRegistration;
