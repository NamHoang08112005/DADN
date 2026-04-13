'use client';

import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Smart Home Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login"
              className="font-medium text-[#7a40f2] hover:text-[#6930e0]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}