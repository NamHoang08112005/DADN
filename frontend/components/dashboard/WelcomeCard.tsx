import React from 'react';
import { WeatherIcon, TemperatureIcon } from '../ui/Icons';
import { WeatherData } from '../../models/weatherData';

interface WelcomeCardProps {
  userName: string;
  weatherData: WeatherData;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName, weatherData }) => {
  const { temperature, condition, airQuality } = weatherData;
  
  return (
    <div className="bg-amber-100 rounded-2xl p-6 flex items-center relative overflow-hidden">
      <div className="z-10">
        <h1 className="text-3xl font-bold text-amber-800">Hello, {userName}!</h1>
        <p className="text-amber-700 mt-1">Welcome back to Smart Home Dashboard!</p>
        <p className="text-amber-700">The air quality is {airQuality} & fresh you can go out today.</p>
        
        <div className="mt-4 flex items-center">
          <div className="text-2xl flex items-center">
            <span className="text-black mr-2">
              <TemperatureIcon />
            </span>
            <span className="text-[#242424]">+{temperature}°C</span>
            <span className="ml-2 text-sm text-[#242424]">Outdoor temperature</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
            <span className="text-black mr-2">
             <WeatherIcon />
            </span>
         
          <span className="ml-2 text-[#242424]">{condition}</span>
        </div>
      </div>
      
  
      
     
      
   
    </div>
  );
};

export default WelcomeCard;
