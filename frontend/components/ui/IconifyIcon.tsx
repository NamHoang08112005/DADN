// components/ui/IconifyIcon.tsx
import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  icon: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ 
  icon, 
  width = 24, 
  height = 24, 
  color = 'currentColor', 
  className = '', 
  onClick 
}) => {
  return (
    <IconifyIcon
      icon={icon}
      width={width}
      height={height}
      color={color}
      className={className}
      onClick={onClick}
    />
  );
};

export default Icon;