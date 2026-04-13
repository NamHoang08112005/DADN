'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface SensorData {
    timestamp: string;
    humidity: number;
    temperature: number;
    lightIntensity: number;
    airQuality: number;
}

interface SensorStatus {
    value: number;
    status: string;
    color: string;
}

const generateRandomValue = (min: number, max: number) => {
    return +(min + Math.random() * (max - min)).toFixed(1);
};

const generateHistoricalData = (count: number) => {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(now.getTime() - (count - i) * 5000).toISOString(),
        humidity: generateRandomValue(30, 70),
        temperature: generateRandomValue(23, 27),
        lightIntensity: generateRandomValue(40, 90),
        airQuality: generateRandomValue(60, 95)
    }));
};

const getTemperatureStatus = (value: number): SensorStatus => {
    if (value >= 35) return { value, status: 'Danger - Too Hot!', color: 'text-red-600' };
    if (value >= 30) return { value, status: 'Warning - High', color: 'text-yellow-600' };
    if (value <= 15) return { value, status: 'Warning - Low', color: 'text-blue-600' };
    return { value, status: 'Normal', color: 'text-green-600' };
};

const getHumidityStatus = (value: number): SensorStatus => {
    if (value >= 70) return { value, status: 'Too Humid', color: 'text-red-600' };
    if (value >= 60) return { value, status: 'High Humidity', color: 'text-yellow-600' };
    if (value <= 30) return { value, status: 'Too Dry', color: 'text-yellow-600' };
    return { value, status: 'Optimal', color: 'text-green-600' };
};

const getLightStatus = (value: number): SensorStatus => {
    if (value >= 80) return { value, status: 'Very Bright', color: 'text-yellow-600' };
    if (value <= 20) return { value, status: 'Too Dark', color: 'text-blue-600' };
    return { value, status: 'Good', color: 'text-green-600' };
};

const getAirQualityStatus = (value: number): SensorStatus => {
    if (value >= 80) return { value, status: 'Excellent', color: 'text-green-600' };
    if (value >= 60) return { value, status: 'Good', color: 'text-blue-600' };
    if (value >= 40) return { value, status: 'Fair', color: 'text-yellow-600' };
    return { value, status: 'Poor', color: 'text-red-600' };
};

