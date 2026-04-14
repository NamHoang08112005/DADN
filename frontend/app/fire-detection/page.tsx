'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useDropzone } from 'react-dropzone';
import { detectFireInImage, FireDetectionStream } from '../../models/fireDetection';
import useAuth from '../../hooks/useAuth';

const API_BASE_URL = 'http://127.0.0.1:8000';
const FACE_EMBEDDING_SIZE = 512;

type GestureCommand = 'OPEN_PALM' | 'FIST' | 'THUMB_UP' | 'THUMB_DOWN' | 'VICTORY';

const VECTOR_KEYS = ['face_vector', 'face_embedding', 'embedding', 'vector'];

const normalizeVector = (raw: unknown): number[] | null => {
    if (Array.isArray(raw)) {
        const normalized = raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
        return normalized.length === FACE_EMBEDDING_SIZE ? normalized : null;
    }

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const normalized = parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v));
                return normalized.length === FACE_EMBEDDING_SIZE ? normalized : null;
            }
        } catch {
            return null;
        }
    }

    return null;
};

const extractUserVector = (user: unknown): number[] | null => {
    if (!user || typeof user !== 'object') {
        return null;
    }

    const source = user as Record<string, unknown>;
    for (const key of VECTOR_KEYS) {
        const vector = normalizeVector(source[key]);
        if (vector) {
            return vector;
        }
    }

    return null;
};

