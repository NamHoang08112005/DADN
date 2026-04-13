'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Định nghĩa kiểu thông báo
export enum NotificationType {
  FIRE_ALERT = 'fire_alert',
  DATA_THRESHOLD = 'data_threshold'
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationIconProps {
  notifications: Notification[];
  onClearAll: () => void;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ notifications, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Đóng notification panel khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Đếm số thông báo chưa đọc
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="relative" ref={notificationRef}>
      {/* Icon thông báo */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none"
        aria-label="Notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Badge hiển thị số thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel hiển thị danh sách thông báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="py-2 px-4 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Thông báo</h3>
            <button 
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Xóa tất cả
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-500 text-sm">
                Không có thông báo mới
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Xác định màu sắc và icon dựa vào loại thông báo
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FIRE_ALERT:
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          )
        };
      case NotificationType.DATA_THRESHOLD:
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const { bgColor, textColor, icon } = getTypeStyles(notification.type);

  return (
    <div className={`py-3 px-4 border-b ${notification.read ? 'bg-white' : bgColor}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook để quản lý danh sách thông báo
export const useNotifications = (maxNotifications = 10) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Thêm thông báo mới
  const addNotification = (message: string, type: NotificationType) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      // Giới hạn số lượng thông báo tối đa
      const updatedNotifications = [newNotification, ...prev];
      return updatedNotifications.slice(0, maxNotifications);
    });
  };

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Xóa tất cả thông báo
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Thêm thông báo cảnh báo cháy
  const addFireAlert = (location: string) => {
    addNotification(`Phát hiện cháy tại ${location}!`, NotificationType.FIRE_ALERT);
  };

  // Thêm thông báo vượt ngưỡng dữ liệu
  const addDataThresholdAlert = (dataType: string, value: number, threshold: number) => {
    addNotification(`${dataType} vượt ngưỡng: ${value} (ngưỡng: ${threshold})`, NotificationType.DATA_THRESHOLD);
  };

  return {
    notifications,
    addNotification,
    markAllAsRead,
    clearAllNotifications,
    addFireAlert,
    addDataThresholdAlert
  };
};

// Component chính để sử dụng trong ứng dụng
export const NotificationSystem: React.FC = () => {
  const { 
    notifications, 
    clearAllNotifications, 
    markAllAsRead,
    addFireAlert,
    addDataThresholdAlert
  } = useNotifications(10);

  // Đánh dấu thông báo là đã đọc khi mở panel
  useEffect(() => {
    // Ví dụ: tự động tạo thông báo để demo
    // Trong thực tế, bạn sẽ kết nối với API hoặc websocket
    const interval = setInterval(() => {
      // Thử nghiệm
      if (Math.random() > 0.7) {
        const random = Math.random();
        if (random > 0.5) {
          addFireAlert('Phòng chính');
        } else {
          addDataThresholdAlert('Nhiệt độ', 32 + Math.floor(Math.random() * 10), 30);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationIcon 
      notifications={notifications}
      onClearAll={() => {
        markAllAsRead();
        clearAllNotifications();
      }}
    />
  );
};

export default NotificationSystem;