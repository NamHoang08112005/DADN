'use client';

import React from 'react';
import { AuthProvider } from '../components/context/AuthContext';
import { WebSocketProvider } from '../components/notification/WebSocketClient';
import { NotificationProvider } from '../components/context/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}