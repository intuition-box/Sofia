import React, { useEffect } from 'react';
import { useViewportIntersection } from '../hooks/useViewportIntersection';

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  animationDelay?: number;
}

export function ScrollSection({
  children,
  className = '',
  animationDelay = 0
}: ScrollSectionProps) {
  const { ref, isIntersecting } = useViewportIntersection();

  return (
    <div
      ref={ref}
      className={`scroll-section ${isIntersecting ? 'visible' : ''} ${className}`}
      style={{
        transitionDelay: `${animationDelay}ms`
      }}
    >
      {children}
    </div>
  );
}