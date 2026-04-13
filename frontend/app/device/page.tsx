'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { FanIcon } from '../../components/ui/Icons';

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

interface FanControlProps {
    initialSpeed?: number;
    onSpeedChange?: (speed: number) => void;
  }

const DeviceControl: React.FC<FanControlProps> = ({ 
    initialSpeed = 50, 
    onSpeedChange = () => {} 
}) => {
    // Fan states
    const [isFanOn, setIsFanOn] = useState(false);
    const [speed, setSpeed] = useState(initialSpeed);
    const [fanLoading, setFanLoading] = useState(false);

    // Light states
    const [isLightOn, setIsLightOn] = useState(false);
    const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
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
    
    const [selectedColor, setSelectedColor] = useState(colors[0]); // Default Red
    
    // Bật quạt với tốc độ chỉ định
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
            
            // Sau khi bật đèn, cũng cập nhật màu sắc hiện tại
            await changeColor(selectedColor.value);
        } catch (error) {
            console.error('Error turning on light:', error);
            alert('Failed to turn on light. Please try again.');
        } finally {
            setLightLoading(false);
        }
    };
    
    // Tắt đèn
    const turnOffLight = async () => {
        try {
            setLightLoading(true);
            const response = await fetch(`${API_BASE_URL}/light/switch/off`, {
                method: 'POST',
            });
            
            if (!response.ok) {
                throw new Error('Failed to turn off light');
            }
            
            const data = await response.json();
            console.log('Light turned off:', data);
            setIsLightOn(false);
        } catch (error) {
            console.error('Error turning off light:', error);
            alert('Failed to turn off light. Please try again.');
        } finally {
            setLightLoading(false);
        }
    };
    
    // Thay đổi màu đèn
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

    // === EVENT HANDLERS ===

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
    
    const handleLightToggle = async () => {
        if (!isLightOn) {
            await turnOnLight();
        } else {
            await turnOffLight();
        }
    };
    
    const handleColorSelect = async (color: typeof colors[0]) => {
        setSelectedColor(color);
        setIsColorDropdownOpen(false);
        
        if (isLightOn) {
            await changeColor(color.value);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            
            <div className="flex-1 flex flex-col p-6 overflow-auto">
                <Header />
                
                {/* Fan Control Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-gray-500 text-sm">Device Control</h3>
                            <h2 className="text-xl font-semibold text-[#242424]">Fan Status</h2>
                        </div>
                        <button
                            onClick={handleFanToggle}
                            disabled={fanLoading}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                fanLoading ? 'bg-gray-400 cursor-not-allowed' :
                                isFanOn ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#7a40f2] hover:bg-[#6930e0] text-white'
                            }`}
                        >
                            {fanLoading ? 'Processing...' : (isFanOn ? 'Turn Off' : 'Turn On')}
                        </button>
                    </div>
                    
                    {isFanOn && (
                        <div className="card bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center text-[#7a40f2]">
                                    <span className="w-6 h-6 mr-3 text-[#7c4dff]">
                                        <FanIcon/>
                                    </span>
                                    <span className="text-xl font-medium">Fan</span>
                                </div>
                                <span className="text-xl text-[#7a40f2] font-medium">{speed}</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <div className="text-7xl font-light text-gray-300 my-4">{speed}</div>
                                <div className="text-gray-400 mb-6">Fan Speed</div>
                                
                                <div className="w-full mb-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">0</span>
                                        <span className="text-[#7a40f2]">50</span>
                                        <span className="text-amber-500">100</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={speed}
                                        onChange={handleSliderChange}
                                        disabled={fanLoading}
                                        className={`w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer ${fanLoading ? 'opacity-50' : ''}`}
                                        style={{
                                            background: `linear-gradient(to right, 
                                                #7a40f2 0%, 
                                                #7a40f2 ${speed}%, 
                                                #e5e7eb ${speed}%, 
                                                #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                                
                                <div className="flex justify-between w-full">
                                    <button
                                        onClick={decrementSpeed}
                                        disabled={fanLoading}
                                        className={`w-16 h-16 rounded-full bg-[#7a40f2] text-white flex items-center justify-center text-3xl font-medium focus:outline-none ${fanLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={incrementSpeed}
                                        disabled={fanLoading}
                                        className={`w-16 h-16 rounded-full bg-[#7a40f2] text-white flex items-center justify-center text-3xl font-medium focus:outline-none ${fanLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Light Control Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-gray-500 text-sm">Device Control</h3>
                            <h2 className="text-xl font-semibold text-[#242424]">Light Status</h2>
                        </div>
                        <button
                            onClick={handleLightToggle}
                            disabled={lightLoading}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                lightLoading ? 'bg-gray-400 cursor-not-allowed' :
                                isLightOn ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#7a40f2] hover:bg-[#6930e0] text-white'
                            }`}
                        >
                            {lightLoading ? 'Processing...' : (isLightOn ? 'Turn Off' : 'Turn On')}
                        </button>
                    </div>
                    
                    {isLightOn && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">LED Color</span>
                            </div>
                            
                            <div className="relative">
                                <button
                                    onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                                    disabled={lightLoading}
                                    className={`w-full flex items-center text-black justify-between px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a40f2] focus:border-transparent bg-gray-50 ${lightLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <div 
                                            className="w-5 h-5 rounded-full mr-3 border border-gray-300" 
                                            style={{ backgroundColor: selectedColor.value }}
                                        />
                                        <span className="font-medium">{selectedColor.name}</span>
                                    </div>
                                    <span className="text-lg">▼</span>
                                </button>
                                
                                {isColorDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-gray-50 rounded-lg shadow-lg border border-gray-200">
                                        {colors.map((color) => (
                                            <div
                                                key={color.name}
                                                className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer text-black"
                                                onClick={() => handleColorSelect(color)}
                                            >
                                                <div 
                                                    className="w-5 h-5 rounded-full mr-3 border border-gray-300" 
                                                    style={{ backgroundColor: color.value }}
                                                />
                                                <span className="font-medium">{color.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeviceControl;