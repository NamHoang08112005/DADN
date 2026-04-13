import React from 'react';
import '../styles/globals.css';
import { Metadata } from 'next';
// app/layout.tsx
import { AuthProvider } from '@/components/context/AuthContext';

export const metadata: Metadata = {
  title: 'Smart Home Dashboard',
  description: 'Modern Smart Home Dashboard with Next.js and Tailwind CSS',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
