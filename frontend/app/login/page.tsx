'use client';

import React, { useEffect, useRef, useState } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function LoginPage() {
  const { signInWithUser } = useAuth();
  const router = useRouter();

  const [cameraNotice, setCameraNotice] = useState('');
  const [faceError, setFaceError] = useState('');
  const [faceLoading, setFaceLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraSource, setCameraSource] = useState<'browser' | 'backend' | null>(null);
  const [rememberFaceLogin, setRememberFaceLogin] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestCameraPermission = async () => {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        if (isMounted) {
          setCameraNotice('Camera permission granted.');
        }
      } catch {
        if (isMounted) {
          setCameraNotice('Please allow camera access to use camera-related features.');
        }
      }
    };

    requestCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      isMounted = false;
    };
  }, []);

  const startFaceCamera = async () => {
    setFaceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
        };
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraSource('browser');
      setCameraReady(true);
      setVideoReady(false);
      setCameraNotice('Camera is ready for Face ID login.');
    } catch {
      setCameraSource('backend');
      setCameraReady(true);
      setVideoReady(true);
      setCameraNotice('Browser camera is unavailable. Using the backend camera for Face ID login.');
    }
  };

  const stopFaceCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setVideoReady(false);
    setCameraSource(null);
  };

  const captureFrame = async (): Promise<Blob> => {
    if (cameraSource === 'backend') {
      const response = await fetch(`${API_BASE_URL}/fall-detection/snapshot?ts=${Date.now()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || 'Backend camera frame is not ready');
      }

      return response.blob();
    }

    const video = videoRef.current;
    if (!video) {
      throw new Error('Camera is not initialized');
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot create canvas context');
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((frameBlob) => resolve(frameBlob), 'image/jpeg', 0.92);
    });

    if (!blob) {
      throw new Error('Failed to capture frame from camera');
    }

    return blob;
  };

  const handleFaceSignIn = async () => {
    if (!cameraReady || !videoReady) {
      setFaceError('Camera is not ready. Please start camera and wait 1-2 seconds.');
      return;
    }

    setFaceLoading(true);
    setFaceError('');

    try {
      const frame = await captureFrame();
      const formData = new FormData();
      formData.append('image', frame, 'face-login.jpg');

      const response = await fetch('/api/v1/auth/face-login', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || 'Face ID sign-in failed.');
      }

      if (!payload?.authenticated) {
        const reason = payload?.reason ? ` (${payload.reason})` : '';
        const distance = typeof payload?.distance_score === 'number' ? ` [distance=${payload.distance_score.toFixed(4)} threshold=${Number(payload?.threshold || 0).toFixed(4)}]` : '';
        throw new Error((payload?.message || 'Face ID does not match an existing account.') + reason + distance);
      }

      if (!payload?.user) {
        throw new Error('Matched user profile is missing from API response.');
      }

      await signInWithUser(payload.user, rememberFaceLogin);
      stopFaceCamera();
      router.push('/home');
    } catch (error) {
      setFaceError(error instanceof Error ? error.message : 'Face ID sign-in failed.');
    } finally {
      setFaceLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Smart Home Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          {cameraNotice && (
            <p className="mt-2 text-xs text-gray-500">{cameraNotice}</p>
          )}
        </div>
        
        <LoginForm />

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Sign In with Face ID</h3>
          <div className="relative aspect-video bg-black rounded overflow-hidden">
            {cameraSource === 'backend' && (
              <img
                src={`${API_BASE_URL}/fall-detection/raw-stream`}
                alt="Raw camera preview"
                className="w-full h-full object-contain"
              />
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-contain ${cameraSource === 'backend' ? 'hidden' : ''}`}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cameraReady ? stopFaceCamera : startFaceCamera}
              className={`px-3 py-2 text-sm rounded text-white ${cameraReady ? 'bg-red-500 hover:bg-red-600' : 'bg-[#7a40f2] hover:bg-[#6930e0]'}`}
            >
              {cameraReady ? 'Stop Camera' : 'Start Camera'}
            </button>

            <button
              type="button"
              onClick={handleFaceSignIn}
              disabled={!cameraReady || !videoReady || faceLoading}
              className={`px-3 py-2 text-sm rounded text-white ${(!cameraReady || !videoReady || faceLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {faceLoading ? 'Signing in...' : 'Capture & Sign In'}
            </button>
          </div>

          {cameraReady && !videoReady && (
            <p className="text-xs text-amber-600">Initializing camera frame...</p>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={rememberFaceLogin}
              onChange={(event) => setRememberFaceLogin(event.target.checked)}
              className="h-4 w-4"
            />
            Remember me for Face ID sign-in
          </label>

          {faceError && <p className="text-xs text-red-500">{faceError}</p>}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            <Link 
              href="/forgot-password"
              className="font-medium text-[#7a40f2] hover:text-[#6930e0]"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm">
            <Link 
              href="/register"
              className="font-medium text-[#7a40f2] hover:text-[#6930e0]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
