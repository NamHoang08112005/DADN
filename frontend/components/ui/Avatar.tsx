import React from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string;
    alt?: string;
    size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Profile picture',
    size = 40
}) => {
    return (
        <div
            className="rounded-full bg-purple-500 overflow-hidden"
            style={{ width: size, height: size }}
        >
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                    {alt.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
}; 