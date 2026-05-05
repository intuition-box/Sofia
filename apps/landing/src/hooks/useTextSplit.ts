import { useEffect, useRef } from 'react';

/**
 * useTextSplit — splits the children text of the ref'd element into
 * inline spans (one per word or per character) and reveals them with
 * staggered motion when the element enters the viewport.
 *
 * The split happens once on mount; subsequent renders won't re-split
 * (we only descend through Text nodes, leaving existing markup alone).
 *
 * CSS contract (defined in `global.css`):
 *   `.split-word`, `.split-char` — initial hidden state, transition
 *   driven by `--i` (stagger index). `.visible` on the ref toggles
 *   the reveal in.
 *
 * Pair with reduced-motion: `global.css` opts those classes out of
 * the transform under `prefers-reduced-motion: reduce`.
 *
 * @example
 *   const ref = useTextSplit<HTMLHeadingElement>({ by: 'word' });
 *   return <h1 ref={ref} className="display anim">Own the web you use</h1>;
 */
type Options = {
  by?: 'word' | 'char';
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useTextSplit<T extends HTMLElement = HTMLElement>(
  options: Options = {},
) {
  const ref = useRef<T>(null);
  const { by = 'word', threshold = 0.2, rootMargin = '0px 0px -40px 0px', once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    splitTextNodes(el, by);

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
  }, [by, threshold, rootMargin, once]);

  return ref;
}

/* Walk the element's tree, replacing each text node with a sequence
   of inline spans. We mutate in place so existing markup (links,
   <em>, etc.) is preserved. */
function splitTextNodes(root: HTMLElement, by: 'word' | 'char') {
  if (root.dataset.splitDone === '1') return;
  root.dataset.splitDone = '1';

  let index = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) nodes.push(n as Text);

  for (const node of nodes) {
    const text = node.nodeValue ?? '';
    if (!text.trim()) continue;

    const frag = document.createDocumentFragment();
    if (by === 'word') {
      const parts = text.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'split-word';
          span.style.setProperty('--i', String(index++));
          span.textContent = part;
          frag.appendChild(span);
        }
      }
    } else {
      for (const ch of [...text]) {
        if (ch === ' ') {
          frag.appendChild(document.createTextNode(ch));
        } else {
          const span = document.createElement('span');
          span.className = 'split-char';
          span.style.setProperty('--i', String(index++));
          span.textContent = ch;
          frag.appendChild(span);
        }
      }
    }

    node.parentNode?.replaceChild(frag, node);
  }
}
