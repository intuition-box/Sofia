import { useEffect, useRef, useState } from 'react';

export function useScrollTrigger() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const [showText, setShowText] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Trigger threshold: start effect after scrolling 10% of viewport height
      const triggerThreshold = windowHeight * 0.1;

      // Effect duration: complete over next 150% of viewport height (longer duration)
      const effectDuration = windowHeight * 1.5;

      if (scrollY >= triggerThreshold) {
        setIsTriggered(true);

        // Calculate progress from 0 to 1 over the effect duration
        const progress = Math.min((scrollY - triggerThreshold) / effectDuration, 1);
        setScrollProgress(progress);

        // Show text earlier and keep it visible longer
        if (progress >= 0.3) {
          setShowText(true);
        }
      } else {
        setIsTriggered(false);
        setScrollProgress(0);
        setShowText(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { ref, scrollProgress, isTriggered, showText };
}