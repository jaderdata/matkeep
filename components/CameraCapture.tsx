
import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';
import { Button } from './UI';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    onClose: () => void;
    initialImage?: string | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, initialImage }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraOpen(true);
            setCapturedImage(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Check permissions.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    }, [stream]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
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

                    {!isCameraOpen && !capturedImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="h-20 w-20 bg-gray-800 rounded-3xl flex items-center justify-center text-gray-500 mb-2">
                                <Camera size={40} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Awaiting Source Connection</p>
                        </div>
                    )}
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
                                className="h-16 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                            >
                                <Camera size={20} />
                                Camera
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="h-16 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
                            >
                                <Upload size={20} />
                                Upload
                            </button>
                        </div>
                    )}

                    {!capturedImage && isCameraOpen && (
                        <button
                            onClick={takePhoto}
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
                                className="h-16 rounded-2xl bg-gray-100 text-gray-900 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                            >
                                <RefreshCw size={20} />
                                Reset
                            </button>
                            <button
                                onClick={confirmPhoto}
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

