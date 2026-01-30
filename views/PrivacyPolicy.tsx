
import React from 'react';
import { Card, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </Button>

                <Card className="p-8 md:p-12 shadow-xl">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Privacy Policy</h1>

                    <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">1. Introduction</h2>
                            <p>
                                Welcome to Matkeep. We value your privacy and are committed to protecting your personal data.
                                This policy explains how we collect, use, and protect the information provided by academies and their students.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">2. Data Collection</h2>
                            <p>
                                We collect information necessary for academy management, including student names, contacts,
                                attendance records, and documents relevant to sports practice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">3. Use of Information</h2>
                            <p>
                                Data is used exclusively for academy administrative purposes, attendance control,
                                communication between the academy and students, and the issuance of internal reports.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">4. Security</h2>
                            <p>
                                We implement technical and organizational security measures to protect your data against
                                unauthorized access, alteration, or destruction.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
