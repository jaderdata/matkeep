
import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from './UI';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    onClose: () => void;
    initialImage?: string | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, initialImage }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const confirmPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-2">
                <div className="relative aspect-square bg-gray-900 overflow-hidden mb-4">
                    {!capturedImage && (
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
                            alt="Captura"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {!isCameraOpen && !capturedImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button onClick={startCamera} className="flex items-center gap-2">
                                <Camera size={20} />
                                Open Camera
                            </Button>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex justify-center gap-4">
                    {!capturedImage && isCameraOpen && (
                        <Button onClick={takePhoto} className="flex-1 py-4 flex items-center justify-center gap-2">
                            <Camera size={20} />
                            Take Photo
                        </Button>
                    )}

                    {capturedImage && (
                        <>
                            <Button onClick={retakePhoto} variant="secondary" className="flex-1 py-4 flex items-center justify-center gap-2">
                                <RefreshCw size={20} />
                                Retake
                            </Button>
                            <Button onClick={confirmPhoto} className="flex-1 py-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                                <Check size={20} />
                                Confirm
                            </Button>
                        </>
                    )}
                </div>

                <button
                    onClick={() => { stopCamera(); onClose(); }}
                    className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                    <X size={32} />
                </button>
            </div>
        </div>
    );
};
