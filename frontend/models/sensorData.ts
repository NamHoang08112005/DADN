export interface SensorData {
    date: string;
    humidity: number;
    light: number;
    temperature: number;
    airQuality: number;
  }
  
  export const fetchSensorData = async (timeframe: string = 'Month'): Promise<SensorData[]> => {
    return [
      { date: '1 Oct', humidity: 35, light: 80, temperature: 23, airQuality: 50 },
      { date: '3 Oct', humidity: 65, light: 75, temperature: 25, airQuality: 45 },
      { date: '7 Oct', humidity: 45, light: 70, temperature: 22, airQuality: 55 },
      { date: '10 Oct', humidity: 70, light: 60, temperature: 24, airQuality: 65 },
      { date: '14 Oct', humidity: 55, light: 50, temperature: 26, airQuality: 80 },
      { date: '20 Oct', humidity: 45, light: 40, temperature: 22, airQuality: 60 },
      { date: '23 Oct', humidity: 30, light: 35, temperature: 20, airQuality: 70 },
    ];
  };
  