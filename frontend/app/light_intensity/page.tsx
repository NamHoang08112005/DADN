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
  Legend,
} from 'chart.js';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { LightIntensityIcon } from '../../components/ui/Icons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LightData {
  value: number;
  timestamp: string;
}

interface LightStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
}

// Demo data generation functions
const generateRandomLight = (min: number, max: number) => {
  return +(min + Math.random() * (max - min)).toFixed(1);
};

const generateHistoricalData = (count: number, baseLight: number) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    value: generateRandomLight(baseLight - 10, baseLight + 10),
    timestamp: new Date(now.getTime() - (count - i) * 5000).toISOString()
  }));
};

const calculateStats = (data: LightData[]): LightStats => {
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

  const values = data.map(d => d.value);
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

const LightMonitor = () => {
  const [currentLight, setCurrentLight] = useState<number>(50);
  const [historicalData, setHistoricalData] = useState<LightData[]>([]);
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
  const [stats, setStats] = useState<LightStats>({
    current: 50,
    min: 40,
    max: 60,
    avg: 50,
    median: 50,
    stdDev: 2.5
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch latest light data from API
  const fetchLatestLightData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch latest light data from the API
      const response = await fetch('http://127.0.0.1:8000/sensor/light/latest');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update current light value - ensure it's a number and rounded to 1 decimal
      const lightValue = parseFloat(parseFloat(data.value).toFixed(1));
      setCurrentLight(lightValue);
      
      // Update stats with the new value
      setStats(prevStats => ({
        ...prevStats,
        current: lightValue
      }));
      
    } catch (err) {
      console.error('Error fetching latest light data:', err);
      setError('Failed to fetch latest light data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch historical light data from API
  const fetchHistoricalLightData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch historical light data from the API
      const response = await fetch('http://127.0.0.1:8000/sensor/light/history1000');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API data to match our LightData interface
      const transformedData: LightData[] = data.map((item: any) => ({
        value: parseFloat(parseFloat(item.value).toFixed(1)), // Convert string to number and round to 1 decimal
        timestamp: item.timestamp
      }));
      
      // Update historical data
      setHistoricalData(transformedData);
      
      // Calculate and update stats
      const newStats = calculateStats(transformedData);
      setStats(newStats);
      
    } catch (err) {
      console.error('Error fetching historical light data:', err);
      setError('Failed to fetch historical light data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter data based on active tab
  const filterDataByTimeRange = (data: LightData[], tab: 'Day' | 'Week' | 'Month' | 'Year'): LightData[] => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (tab) {
      case 'Day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'Week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'Month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'Year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data.filter(item => new Date(item.timestamp) >= cutoffDate);
  };

  useEffect(() => {
    // Initialize with some demo data
    const initialData = generateHistoricalData(50, 50);
    const initialStats = calculateStats(initialData);
    setHistoricalData(initialData);
    setStats(initialStats);
    setCurrentLight(initialStats.current);

    // Fetch real data from API
    fetchLatestLightData();
    fetchHistoricalLightData();

    // Update data every 5 seconds
    const interval = setInterval(() => {
      fetchLatestLightData();
    }, 300000);

    return () => clearInterval(interval);
  }, []); // Remove activeTab dependency to prevent refetching on tab change

  // Add a new useEffect to update filtered data when activeTab changes
  useEffect(() => {
    if (historicalData.length > 0) {
      const filteredData = filterDataByTimeRange(historicalData, activeTab);
      // We don't need to set state here as we'll use the filtered data directly in the chart
    }
  }, [activeTab, historicalData]);

  const getLightStatus = (light: number) => {
    if (light >= 80) return { text: 'Very Bright', color: 'text-yellow-600' };
    if (light >= 60) return { text: 'Bright', color: 'text-green-600' };
    if (light <= 20) return { text: 'Too Dark', color: 'text-blue-600' };
    if (light <= 40) return { text: 'Low Light', color: 'text-yellow-600' };
    return { text: 'Optimal Light', color: 'text-green-600' };
  };

  // Filter data based on active tab
  const filteredData = filterDataByTimeRange(historicalData, activeTab);

  // Format date labels based on the active tab
  const formatDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (activeTab) {
      case 'Day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'Week':
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
      case 'Month':
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      case 'Year':
        return date.toLocaleDateString([], { month: 'short' });
      default:
        return date.toLocaleTimeString();
    }
  };

  const chartData = {
    labels: filteredData.map(d => formatDateLabel(d.timestamp)),
    datasets: [
      {
        label: 'Light Intensity (%)',
        data: filteredData.map(d => d.value),
        borderColor: '#7a40f2',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: false
      }
    ]
  };

  const status = getLightStatus(currentLight);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Light Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#242424]">Current Light Intensity</h2>
              <LightIntensityIcon />
            </div>
            <div className="text-4xl font-bold mb-2 text-[#242424]">
              {isLoading ? 'Loading...' : `${currentLight.toFixed(1)}%`}
            </div>
            <div className={`font-medium ${status.color}`}>
              {status.text}
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#242424] mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Minimum:</span>
                <span className="font-medium text-[#242424]">{stats.min.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Maximum:</span>
                <span className="font-medium text-[#242424]">{stats.max.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average:</span>
                <span className="font-medium text-[#242424]">
                  {isNaN(stats.avg) ? 'N/A' : stats.avg.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Median:</span>
                <span className="font-medium text-[#242424]">{stats.median.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Standard Deviation:</span>
                <span className="font-medium text-[#242424]">
                  {isNaN(stats.stdDev) ? 'N/A' : stats.stdDev.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Historical Data Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-gray-500 text-sm">Statistics</h3>
                <h2 className="text-xl font-semibold text-[#242424]">Light Intensity History</h2>
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
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading chart data...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : (
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
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightMonitor; 