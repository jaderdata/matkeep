import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './UI';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-red-500/10 rounded-none border border-red-500/20 shadow-lg shadow-red-500/10">
                                <AlertCircle size={48} className="text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-[var(--text-secondary)] text-sm mb-8 font-medium leading-relaxed uppercase tracking-tighter">
                            A critical error occurred while rendering this page. The management system has isolated the failure to protect your data.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button onClick={this.handleReset} className="flex items-center justify-center gap-2">
                                <RefreshCw size={16} />
                                <span>Reload Application</span>
                            </Button>

                            <Button variant="secondary" onClick={this.handleGoHome} className="flex items-center justify-center gap-2">
                                <Home size={16} />
                                <span>Go to Dashboard</span>
                            </Button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 p-4 bg-black/20 border border-[var(--border-color)] text-left overflow-auto max-h-40">
                                <p className="text-[10px] font-mono text-red-400 whitespace-pre">
                                    {this.state.error?.stack}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }


        return this.props.children;
    }
}
