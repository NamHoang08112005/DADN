'use client';

import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Smart Home Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
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