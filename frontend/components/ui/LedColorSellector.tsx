// components/ui/LedColorSelector.tsx
import React, { useState } from 'react';

interface LedColorSelectorProps {
  currentColor?: string;
  onColorChange?: (color: string) => void;
}

const LedColorSelector: React.FC<LedColorSelectorProps> = ({ 
  currentColor = 'RED',
  onColorChange = () => {} 
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const colorOptions = ['RED', 'GREEN', 'MAGENTA', 'CYAN', 'ORANGE', 'YELLOW', 'PURPLE','BLACK', 'WHITE'];
  
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onColorChange(color);
  };
  
  // Icon cho palette màu sắc
  const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
  
  return (
    <div className="p-4 rounded-2xl shadow-sm flex flex-col items-center bg-white">
      <div className="flex justify-between w-full mb-2">
        <span className="text-lg font-medium text-gray-800">LED COLOR</span>
      </div>
      
      <div className="w-12 h-12 flex items-center justify-center my-2">
        <span className="w-8 h-8 text-[#7c4dff]">
          <PaletteIcon />
        </span>
      </div>
      
      <div className="mt-2 w-full">
        <div className="relative">
          <select 
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full py-2 pl-3 pr-10 text-lg font-medium text-[#7c4dff] bg-white border border-[#7c4dff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff] appearance-none"
          >
            {colorOptions.map(color => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-6 h-6 text-[#7c4dff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedColorSelector;