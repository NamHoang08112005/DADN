'use client';

import React, { useEffect, useState } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  const [cameraNotice, setCameraNotice] = useState('');

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
      isMounted = false;
    };
  }, []);

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