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

interface DiveOptions {
  /** Selector of the section that drives + pins. Defaults to the closest <section>. */
  triggerSelector?: string;
  /** Element selector whose CSS vars will be animated to expand the plate to fullscreen. */
  expandSelector?: string;
  /** Selector of the companion element (copy column) to fade out alongside. */
  fadeSelector?: string;
  /** SVG viewBox zoom factor — vector-crisp inner zoom on top of the expansion. */
  zoom?: number;
  /** Pin scroll distance. Defaults to '+=140%'. */
  endDistance?: string;
  /** Scrub lerp factor. */
  scrub?: number;
}

/**
 * useScrollDive — pin the section then physically grow the framing element
 * to viewport size by animating layout CSS vars (no `transform: scale()`,
 * so content stays vector-crisp). Simultaneously zooms the inner SVG via
 * its `viewBox` attribute, and fades the companion copy out.
 *
 * Expects the expand target to expose the CSS vars `--plate-col`,
 * `--inner-gap`, `--inner-pad-x`, `--inner-pad-y` (driven from a single
 * grid container — see Hero.module.css for the contract).
 */
export function useScrollDive<T extends HTMLElement = HTMLDivElement>(
  options: DiveOptions = {},
) {
  const ref = useRef<T>(null);
  const {
    triggerSelector,
    expandSelector,
    fadeSelector,
    zoom = 3,
    endDistance = '+=140%',
    scrub = 0.6,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = triggerSelector
      ? (document.querySelector(triggerSelector) as HTMLElement | null)
      : el.closest('section');
    if (!trigger) return;

    const svg = el.querySelector('svg');
    let toViewBox: string | null = null;
    if (svg) {
      const vb = svg.getAttribute('viewBox')?.split(/\s+/).map(Number);
      if (vb && vb.length === 4) {
        const [x0, y0, w0, h0] = vb;
        const cx = x0 + w0 / 2;
        const cy = y0 + h0 / 2;
        const w1 = w0 / zoom;
        const h1 = h0 / zoom;
        toViewBox = `${cx - w1 / 2} ${cy - h1 / 2} ${w1} ${h1}`;
      }
    }

    const expand = expandSelector
      ? (trigger.querySelector(expandSelector) as HTMLElement | null)
      : null;
    const fade = fadeSelector
      ? (trigger.querySelector(fadeSelector) as HTMLElement | null)
      : null;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: 'top top',
        end: endDistance,
        scrub,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    if (expand) {
      tl.to(
        expand,
        {
          '--plate-col': '100%',
          '--inner-gap': '0px',
          '--inner-pad-x': '0px',
          '--inner-pad-y': '0px',
          '--inner-h': '100vh',
          ease: 'none',
        },
        0,
      );
    }
    if (fade) tl.to(fade, { opacity: 0, ease: 'none' }, 0);
    if (svg && toViewBox) {
      tl.to(svg, { attr: { viewBox: toViewBox }, ease: 'none' }, 0);
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [triggerSelector, expandSelector, fadeSelector, zoom, endDistance, scrub]);

  return ref;
}
