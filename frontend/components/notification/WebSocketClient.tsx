'use client';

import React, { useEffect, useRef, useContext, createContext, ReactNode, useState } from 'react';
import { 
  NotificationType, 
  Notification,
  useNotifications
} from './NotificationSystem';

// WebSocket Context
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {}
});

// WebSocket Provider
export const WebSocketProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { 
    addNotification, 
    addFireAlert, 
    addDataThresholdAlert 
  } = useNotifications();

  // Kết nối đến WebSocket server
  useEffect(() => {
    
    const WS_URL = 'ws://localhost:8000/notifications/ws';
    
    // Tạo kết nối WebSocket
    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Thử kết nối lại sau 5 giây
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          console.log('Attempting to reconnect...');
          // Gọi lại useEffect để tạo kết nối mới
          socketRef.current = null;
        }
      }, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        
        // Xử lý các thông báo từ server
        if (message.type === 'notification') {
          const notification = message.notification;
          
          // Xử lý thông báo dựa vào loại
          switch (notification.type) {
            case 'fire_alert':
              addFireAlert(notification.data.location);
              break;
            case 'data_threshold':
              addDataThresholdAlert(
                notification.data.sensor_type,
                notification.data.value,
                notification.data.threshold
              );
              break;
            default:
              addNotification(notification.message, NotificationType.DATA_THRESHOLD);
              break;
          }
        }
        
        // Xử lý danh sách thông báo ban đầu khi kết nối
        if (message.type === 'init' && message.notifications) {
          message.notifications.forEach((notification: any) => {
            switch (notification.type) {
              case 'fire_alert':
                addFireAlert(notification.data.location);
                break;
              case 'data_threshold':
                addDataThresholdAlert(
                  notification.data.sensor_type,
                  notification.data.value,
                  notification.data.threshold
                );
                break;
              default:
                addNotification(notification.message, NotificationType.DATA_THRESHOLD);
                break;
            }
          });
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socketRef.current = socket;
    
    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [addNotification, addFireAlert, addDataThresholdAlert]);
  
  // Hàm để gửi tin nhắn qua WebSocket
  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };
  
  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook để sử dụng WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Component này kết hợp WebSocket và Notification
export const NotificationManager: React.FC = () => {
  const { isConnected } = useWebSocket();
  return (
    <div className="notification-manager">
      {!isConnected && (
        <div className="connection-status text-xs text-red-500">
          Đang kết nối lại với máy chủ thông báo...
        </div>
      )}
    </div>
  );
};

export default NotificationManager;