import React, { useEffect } from 'react';
import { useTextSplit } from '../hooks/useTextSplit';
import { useViewportIntersection } from '../hooks/useViewportIntersection';

interface AnimatedTextProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  animationType?: 'fade-up' | 'split-words';
  delay?: number;
}

export function AnimatedText({
  children,
  as: Component = 'p',
  className = '',
  animationType = 'fade-up',
  delay = 0
}: AnimatedTextProps) {
  const { ref: splitRef, animateIn } = useTextSplit();
  const { ref: intersectionRef, isIntersecting } = useViewportIntersection();

  useEffect(() => {
    if (isIntersecting && animationType === 'split-words') {
      setTimeout(animateIn, delay);
    }
  }, [isIntersecting, animateIn, delay, animationType]);

  const combinedRef = (element: HTMLElement | null) => {
    if (element) {
      if (animationType === 'split-words') {
        splitRef.current = element;
      }
      intersectionRef.current = element;
    }
  };

  if (animationType === 'split-words') {
    return (
      <Component
        ref={combinedRef}
        className={`animated-text split-text ${className}`}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      ref={intersectionRef}
      className={`animated-text fade-text ${isIntersecting ? 'visible' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </Component>
  );
}