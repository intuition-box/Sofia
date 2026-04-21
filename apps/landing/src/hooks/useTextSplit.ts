import { useEffect, useRef, useCallback } from 'react';

export function useTextSplit() {
  const ref = useRef<HTMLElement>(null);

  const splitText = useCallback(() => {
    const element = ref.current;
    if (!element || element.hasAttribute('data-split')) return;

    const text = element.textContent || '';
    const words = text.split(' ');

    element.innerHTML = '';
    element.setAttribute('data-split', 'true');

    words.forEach((word, index) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'split-word';
      wordSpan.textContent = word;
      wordSpan.style.cssText = `
        display: inline-block;
        opacity: 0;
        transform: translate3d(0, 30px, 0);
        transition: opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s;
      `;

      element.appendChild(wordSpan);

      if (index < words.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
    });
  }, []);

  const animateIn = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    requestAnimationFrame(() => {
      const words = element.querySelectorAll('.split-word');
      words.forEach((word) => {
        (word as HTMLElement).style.opacity = '1';
        (word as HTMLElement).style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }, []);

  useEffect(splitText, [splitText]);

  return { ref, animateIn };
}