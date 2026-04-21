import React from 'react';
import './ContentWrapper.css';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ContentWrapper component that adds a backdrop blur filter
 * to make text readable over the PixelBlast animation
 */
export default function ContentWrapper({
  children,
  className = '',
  style = {}
}: ContentWrapperProps): JSX.Element {
  return (
    <div className={`content-wrapper ${className}`} style={style}>
      {children}
    </div>
  );
}
