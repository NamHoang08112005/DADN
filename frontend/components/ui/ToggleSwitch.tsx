import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  color?: 'purple' | 'blue' | 'green' | 'pink';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle, color = "purple" }) => {
  // Xác định màu nền dựa trên trạng thái
  let bgColor = isOn
    ? "bg-white"
    : color === "purple" ? "bg-[#6e5cea]"
    : color === "blue" ? "bg-blue-500"
    : color === "green" ? "bg-green-500"
    : "bg-pink-500";
    
  // Đảm bảo có border khi nền trắng
  let borderStyle = isOn ? "border border-gray-200" : "";
  
  // Xác định màu cho vòng tròn
  let circleColor = isOn
    ? color === "purple" ? "bg-[#6e5cea]"
    : color === "blue" ? "bg-blue-500"
    : color === "green" ? "bg-green-500"
    : "bg-pink-500"
    : "bg-white";
  
  return (
    <div
      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${bgColor} ${borderStyle}`}
      onClick={onToggle}
    >
      <div
        className={`absolute top-1 left-1 ${circleColor} w-4 h-4 rounded-full shadow-md transition-transform duration-200 ease-in-out ${isOn ? 'transform translate-x-6' : ''}`}
      />
    </div>
  );
};

export default ToggleSwitch;