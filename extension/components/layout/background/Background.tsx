import React from 'react';
import './Background.css';
import fondImage from './fond.png';
import PixelBlast from './PixelBlast';

interface BackgroundProps {
  className?: string;
}

const Background = ({ className }: BackgroundProps) => {
  return (
    <>
      <div className={`animated-background ${className || ''}`}>
        <img className="fond" src={fondImage} alt="" />
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#969696"
          patternScale={1}
          patternDensity={0.9}
          pixelSizeJitter={0.2}
          enableRipples={false}
          speed={0.9}
          edgeFade={0}
          liquid={false}
          transparent={true}
        />
      </div>
      <div className="background-blur-layer"></div>
    </>
  );
};

export default Background;