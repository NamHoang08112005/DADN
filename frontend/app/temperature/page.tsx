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

interface TemperatureData {
    value: number;
    timestamp: string;
}

interface TemperatureStats {
    current: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    stdDev: number;
}

// Demo data generation functions
const generateRandomTemperature = (min: number, max: number) => {
    return +(min + Math.random() * (max - min)).toFixed(1);
};

const generateHistoricalData = (count: number, baseTemp: number) => {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => ({
        value: generateRandomTemperature(baseTemp - 2, baseTemp + 2),
        timestamp: new Date(now.getTime() - (count - i) * 5000).toISOString()
    }));
};

const calculateStats = (data: TemperatureData[]): TemperatureStats => {
    if (data.length === 0) {
        return {
            current: 0,
            min: 0,
            max: 0,
            avg: 0,
            median: 0,
            stdDev: 0
        };
    }

    // Parse values as numbers and filter out any invalid values
    const values = data.map(d => parseFloat(d.value.toString())).filter(v => !isNaN(v));
    if (values.length === 0) return {
        current: 0,
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        stdDev: 0
    };

    const sortedValues = [...values].sort((a, b) => a - b);

    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const median = sortedValues[Math.floor(sortedValues.length / 2)];

    // Calculate standard deviation
    const squareDiffs = values.map(value => {
        const diff = value - avg;
        return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
        current: values[values.length - 1],
        min,
        max,
        avg,
        median,
        stdDev
    };
};

const TemperatureMonitor = () => {
    const [currentTemp, setCurrentTemp] = useState<number>(25);
    const [historicalData, setHistoricalData] = useState<TemperatureData[]>([]);
    const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [stats, setStats] = useState<TemperatureStats>({
        current: 25,
        min: 23,
        max: 27,
        avg: 25,
        median: 25,
        stdDev: 0.5
    });

    // Check if backend is running
    const checkBackendConnection = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/sensor/');  // Added trailing slash to avoid redirect
            if (response.ok) {
                setIsBackendConnected(true);
                return true;
            }
            setIsBackendConnected(false);
            return false;
        } catch (error) {
            console.error('Backend connection error:', error);
            setIsBackendConnected(false);
            return false;
        }
    };

    const fetchLatestTemperature = async () => {
        if (!isBackendConnected) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/sensor/temp/latest');
            if (!response.ok) {
                throw new Error('Failed to fetch latest temperature');
            }
            const data = await response.json();
            if (data.value) {
                const tempValue = parseFloat(data.value);
                if (!isNaN(tempValue)) {
                    setCurrentTemp(tempValue);
                }
            }
        } catch (error) {
            console.error('Error fetching latest temperature:', error);
            setIsBackendConnected(false);
        }
    };

    const fetchHistoricalData = async () => {
        if (!isBackendConnected) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/sensor/temp/history1000');
            if (!response.ok) {
                throw new Error('Failed to fetch historical data');
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                // Parse the data and ensure all values are valid numbers
                const validData = data.map(item => ({
                    value: parseFloat(item.value),
                    timestamp: item.timestamp
                })).filter(item => !isNaN(item.value));

                // Sort data by timestamp to ensure correct order
                const sortedData = validData.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                setHistoricalData(sortedData);
                const newStats = calculateStats(sortedData);
                setStats(newStats);
            }
        } catch (error) {
            console.error('Error fetching historical temperature data:', error);
            setIsBackendConnected(false);
        }
    };

    useEffect(() => {
        let isComponentMounted = true;

        const initializeData = async () => {
            if (!isComponentMounted) return;

            const isConnected = await checkBackendConnection();
            if (isConnected && isComponentMounted) {
                await fetchHistoricalData();
                await fetchLatestTemperature();
            }
        };

        initializeData();

        // Update data every 5 seconds, but only check connection if we're not already connected
        const interval = setInterval(async () => {
            if (!isComponentMounted) return;

            if (!isBackendConnected) {
                const isConnected = await checkBackendConnection();
                if (!isConnected || !isComponentMounted) return;
            }

            await fetchLatestTemperature();
            await fetchHistoricalData();
        }, 300000);

        return () => {
            isComponentMounted = false;
            clearInterval(interval);
        };
    }, [activeTab, isBackendConnected]); // Added isBackendConnected to dependencies

    // Add a message when backend is not connected
    if (!isBackendConnected) {
        return (
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <Header />
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-red-600 mb-2">Cannot Connect to Backend Server</h2>
                            <p className="text-gray-600">Please make sure the backend server is running at http://127.0.0.1:8000</p>
                            <button
                                onClick={checkBackendConnection}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getTemperatureStatus = (temp: number) => {
        if (temp >= 35) return { text: 'Danger - Too Hot!', color: 'text-red-600' };
        if (temp >= 30) return { text: 'Warning - High Temperature', color: 'text-yellow-600' };
        if (temp <= 15) return { text: 'Warning - Low Temperature', color: 'text-blue-600' };
        return { text: 'Normal Temperature', color: 'text-green-600' };
    };

    const chartData = {
        labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Temperature (°C)',
                data: historicalData.map(d => d.value),
                borderColor: '#C084FC',
                tension: 0.1,
                pointRadius: 1, // Even smaller points for better performance with 1000 points
                pointHoverRadius: 3,
                borderWidth: 1.5,
                fill: false
            }
        ]
    };

    const chartOptions = {
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
                },
                min: Math.floor(stats.min - 1),
                max: Math.ceil(stats.max + 1)
            }
        }
    };

    const status = getTemperatureStatus(currentTemp);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <div className="flex-1 flex flex-col p-6 overflow-auto">
                <Header />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Temperature Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-[#242424] mb-4">Current Temperature</h2>
                        <div className="text-4xl font-bold mb-2 text-[#242424]">{currentTemp}°C</div>
                        <div className={`font-medium ${status.color}`}>
                            {status.text}
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-[#242424] mb-4">Statistics</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Minimum:</span>
                                <span className="font-medium text-[#242424]">{stats.min}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Maximum:</span>
                                <span className="font-medium text-[#242424]">{stats.max}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Average:</span>
                                <span className="font-medium text-[#242424]">{stats.avg.toFixed(1)}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Median:</span>
                                <span className="font-medium text-[#242424]">{stats.median}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Standard Deviation:</span>
                                <span className="font-medium text-[#242424]">{stats.stdDev.toFixed(2)}°C</span>
                            </div>
                        </div>
                    </div>

                    {/* Historical Data Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-gray-500 text-sm">Statistics</h3>
                                <h2 className="text-xl font-semibold text-[#242424]">Temperature History</h2>
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
                        <div className="h-[400px]">
                            <Line
                                data={chartData}
                                options={chartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemperatureMonitor; 