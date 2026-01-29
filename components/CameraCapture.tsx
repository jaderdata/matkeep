
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';
import { Button } from './UI';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    onClose: () => void;
    initialImage?: string | null;
}

const resizeImage = (dataUrl: string, maxWidth: number = 800, maxHeight: number = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, initialImage }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            setStream(mediaStream);
            setIsCameraOpen(true);
            setCapturedImage(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (!navigator.mediaDevices) {
                alert("Camera access is not available. This feature requires a secure context (HTTPS) or localhost. If testing on mobile via IP, please switch to HTTPS or use a tunneling service.");
            } else {
                alert("Could not access camera. Please check your browser permissions and ensure no other app is using the camera.");
            }
        }
    };

    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraOpen, stream]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    }, [stream]);

    const takePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                setProcessing(true);
                const optimizedImage = await resizeImage(imageData);
                setCapturedImage(optimizedImage);
                setProcessing(false);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert("File is too large. Please select an image under 10MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                setProcessing(true);
                const optimizedImage = await resizeImage(reader.result as string);
                setCapturedImage(optimizedImage);
                setProcessing(false);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setIsCameraOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl relative">
                <div className="relative aspect-square bg-gray-900 rounded-[2rem] overflow-hidden mb-6 shadow-inner">
                    {!capturedImage && isCameraOpen && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}
                    {capturedImage && (
                        <img
                            src={capturedImage}
                            alt="Capture"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {(!isCameraOpen && !capturedImage) || processing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-gray-900/50 backdrop-blur-sm">
                            <div className="h-20 w-20 bg-gray-800 rounded-3xl flex items-center justify-center text-gray-500 mb-2">
                                {processing ? <RefreshCw className="animate-spin text-primary" size={40} /> : <Camera size={40} />}
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                {processing ? 'Optimizing Node Image...' : 'Awaiting Source Connection'}
                            </p>
                        </div>
                    ) : null}
                </div>

                <canvas ref={canvasRef} className="hidden" />
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                />

                <div className="flex flex-col gap-3">
                    {!capturedImage && !isCameraOpen && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={startCamera}
                                disabled={processing}
                                className="h-16 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Camera size={20} />
                                Camera
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={processing}
                                className="h-16 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                <Upload size={20} />
                                Upload
                            </button>
                        </div>
                    )}

                    {!capturedImage && isCameraOpen && (
                        <button
                            onClick={takePhoto}
                            disabled={processing}
                            className="h-16 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                        >
                            <Camera size={20} />
                            Snap Photo
                        </button>
                    )}

                    {capturedImage && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={retakePhoto}
                                disabled={processing}
                                className="h-16 rounded-2xl bg-gray-100 text-gray-900 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                            >
                                <RefreshCw size={20} />
                                Reset
                            </button>
                            <button
                                onClick={confirmPhoto}
                                disabled={processing}
                                className="h-16 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-200"
                            >
                                <Check size={20} />
                                Confirm
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => { stopCamera(); onClose(); }}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>
            </div>
        </div>
    );
};

