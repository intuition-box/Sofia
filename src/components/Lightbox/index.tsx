import React, { useEffect, useCallback } from 'react';
import styles from './index.module.css';

interface LightboxProps {
  images: { src: string; alt: string }[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: LightboxProps): React.ReactElement {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const current = images[currentIndex];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close">
        &times;
      </button>

      <button
        className={`${styles.navButton} ${styles.navLeft}`}
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
      >
        &#8249;
      </button>

      <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
        <img
          src={current.src}
          alt={current.alt}
          className={styles.image}
        />
      </div>

      <button
        className={`${styles.navButton} ${styles.navRight}`}
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next image"
      >
        &#8250;
      </button>

      <div className={styles.counter}>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
