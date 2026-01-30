
import React from 'react';
import { Card, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse: React.FC = () => {
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
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Terms of Use</h1>

                    <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">1. Acceptance of Terms</h2>
                            <p>
                                By using the Matkeep system, you fully agree to these terms of use.
                                The system is a management tool for martial arts academies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">2. Academy Responsibility</h2>
                            <p>
                                The academy is responsible for the accuracy of the data entered and for ensuring it has the
                                necessary authorizations to register its students in the system.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">3. Use of Card Pass</h2>
                            <p>
                                The Card Pass system is for the exclusive use of attendance control.
                                Any misuse of the tool is the user's responsibility.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">4. Limitation of Liability</h2>
                            <p>
                                Matkeep seeks to provide the best possible availability but is not responsible for
                                any connection failures or data loss resulting from misuse.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TermsOfUse;
