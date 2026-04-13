'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, NotificationType } from '@/components/notification/NotificationSystem';

// Tạo context
const NotificationContext = createContext<ReturnType<typeof useNotifications> | undefined>(undefined);

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const notifications = useNotifications(10);
  
  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook để sử dụng context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext phải được sử dụng trong NotificationProvider');
  }
  return context;
};