// components/ui/Icons.tsx
import React from 'react';
import Icon from './IconifyIcon';

// Icon cho sidebar
export const HomeIcon: React.FC = () => <Icon icon="mdi:home" />;
export const GridIcon: React.FC = () => <Icon icon="mdi:view-dashboard" />;
export const LampIcon: React.FC = () => <Icon icon="mdi:lightbulb" />;
export const ShieldIcon: React.FC = () => <Icon icon="mdi:shield" />;
export const LocationIcon: React.FC = () => <Icon icon="mdi:map-marker" />;
export const UsersIcon: React.FC = () => <Icon icon="mdi:account-group" />;
export const ChartIcon: React.FC = () => <Icon icon="mdi:chart-line" />;
export const LogoutIcon: React.FC = () => <Icon icon="mdi:logout" />;
export const CameraIcon: React.FC = () => <Icon icon="mdi:camera" />;

// Icon cho header
export const SettingsIcon: React.FC = () => <Icon icon="mdi:cog" />;
export const NotificationIcon: React.FC = () => <Icon icon="mdi:bell" />;
export const SearchIcon: React.FC = () => <Icon icon="mdi:magnify" className="text-gray-400" />;

// Icon cho dashboard
export const WeatherIcon: React.FC = () => <Icon icon="mdi:weather-partly-cloudy" />;
export const TemperatureIcon: React.FC = () => <Icon icon="mdi:thermometer" />;
export const HumidityIcon: React.FC = () => <Icon icon="mdi:water-percent" />;
export const LightIntensityIcon: React.FC = () => <Icon icon="mdi:brightness-6" />;
export const LedColorIcon: React.FC = () => <Icon icon="fluent:color-20-regular" />;
export const ArrowDownIcon: React.FC = () => <Icon icon="fluent:arrow-sort-down-20-regular" />;
export const SensorIcon: React.FC = () => <Icon icon="ion:radio-outline" />;

export const FanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12c0 3-2.5 5.5-5.5 5.5S12 15 12 12zm0 0c0 3-2.5 5.5-5.5 5.5S1 15 1 12c0-3 2.5-5.5 5.5-5.5S12 9 12 12zm0 0c-3 0-5.5-2.5-5.5-5.5S9 1 12 1c3 0 5.5 2.5 5.5 5.5S15 12 12 12zm0 0c3 0 5.5 2.5 5.5 5.5S15 23 12 23c-3 0-5.5-2.5-5.5-5.5S9 12 12 12z" />
    </svg>
);
