import React, { useMemo } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useViewportIntersection } from '../hooks/useViewportIntersection';

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  direction?: 'up' | 'down';
}

export function ParallaxSection({
  children,
  speed = 0.3,
  className = '',
  direction = 'up'
}: ParallaxSectionProps) {
  const { scrollY } = useScrollPosition();
  const { ref, isIntersecting } = useViewportIntersection({
    threshold: 0,
    rootMargin: '50% 0px',
    triggerOnce: false
  });

  // Memoize the parallax calculation for better performance
  const parallaxOffset = useMemo(() => {
    if (!isIntersecting) return 0;
    return Math.round(scrollY * speed * (direction === 'up' ? -1 : 1));
  }, [isIntersecting, scrollY, speed, direction]);

  return (
    <div
      ref={ref}
      className={`parallax-section ${className}`}
      style={{
        transform: `translate3d(0, ${parallaxOffset}px, 0)`,
        willChange: isIntersecting ? 'transform' : 'auto'
      }}
    >
      {children}
    </div>
  );
}