import { useEffect, useRef } from 'react';

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.07, rootMargin: '0px 0px -25px 0px' }
);

export function useScrollAnim<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return ref;
}
