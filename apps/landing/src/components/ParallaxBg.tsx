import type { CSSProperties, ReactNode } from 'react';
import { useParallax } from '../hooks/useParallax';

interface ParallaxBgProps {
  src: string;
  speed?: number;
  zoom?: boolean;
  zoomMax?: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function ParallaxBg({
  src, speed = 0.2, zoom = false, zoomMax = 1.15,
  children, style, className,
}: ParallaxBgProps) {
  const bgRef = useParallax<HTMLDivElement>({ speed, zoom, zoomMax });

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: '-20%',
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          willChange: 'transform',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
