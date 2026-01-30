import React from 'react';
import './Background.css';
import fondImage from './fond.png';
import PixelBlast from './PixelBlast';
import { useTheme } from '../../../hooks/useTheme';

interface BackgroundProps {
  className?: string;
}

const Background = ({ className }: BackgroundProps) => {
  const { isDarkMode } = useTheme();
  const dotColor = isDarkMode ? '#b0b0b0' : '#000000';

  return (
    <>
      <div className={`animated-background ${className || ''}`}>
        <img className="fond" src={fondImage} alt="" />
        <PixelBlast
          variant="diamond"
          pixelSize={3}
          color={dotColor}
          patternScale={2.5}
          patternDensity={0}
          pixelSizeJitter={0}
          enableRipples={false}
          speed={2}
          edgeFade={0.1}
          liquid={false}
          transparent={true}
        />
      </div>
    </>
  );
};

export default Background;