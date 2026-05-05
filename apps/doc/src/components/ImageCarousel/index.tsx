import React, { useState } from 'react';
import Lightbox from '@site/src/components/Lightbox';
import styles from './index.module.css';

interface ImageCarouselProps {
  images: { src: string; alt: string }[];
}

export default function ImageCarousel({ images }: ImageCarouselProps): React.ReactElement {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goTo = (index: number) => setCurrent(index);
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  if (!images || images.length === 0) return null;

  return (
    <div className={styles.carousel}>
      <div className={styles.imageContainer}>
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">
          ‹
        </button>
        <img
          src={images[current].src}
          alt={images[current].alt}
          className={styles.image}
          onClick={() => setLightboxOpen(true)}
          style={{ cursor: 'pointer' }}
        />
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">
          ›
        </button>
      </div>
      <p className={styles.caption}>{images[current].alt}</p>
      <div className={styles.dots}>
        {images.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
      <p className={styles.counter}>{current + 1} / {images.length}</p>

      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={current}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))}
          onNext={() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))}
        />
      )}
    </div>
  );
}
