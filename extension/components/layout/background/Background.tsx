import React from 'react';
import './Background.css';
import fondImage from './fond.png';

interface BackgroundProps {
  className?: string;
}

const Background: React.FC<BackgroundProps> = ({ className }) => {
  return (
    <div className={`animated-background ${className || ''}`}>
      <img className="fond" src={fondImage} alt="" />
      <div className="gradient-container">
        <div className="gradientun"></div>
        <div className="gradientdeux"></div>
        <div className="gradienttrois"></div>
      </div>
    </div>
  );
};

export default Background;