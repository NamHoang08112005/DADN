import React, { useState } from 'react';
import ToggleSwitch from '../ui/ToggleSwitch';
import LedColorSelector from '../ui/LedColorSellector';
import { DeviceState, DeviceType } from '../../models/deviceState';
import { HumidityIcon, LightIntensityIcon, TemperatureIcon } from '../ui/Icons';

interface DeviceControlsProps {
  devices: DeviceState;
  onToggleDevice: (device: DeviceType, state: boolean) => void;
}

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

const DeviceControls: React.FC<DeviceControlsProps> = ({ devices, onToggleDevice }) => {

  // Light states
  const [isLightOn, setIsLightOn] = useState(false);
  const [lightLoading, setLightLoading] = useState(false);
  // LED colors
  const colors = [
      { name: 'RED', value: '#FF0000' },
      { name: 'BLACK', value: '#2E2E2E' },
      {name: 'WHITE', value: '#F2F2F2' },
      { name: 'PURPLE', value: '#7E3F98' },
      { name: 'MAGENTA', value: '#FF00FF' },
      { name: 'CYAN', value: '#00CFFF' }, 
      { name: 'GREEN', value: '#00B050' },
      { name: 'YELLOW', value: '#FFFF00' },  
      { name: 'ORANGE', value: '#F79646' },
  ];
  const colorMap = Object.fromEntries(colors.map(c => [c.name, c.value]));
  const [selectedColor, setSelectedColor] = useState(colors[0]); // Default Red
  
  const changeColor = async (colorName: string) => {
      try {
          setLightLoading(true);
          const response = await fetch(`${API_BASE_URL}/light/switch/colorchange`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: colorName }),
          });
          
          if (!response.ok) {
              throw new Error('Failed to change light color');
          }
          
          const data = await response.json();
          console.log('Light color changed:', data);
      } catch (error) {
          console.error('Error changing light color:', error);
          alert('Failed to change light color. Please try again.');
      } finally {
          setLightLoading(false);
      }
  };

    // Bật đèn
  const turnOnLight = async () => {
      try {
          setLightLoading(true);
          const response = await fetch(`${API_BASE_URL}/light/switch/on`, {
              method: 'POST',
          });
          
          if (!response.ok) {
              throw new Error('Failed to turn on light');
          }
          
          const data = await response.json();
          console.log('Light turned on:', data);
          setIsLightOn(true);
          
          // // Sau khi bật đèn, cũng cập nhật màu sắc hiện tại
          // changeColor(selectedColor.value);
      } catch (error) {
          console.error('Error turning on light:', error);
          alert('Failed to turn on light. Please try again.');
      } finally {
          setLightLoading(false);
      }
  };
  

  const handleColorChange = (color: string) => {
    turnOnLight();
    changeColor(colorMap[color.toUpperCase()]);
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={`p-4 rounded-2xl shadow-sm flex flex-col items-center ${devices.humidity ? 'bg-[#7c4dff]' : 'bg-white'}`}>
      <div className="flex justify-between w-full mb-2">
        <span className={`text-lg font-medium ${devices.humidity ? 'text-white' : 'text-gray-500'}`}>
          {devices.humidity ? 'ON' : 'OFF'}
        </span>
        <ToggleSwitch isOn={devices.humidity} onToggle={() => onToggleDevice('humidity', !devices.humidity)} />
      </div>
      <div className="w-12 h-12 flex items-center justify-center my-2">
        <span className={`w-8 h-8 ${devices.humidity ? 'text-white' : 'text-[#7c4dff]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <HumidityIcon/>
        </span>
      </div>
      <span className={`mt-2 text-lg font-medium ${devices.humidity ? 'text-white' : 'text-[#7c4dff]'}`}>
        Humidity
      </span>
    </div>
      
      <div className={`p-4 rounded-2xl shadow-sm flex flex-col items-center ${devices.temperature ? 'bg-[#7c4dff]' : 'bg-white'}`}>
      <div className="flex justify-between w-full mb-2">
        <span className={`text-lg font-medium ${devices.temperature ? 'text-white' : 'text-gray-500'}`}>
          {devices.temperature ? 'ON' : 'OFF'}
        </span>
        <ToggleSwitch isOn={devices.temperature} onToggle={() => onToggleDevice('temperature', !devices.temperature)} />
      </div>
      <div className="w-12 h-12 flex items-center justify-center my-2">
        <span className={`w-8 h-8 ${devices.temperature ? 'text-white' : 'text-[#7c4dff]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <TemperatureIcon/>
        </span>
      </div>
      <span className={`mt-2 text-lg font-medium ${devices.temperature ? 'text-white' : 'text-[#7c4dff]'}`}>
        Temperature
      </span>
    </div>
      
    {/* LED Color Selector (Thay thế Air Quality) */}
    <LedColorSelector 
        currentColor={selectedColor.name} 
        onColorChange={handleColorChange} 
      />
      
    <div className={`p-4 rounded-2xl shadow-sm flex flex-col items-center ${devices.lightIntensity ? 'bg-[#7c4dff]' : 'bg-white'}`}>
      <div className="flex justify-between w-full mb-2">
        <span className={`text-lg font-medium ${devices.lightIntensity ? 'text-white' : 'text-gray-500'}`}>
          {devices.lightIntensity ? 'ON' : 'OFF'}
        </span>
        <ToggleSwitch isOn={devices.lightIntensity} onToggle={() => onToggleDevice('lightIntensity', !devices.lightIntensity)} />
      </div>
      <div className="w-12 h-12 flex items-center justify-center my-2">
        <span className={`w-8 h-8 ${devices.lightIntensity ? 'text-white' : 'text-[#7c4dff]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <LightIntensityIcon/>
        </span>
      </div>
      <span className={`mt-2 text-lg font-medium ${devices.lightIntensity ? 'text-white' : 'text-[#7c4dff]'}`}>
        Light Intensity
      </span>
    </div>

    </div>
  );
};

export default DeviceControls;
