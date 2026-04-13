'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

import {
  HomeIcon,
  SensorIcon,
  CameraIcon,
  ChartIcon,
  LogoutIcon,
  FanIcon,
  TemperatureIcon,
  HumidityIcon,
  LightIntensityIcon,
} from '../ui/Icons';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClass = (path: string) => {
    const baseClass = 'p-2 rounded-lg transition-colors duration-200';
    return isActive(path)
      ? `${baseClass} bg-white text-[#7a40f2]`
      : `${baseClass} text-white hover:bg-purple-500`;
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Logout button clicked');
    console.log('logout function:', logout); // Kiểm tra xem logout có phải là hàm không
    
    try {
      // Thử trực tiếp xóa storage và redirect để xem có hoạt động không
      console.log('Clearing storage and redirecting manually');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/about';
    } catch (error) {
      console.error('Error during manual logout:', error);
    }
  };

  return (
    <div className="w-20 bg-[#7a40f2] flex flex-col items-center py-6 text-white h-screen sticky top-0">
      <Link href="/home" className={getLinkClass('/home')}>
        <HomeIcon />
      </Link>

      <div className="flex flex-col space-y-8 flex-grow mt-12">
        <Link href="/device" className={getLinkClass('/device')}>
          <FanIcon />
        </Link>

        <Link href="/humidity" className={getLinkClass('/humidity')}>
          <HumidityIcon />
        </Link>

        <Link href="/temperature" className={getLinkClass('/temperature')}>
          <TemperatureIcon />
        </Link>

        <Link href="/light_intensity" className={getLinkClass('/light_intensity')}>
          <LightIntensityIcon />
        </Link>

        <Link href="/fire-detection" className={getLinkClass('/fire-detection')}>
          <CameraIcon />
        </Link>

        <Link href="/sensors" className={getLinkClass('/sensors')}>
          <SensorIcon />
        </Link>

        <Link href="/logging" className={getLinkClass('/logging')}>
          <ChartIcon />
        </Link>
      </div>

        <button
          onClick={handleLogout}
          className={`${getLinkClass('/about')} cursor-pointer`}
          aria-label="Logout"
        >
          <LogoutIcon />
        </button>
    </div>
  );
};

export default Sidebar;