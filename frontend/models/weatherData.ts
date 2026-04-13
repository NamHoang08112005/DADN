export interface WeatherData {
    temperature: number;
    condition: string;
    airQuality: string;
  }
  
  export const fetchWeatherData = async (): Promise<WeatherData> => {
    return {
      temperature: 25,
      condition: 'Fuzzy cloudy weather',
      airQuality: 'good'
    };
  };