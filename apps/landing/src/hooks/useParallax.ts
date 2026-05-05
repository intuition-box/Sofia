import { useEffect, useRef } from 'react';

interface ParallaxOptions {
  speed?: number;
  zoom?: boolean;
  zoomMax?: number;
}

// Ease in-out cubic
function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
) {
  const ref = useRef<T>(null);
  const { speed = 0.3, zoom = false, zoomMax = 1.15 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const raw = (vh / 2 - center) / vh; // -0.5 to 0.5

      // Apply easing to the absolute progress
      const sign = raw >= 0 ? 1 : -1;
      const eased = sign * easeInOut(Math.min(1, Math.abs(raw) * 2));

      const translateY = eased * speed * 100;

      if (zoom) {
        const zoomProgress = easeInOut(Math.min(1, Math.abs(raw) * 2));
        const scale = 1 + zoomProgress * (zoomMax - 1);
        el.style.transform = `translateY(${translateY}px) scale(${Math.min(scale, zoomMax)})`;
      } else {
        el.style.transform = `translateY(${translateY}px)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed, zoom, zoomMax]);

  return ref;
}
