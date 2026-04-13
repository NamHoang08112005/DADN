// components/dashboard/FanControl.tsx
import React, { useState } from 'react';
import { FanIcon } from '../ui/Icons';

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

interface FanControlProps {
  initialSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

const FanControl: React.FC<FanControlProps> = ({ 
  initialSpeed = 50, 
  onSpeedChange = () => {} 
}) => {
  // Fan states
  const [isFanOn, setIsFanOn] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [fanLoading, setFanLoading] = useState(false);

  const turnOnFan = async (fanSpeed: number) => {
      try {
          setFanLoading(true);
          const response = await fetch(`${API_BASE_URL}/fan/fan/on`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ speed: fanSpeed }),
          });
          
          if (!response.ok) {
              throw new Error('Failed to turn on fan');
          }
          
          const data = await response.json();
          console.log('Fan turned on:', data);
          setIsFanOn(true);
      } catch (error) {
          console.error('Error turning on fan:', error);
          alert('Failed to turn on fan. Please try again.');
      } finally {
          setFanLoading(false);
      }
  };

  // Tắt quạt
  const turnOffFan = async () => {
      try {
          setFanLoading(true);
          const response = await fetch(`${API_BASE_URL}/fan/fan/off`, {
              method: 'POST',
          });
          
          if (!response.ok) {
              throw new Error('Failed to turn off fan');
          }
          
          const data = await response.json();
          console.log('Fan turned off:', data);
          setIsFanOn(false);
      } catch (error) {
          console.error('Error turning off fan:', error);
          alert('Failed to turn off fan. Please try again.');
      } finally {
          setFanLoading(false);
      }
  };
  
  const handleSpeedChange = async (newSpeed: number) => {
        const clampedSpeed = Math.max(0, Math.min(100, newSpeed));
        setSpeed(clampedSpeed);
        onSpeedChange(clampedSpeed);
        
        if (newSpeed > 0) {
            if (!isFanOn) {
                await turnOnFan(newSpeed);
            } else {
                await turnOnFan(newSpeed); // Cập nhật tốc độ quạt
            }
        } else {
            await turnOffFan(); // Tắt quạt nếu tốc độ = 0
        }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleSpeedChange(parseInt(e.target.value, 10));
  };
  
  const handleFanToggle = async () => {
      if (!isFanOn) {
          await turnOnFan(speed);
      } else {
          await turnOffFan();
      }
  };

  const incrementSpeed = async () => {
      if (speed < 100) {
          const newSpeed = speed + 5;
          setSpeed(newSpeed);
          await turnOnFan(newSpeed);
      }
  };

  const decrementSpeed = async () => {
      if (speed > 0) {
          const newSpeed = speed - 5;
          setSpeed(newSpeed);
          
          if (newSpeed <= 0) {
              await turnOffFan();
          } else {
              await turnOnFan(newSpeed);
          }
      }
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <span className="w-6 h-6 mr-3 text-[#7c4dff]">
            <FanIcon/>
        </span>
        <h2 className="text-xl font-medium text-[#7c4dff]">Fan</h2>
        <div className="ml-auto text-[#7c4dff] font-medium">{speed}</div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        {/* Value indicator ở giữa */}
        <div className="flex-1 text-center">
          <div className="text-5xl font-light text-gray-200">{speed}</div>
          <div className="text-gray-400 text-sm mt-1">Fan Speed</div>
        </div>
      </div>
      
      <div className="relative mb-6">
        {/* Hiển thị giá trị 0, 50, 100 */}
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">0</span>
          <span className="text-[#7c4dff]">50</span>
          <span className="text-orange-400">100</span>
        </div>
        
        {/* Custom range slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={speed}
          onChange={handleSliderChange}
          className="w-full appearance-none bg-gray-200 h-3 rounded-lg outline-none"
          style={{
            background: `linear-gradient(to right, #7c4dff 0%, #7c4dff ${speed}%, #e5e7eb ${speed}%, #e5e7eb 100%)`
          }}
        />
      </div>
      
      <div className="flex justify-between">
        {/* Button giảm */}
        <button
          onClick={decrementSpeed}
          className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <span className="text-xl font-bold">−</span>
        </button>
        
        {/* Button tăng */}
        <button
          onClick={incrementSpeed}
          className="w-12 h-12 bg-[#7c4dff] rounded-full flex items-center justify-center text-white hover:bg-opacity-90 transition-colors"
        >
          <span className="text-xl font-bold">+</span>
        </button>
      </div>
    </div>
  );
};

export default FanControl;