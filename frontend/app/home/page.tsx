// app/page.tsx
'use client';

import React, { useState } from 'react'; // Thêm useState nếu cần
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import SensorsChart from '../../components/dashboard/SensorsChart';
import DeviceControls from '../../components/dashboard/DeviceControls';
import FanControl from '../../components/dashboard/FanControl';
import { useSensorData } from '../../hooks/useSensorData';
import { useDeviceControl } from '../../hooks/useDeviceControl';
import { useWeather } from '../../hooks/useWeather';

export default function Home() {
  const { data, loading: dataLoading } = useSensorData('Month');
  const { devices, toggleDevice, loading: devicesLoading } = useDeviceControl();
  const { weather, loading: weatherLoading } = useWeather();
  
  const [fanSpeed, setFanSpeed] = useState(50);
  const handleFanSpeedChange = (speed: number) => {
    setFanSpeed(speed);
    console.log(`Fan speed changed to: ${speed}`);
  };

  if (dataLoading || devicesLoading || weatherLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <Header />
        
        <div className="grid grid-cols-4 gap-6">
          {/* Left column (3/4 width) */}
          <div className="col-span-3 space-y-6">
            <WelcomeCard userName="Phu" weatherData={weather} />
            <SensorsChart data={data} />
          </div>
          
          {/* Right column (1/4 width) */}
          <div className="col-span-1 space-y-6">
            <DeviceControls devices={devices} onToggleDevice={toggleDevice} />
            <FanControl initialSpeed={fanSpeed} onSpeedChange={handleFanSpeedChange} />
          </div>
        </div>
      </div>
    </div>
  );
}