'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { 
  NotificationSystem, 
  useNotifications, 
  NotificationType 
} from '../notification/NotificationSystem';
import{
  SearchIcon,
  SettingsIcon
} from '../ui/Icons';
import { Avatar } from '../ui/Avatar';

// Interface cho data từ server
interface SensorData {
  temperature: number;
  humidity: number;
  light_intensity: number;

}

// Cấu hình ngưỡng cho các sensors
const THRESHOLDS = {
  temperature: 30, 
  humidity: 80, 
  light_intensity: 90, 
  data_rate: 2 // số lượng dữ liệu tối đa mỗi phút
};

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Sử dụng hook notifications đã tạo
  const { 
    notifications, 
    addFireAlert, 
    addDataThresholdAlert, 
    clearAllNotifications 
  } = useNotifications(10);
  
  // State lưu trữ dữ liệu từ sensors
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 25,
    humidity: 60,
    light_intensity: 50
  });
  
  // Đếm số lượng dữ liệu nhận được trong 1 phút
  const [dataCounter, setDataCounter] = useState<number>(0);
  
  // Đặt lại bộ đếm dữ liệu mỗi phút
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (dataCounter > 0) {
        console.log(`Received ${dataCounter} data points in the last minute`);
        setDataCounter(0);
      }
    }, 60000); 
    
    return () => clearInterval(resetInterval);
  }, [dataCounter]);
  
  // Mô phỏng việc nhận dữ liệu từ server
  useEffect(() => {
    const dataInterval = setInterval(() => {
      
      const newData: SensorData = {
        temperature: 20 + Math.random() * 15, 
        humidity: 40 + Math.random() * 50, 
        light_intensity: 30 + Math.random() * 70 
      };
      
      setSensorData(newData);
      
      setDataCounter(prev => prev + 1);
      
      checkThresholds(newData);
      
    }, 15000); // Mỗi 15 giây
    
    // Mô phỏng phát hiện cháy (ngẫu nhiên)
    const fireDetectionInterval = setInterval(() => {
      if (Math.random() > 0.9) { // 10% cơ hội có cảnh báo cháy
        addFireAlert('Phòng khách');
      }
    }, 30000); // Mỗi 30 giây
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(fireDetectionInterval);
    };
  }, [addFireAlert, addDataThresholdAlert]);
  
  // Kiểm tra vượt ngưỡng
  const checkThresholds = (data: SensorData) => {
    // Kiểm tra nhiệt độ
    if (data.temperature > THRESHOLDS.temperature) {
      addDataThresholdAlert('Nhiệt độ', Math.round(data.temperature), THRESHOLDS.temperature);
    }
    
    // Kiểm tra độ ẩm
    if (data.humidity > THRESHOLDS.humidity) {
      addDataThresholdAlert('Độ ẩm', Math.round(data.humidity), THRESHOLDS.humidity);
    }
    
    // Kiểm tra cường độ ánh sáng
    if (data.light_intensity > THRESHOLDS.light_intensity) {
      addDataThresholdAlert('Cường độ ánh sáng', Math.round(data.light_intensity), THRESHOLDS.light_intensity);
    }
    
    // Kiểm tra tốc độ dữ liệu
    if (dataCounter > THRESHOLDS.data_rate) {
      addDataThresholdAlert('Tốc độ dữ liệu', dataCounter, THRESHOLDS.data_rate);
    }
  };

  return ( 
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#242424]">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search"
          className="pl-10 pr-4 py-2 w-full bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-[#242424]"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 text-[#242424]">
          <SettingsIcon />
        </button>
        <NotificationSystem />
        <div className="flex items-center space-x-2">
          <Avatar src="/img/pdz.jpg" alt="Phu" size={40} />
          <div className="font-medium text-black">Phu</div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
  </div>
  );
};

export default Header;