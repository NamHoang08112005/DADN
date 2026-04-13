import { useState, useEffect } from 'react';
import { fetchWeatherData, WeatherData } from '../models/weatherData';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    condition: '',
    airQuality: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchWeatherData();
        setWeather(data);
        setError(null);
      } catch (err) {
        setError('Failed to load weather data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, []);

  return { weather, loading, error };
};
