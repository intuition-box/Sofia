import { useEffect, useRef } from 'react';

/**
 * useScrollAnim — adds `.visible` to the observed element the first time
 * it enters the viewport. Pair with `.anim` (and optional direction
 * variants like `.anim-left`, `.anim-up`, `.anim-scale`, `.anim-blur`)
 * defined in `global.css`.
 *
 * Options:
 * - `threshold`  : intersection ratio (0-1), default 0.12.
 * - `rootMargin` : extra margin around the viewport, default '0px 0px -40px 0px'.
 * - `once`       : if true (default), unobserve after first reveal.
 */
type Options = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useScrollAnim<T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
) {
  const ref = useRef<T>(null);
  const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('visible');
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
