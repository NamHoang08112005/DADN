'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useDropzone } from 'react-dropzone';
import { detectFireInImage, FireDetectionStream } from '../../models/fireDetection';

const FireDetection = () => {
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
        return () => {
            stopVideoStream();
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col p-6 overflow-auto">
                <Header />

                <div className="mt-6">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">Fire Detection</h1>

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