const Dashboard = () => {
    const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
    const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
    const [visibleDatasets, setVisibleDatasets] = useState({
        humidity: true,
        temperature: true,
        lightIntensity: true,
        airQuality: true
    });
    const [currentValues, setCurrentValues] = useState({
        humidity: getHumidityStatus(50),
        temperature: getTemperatureStatus(25),
        lightIntensity: getLightStatus(60),
        airQuality: getAirQualityStatus(75)
    });

    useEffect(() => {
        // Initialize with demo data
        const initialData = generateHistoricalData(50);
        setHistoricalData(initialData);
        updateCurrentValues(initialData[initialData.length - 1]);

        // Update data every 5 seconds
        const interval = setInterval(() => {
            const newData = {
                timestamp: new Date().toISOString(),
                humidity: generateRandomValue(30, 70),
                temperature: generateRandomValue(23, 27),
                lightIntensity: generateRandomValue(40, 90),
                airQuality: generateRandomValue(60, 95)
            };

            setHistoricalData(prev => {
                const updated = [...prev.slice(-49), newData];
                updateCurrentValues(newData);
                return updated;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const updateCurrentValues = (data: SensorData) => {
        setCurrentValues({
            humidity: getHumidityStatus(data.humidity),
            temperature: getTemperatureStatus(data.temperature),
            lightIntensity: getLightStatus(data.lightIntensity),
            airQuality: getAirQualityStatus(data.airQuality)
        });
    };

    const toggleDataset = (dataset: keyof typeof visibleDatasets) => {
        setVisibleDatasets(prev => ({
            ...prev,
            [dataset]: !prev[dataset]
        }));
    };

    const chartData = {
        labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Humidity',
                data: visibleDatasets.humidity ? historicalData.map(d => d.humidity) : [],
                borderColor: '#93C5FD',
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                hidden: !visibleDatasets.humidity
            },
            {
                label: 'Light Intensity',
                data: visibleDatasets.lightIntensity ? historicalData.map(d => d.lightIntensity) : [],
                borderColor: '#F472B6',
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                hidden: !visibleDatasets.lightIntensity
            },
            {
                label: 'Temperature',
                data: visibleDatasets.temperature ? historicalData.map(d => d.temperature) : [],
                borderColor: '#C084FC',
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                hidden: !visibleDatasets.temperature
            },
            {
                label: 'Air Quality',
                data: visibleDatasets.airQuality ? historicalData.map(d => d.airQuality) : [],
                borderColor: '#4ADE80',
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                hidden: !visibleDatasets.airQuality
            }
        ]
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <div className="flex-1 flex flex-col p-6 overflow-auto">
                <Header />

                {/* Current Values Display */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="text-gray-500 text-sm">Humidity</h3>
                        <div className="text-2xl font-bold text-[#242424] mt-2">{currentValues.humidity.value}%</div>
                        <div className={`text-sm font-medium ${currentValues.humidity.color}`}>
                            {currentValues.humidity.status}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="text-gray-500 text-sm">Temperature</h3>
                        <div className="text-2xl font-bold text-[#242424] mt-2">{currentValues.temperature.value}°C</div>
                        <div className={`text-sm font-medium ${currentValues.temperature.color}`}>
                            {currentValues.temperature.status}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="text-gray-500 text-sm">Light Intensity</h3>
                        <div className="text-2xl font-bold text-[#242424] mt-2">{currentValues.lightIntensity.value}%</div>
                        <div className={`text-sm font-medium ${currentValues.lightIntensity.color}`}>
                            {currentValues.lightIntensity.status}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="text-gray-500 text-sm">Air Quality</h3>
                        <div className="text-2xl font-bold text-[#242424] mt-2">{currentValues.airQuality.value}%</div>
                        <div className={`text-sm font-medium ${currentValues.airQuality.color}`}>
                            {currentValues.airQuality.status}
                        </div>
                    </div>
                </div>

                {/* Sensors Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm flex-grow">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-gray-500 text-sm">Statistics</h3>
                            <h2 className="text-xl font-semibold text-[#242424]">Sensors</h2>
                        </div>
                        <div className="flex space-x-2 bg-gray-100 rounded-full p-1">
                            {(['Day', 'Week', 'Month', 'Year'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-1 rounded-full text-sm ${activeTab === tab
                                        ? 'bg-blue-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex mb-4 space-x-6">
                        <button
                            className="flex items-center"
                            onClick={() => toggleDataset('humidity')}
                        >
                            <div className={`w-3 h-3 rounded-full mr-2 ${visibleDatasets.humidity ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Humidity</span>
                        </button>
                        <button
                            className="flex items-center"
                            onClick={() => toggleDataset('lightIntensity')}
                        >
                            <div className={`w-3 h-3 rounded-full mr-2 ${visibleDatasets.lightIntensity ? 'bg-pink-400' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Light Intensity</span>
                        </button>
                        <button
                            className="flex items-center"
                            onClick={() => toggleDataset('temperature')}
                        >
                            <div className={`w-3 h-3 rounded-full mr-2 ${visibleDatasets.temperature ? 'bg-purple-400' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Temperature</span>
                        </button>
                        <button
                            className="flex items-center"
                            onClick={() => toggleDataset('airQuality')}
                        >
                            <div className={`w-3 h-3 rounded-full mr-2 ${visibleDatasets.airQuality ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">Air Quality</span>
                        </button>
                    </div>

                    <div className="h-[400px]">
                        <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: {
                                    duration: 300
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            maxRotation: 0,
                                            autoSkip: true,
                                            maxTicksLimit: 10
                                        }
                                    },
                                    y: {
                                        grid: {
                                            color: '#f3f4f6'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 