const FireDetection = () => {
    const { user } = useAuth();
    const activeUserId = user?.User_Id ?? user?.id ?? null;

    const [isFaceIdAdded, setIsFaceIdAdded] = useState(false);
    const [faceVector, setFaceVector] = useState<number[] | null>(null);
    const [faceMessage, setFaceMessage] = useState('');
    const [savedUserId, setSavedUserId] = useState<string | number | null>(null);
    const [authCameraReady, setAuthCameraReady] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const authVideoRef = useRef<HTMLVideoElement>(null);
    const authCanvasRef = useRef<HTMLCanvasElement>(null);
    const authStreamRef = useRef<MediaStream | null>(null);

    const [selectedGesture, setSelectedGesture] = useState<GestureCommand>('OPEN_PALM');
    const [gestureLoading, setGestureLoading] = useState(false);
    const [gestureMessage, setGestureMessage] = useState('No gesture command executed yet.');

    const [detectionMode, setDetectionMode] = useState<'image' | 'video' | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [detections, setDetections] = useState<any[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionStreamRef = useRef<FireDetectionStream | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setIsProcessing(true);
            try {
                // Process the image first
                const results = await detectFireInImage(file);
                setDetections(results);

                // Then display the image
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        // Create a canvas to draw the image and detections
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');

                        if (ctx) {
                            // Draw the original image
                            ctx.drawImage(img, 0, 0);

                            // Draw detections
                            results.forEach(det => {
                                const [x1, y1, x2, y2] = det.bbox;

                                // Draw bounding box
                                ctx.strokeStyle = '#FF0000';
                                ctx.lineWidth = 3;
                                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                                // Draw background for text
                                ctx.fillStyle = '#FF0000';
                                const text = `${det.class} ${(det.confidence * 100).toFixed(1)}%`;
                                const textWidth = ctx.measureText(text).width;
                                ctx.fillRect(x1, y1 - 25, textWidth + 10, 25);

                                // Draw text
                                ctx.fillStyle = '#FFFFFF';
                                ctx.font = 'bold 16px Arial';
                                ctx.fillText(text, x1 + 5, y1 - 5);
                            });

                            // Convert canvas to data URL and set as selected image
                            setSelectedImage(canvas.toDataURL('image/jpeg'));
                        }
                    };
                    img.src = reader.result as string;
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Failed to process image. Please try again.');
            } finally {
                setIsProcessing(false);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const startAuthCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (authVideoRef.current) {
                authVideoRef.current.srcObject = stream;
                authStreamRef.current = stream;
                setAuthCameraReady(true);
                setFaceMessage('Camera ready. Capture a frame to save FaceID data.');
            }
        } catch (error) {
            console.error('Error accessing camera for face enroll:', error);
            setFaceMessage('Cannot access camera. Please allow camera permission first.');
        }
    };

    const stopAuthCamera = () => {
        if (authStreamRef.current) {
            authStreamRef.current.getTracks().forEach((track) => track.stop());
            authStreamRef.current = null;
        }

        if (authVideoRef.current) {
            authVideoRef.current.srcObject = null;
        }

        setAuthCameraReady(false);
    };

    const captureAndSaveFaceId = async () => {
        if (!authVideoRef.current || !authCanvasRef.current) {
            return;
        }

        if (activeUserId == null) {
            setFaceMessage('Khong tim thay user hien tai. Vui long dang nhap lai.');
            return;
        }

        setAuthLoading(true);
        setFaceMessage('Dang trich xuat dac trung va luu FaceID...');

        try {
            const video = authVideoRef.current;
            const canvas = authCanvasRef.current;
            const width = video.videoWidth || 640;
            const height = video.videoHeight || 480;

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Cannot read canvas context');
            }

            ctx.drawImage(video, 0, 0, width, height);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((frameBlob) => resolve(frameBlob), 'image/jpeg', 0.92);
            });

            if (!blob) {
                throw new Error('Failed to capture frame');
            }

            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            formData.append('user_id', String(activeUserId));

            const response = await fetch('/api/v1/auth/face-enroll', {
                method: 'POST',
                body: formData,
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.detail || payload?.error || 'Face enroll failed');
            }

            if (payload?.error) {
                throw new Error(payload.error);
            }

            const vector = normalizeVector(payload?.embedding) || [];
            const saved = Boolean(payload?.saved);

            setFaceVector(vector);
            setSavedUserId(payload?.user_id ?? activeUserId);
            setIsFaceIdAdded(saved);
            setFaceMessage(saved ? 'Da them du lieu FaceID' : (payload?.message || 'Khong the luu FaceID'));

            if (saved && typeof window !== 'undefined') {
                window.localStorage.setItem('capture_face_enroll', JSON.stringify({
                    enrolled: true,
                    userId: activeUserId,
                    savedUserId: payload?.user_id ?? activeUserId,
                    vector,
                    updatedAt: new Date().toISOString(),
                }));
            } else if (typeof window !== 'undefined') {
                window.localStorage.removeItem('capture_face_enroll');
            }
        } catch (error) {
            console.error('Face enroll error:', error);
            setIsFaceIdAdded(false);
            setFaceVector(null);
            setSavedUserId(null);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('capture_face_enroll');
            }
            setFaceMessage(error instanceof Error ? error.message : 'Face enroll failed');
        } finally {
            setAuthLoading(false);
        }
    };

    const executeGestureCommand = async () => {
        setGestureLoading(true);
        setGestureMessage('Sending gesture command...');

        try {
            let endpoint = '';
            let method: 'POST' = 'POST';
            let body: string | undefined;
            let successMessage = '';

            switch (selectedGesture) {
                case 'OPEN_PALM':
                    endpoint = `${API_BASE_URL}/light/switch/on`;
                    successMessage = 'Gesture OPEN_PALM: Light turned ON.';
                    break;
                case 'FIST':
                    endpoint = `${API_BASE_URL}/light/switch/off`;
                    successMessage = 'Gesture FIST: Light turned OFF.';
                    break;
                case 'THUMB_UP':
                    endpoint = `${API_BASE_URL}/fan/fan/on`;
                    body = JSON.stringify({ speed: 70 });
                    successMessage = 'Gesture THUMB_UP: Fan turned ON at speed 70.';
                    break;
                case 'THUMB_DOWN':
                    endpoint = `${API_BASE_URL}/fan/fan/off`;
                    successMessage = 'Gesture THUMB_DOWN: Fan turned OFF.';
                    break;
                case 'VICTORY':
                    endpoint = `${API_BASE_URL}/light/switch/colorchange`;
                    body = JSON.stringify({ code: '#00CFFF' });
                    successMessage = 'Gesture VICTORY: Light color changed to CYAN.';
                    break;
                default:
                    throw new Error('Unsupported gesture command');
            }

            const response = await fetch(endpoint, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body,
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            setGestureMessage(successMessage);
        } catch (error) {
            console.error('Gesture command error:', error);
            setGestureMessage(error instanceof Error ? error.message : 'Failed to execute gesture command.');
        } finally {
            setGestureLoading(false);
        }
    };

    const startVideoStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current && canvasRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Wait for video to be ready
                await new Promise((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            // Set canvas size to match video's actual dimensions
                            const canvas = canvasRef.current;
                            if (canvas && videoRef.current) {
                                canvas.width = videoRef.current.videoWidth;
                                canvas.height = videoRef.current.videoHeight;
                            }
                            resolve(null);
                        };
                    }
                });

                // Start detection stream
                detectionStreamRef.current = new FireDetectionStream(videoRef.current);
                await detectionStreamRef.current.start();

                setIsStreaming(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Failed to access camera. Please make sure you have granted camera permissions.');
        }
    };

    const stopVideoStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (detectionStreamRef.current) {
            detectionStreamRef.current.stop();
            detectionStreamRef.current = null;
        }
        setIsStreaming(false);
    };

    useEffect(() => {
        const vectorFromUser = extractUserVector(user);

        if (vectorFromUser) {
            setFaceVector(vectorFromUser);
            setIsFaceIdAdded(true);
            setFaceMessage('Da them du lieu FaceID');
            setSavedUserId(activeUserId);
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        const raw = window.localStorage.getItem('capture_face_enroll');
        if (!raw) {
            return;
        }

        try {
            const stored = JSON.parse(raw) as {
                enrolled?: boolean;
                userId?: string | number | null;
                savedUserId?: string | number | null;
                vector?: unknown;
            };
            const storedVector = normalizeVector(stored.vector);

            if (stored.enrolled && (stored.userId == null || stored.userId === activeUserId)) {
                setIsFaceIdAdded(true);
                setFaceVector(storedVector);
                setSavedUserId(stored.savedUserId ?? null);
                setFaceMessage('Da them du lieu FaceID');
            } else {
                window.localStorage.removeItem('capture_face_enroll');
            }
        } catch {
            window.localStorage.removeItem('capture_face_enroll');
        }
    }, [user]);

    useEffect(() => {
        return () => {
            stopAuthCamera();
            stopVideoStream();
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col p-6 overflow-auto">
                <Header />

                <div className="mt-6">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">Capture</h1>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Add Login with FaceID</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isFaceIdAdded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isFaceIdAdded ? 'Da them FaceID' : 'Chua them FaceID'}
                                </span>
                            </div>

                            {!isFaceIdAdded && (
                                <div className="space-y-3">
                                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                        <video
                                            ref={authVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-contain"
                                        />
                                        <canvas ref={authCanvasRef} className="hidden" />
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={authCameraReady ? stopAuthCamera : startAuthCamera}
                                            className={`px-4 py-2 rounded text-white ${authCameraReady ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                                        >
                                            {authCameraReady ? 'Stop Camera' : 'Start Camera'}
                                        </button>

                                        <button
                                            onClick={captureAndSaveFaceId}
                                            disabled={!authCameraReady || authLoading}
                                            className={`px-4 py-2 rounded text-white ${(!authCameraReady || authLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        >
                                            {authLoading ? 'Saving...' : 'Capture & Save FaceID'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isFaceIdAdded && (
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p className="font-medium text-green-700">Da them du lieu FaceID</p>
                                    <p>Vector size: {faceVector?.length ?? 0}</p>
                                    <p>User ID: {savedUserId ?? activeUserId ?? 'N/A'}</p>
                                    {faceVector && faceVector.length > 0 && (
                                        <p className="text-xs text-gray-500 break-all">Vector preview: [{faceVector.slice(0, 8).map((value) => value.toFixed(4)).join(', ')}...]</p>
                                    )}
                                </div>
                            )}

                            {faceMessage && <p className="mt-3 text-sm text-gray-600">{faceMessage}</p>}
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Gesture to IoT</h2>
                            <p className="text-sm text-gray-600 mb-4">Map gesture command to control fan/light devices.</p>

                            <div className="space-y-3">
                                <select
                                    value={selectedGesture}
                                    onChange={(event) => setSelectedGesture(event.target.value as GestureCommand)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                                >
                                    <option value="OPEN_PALM">OPEN_PALM - Light ON</option>
                                    <option value="FIST">FIST - Light OFF</option>
                                    <option value="THUMB_UP">THUMB_UP - Fan ON (70%)</option>
                                    <option value="THUMB_DOWN">THUMB_DOWN - Fan OFF</option>
                                    <option value="VICTORY">VICTORY - Light CYAN</option>
                                </select>

                                <button
                                    onClick={executeGestureCommand}
                                    disabled={gestureLoading}
                                    className={`px-4 py-2 rounded text-white ${gestureLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {gestureLoading ? 'Executing...' : 'Run Gesture Command'}
                                </button>

                                <p className="text-sm text-gray-700">{gestureMessage}</p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Fire Detection Tools</h2>

                    {!detectionMode ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div
                                onClick={() => setDetectionMode('image')}
                                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            >
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Image Detection</h2>
                                <p className="text-gray-600">Upload an image to detect fire hazards</p>
                            </div>

                            <div
                                onClick={() => setDetectionMode('video')}
                                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            >
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Video Stream Detection</h2>
                                <p className="text-gray-600">Use your camera for real-time fire detection</p>
                            </div>
                        </div>
                    ) : detectionMode === 'image' ? (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Image Detection</h2>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                                    } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {selectedImage ? (
                                    <div className="relative">
                                        <img src={selectedImage} alt="Selected" className="max-h-[70vh] mx-auto" />
                                    </div>
                                ) : (
                                    <p className="text-gray-600">{isProcessing ? 'Processing...' : 'Drag and drop an image here, or click to select one'}</p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setDetectionMode(null);
                                    setSelectedImage(null);
                                    setDetections([]);
                                }}
                                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                            >
                                Back
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Video Stream Detection</h2>
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={isStreaming ? stopVideoStream : startVideoStream}
                                    className={`px-4 py-2 rounded ${isStreaming
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                                        }`}
                                >
                                    {isStreaming ? 'Stop Stream' : 'Start Stream'}
                                </button>
                                <button
                                    onClick={() => {
                                        stopVideoStream();
                                        setDetectionMode(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FireDetection; 