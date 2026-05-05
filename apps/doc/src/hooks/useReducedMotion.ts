import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(QUERY);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);

    setReduced(mql.matches);
    mql.addEventListener('change', handler);

    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);

  return reduced;
}
