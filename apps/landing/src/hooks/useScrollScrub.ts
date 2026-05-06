import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Options {
  fromScale?: number;
  start?: string;
  end?: string;
  scrub?: number;
}

/**
 * useScrollScrub — scrub-scale an element as it crosses the viewport.
 * From `fromScale` up to 1 between `start` and `end`.
 */
export function useScrollScrub<T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
) {
  const ref = useRef<T>(null);
  const { fromScale = 0.94, start = 'top bottom', end = 'top center', scrub = 0.6 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { scale: fromScale, transformOrigin: 'center top' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start, end, scrub },
    });
    tl.to(el, { scale: 1, ease: 'none' });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [fromScale, start, end, scrub]);

  return ref;
}
