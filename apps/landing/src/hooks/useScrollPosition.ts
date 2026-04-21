import { useEffect, useState, useCallback } from 'react';

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');

  const updateScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollDirection(prev => currentScrollY > scrollY ? 'down' : 'up');
    setScrollY(currentScrollY);
  }, [scrollY]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Throttle scroll events for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollPosition]);

  return { scrollY, scrollDirection };
}