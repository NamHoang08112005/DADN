import { useState, useEffect } from 'react';
import { fetchSensorData, SensorData } from '../models/sensorData';

type TimeframeType = 'Day' | 'Week' | 'Month' | 'Year';

export const useSensorData = (timeframe: TimeframeType = 'Month') => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sensorData = await fetchSensorData(timeframe);
        setData(sensorData);
        setError(null);
      } catch (err) {
        setError('Failed to load sensor data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeframe]);

  return { data, loading, error };
};
