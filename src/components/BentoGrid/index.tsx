import React, { useState } from 'react';
import styles from './index.module.css';

const screenshots = [
  { src: '/img/sofiascreen/10.png', alt: 'Sofia Analytics', title: 'Homepage' },
  { src: '/img/sofiascreen/1.png', alt: 'Sofia Homepage', title: 'Signals Details' },
  { src: '/img/sofiascreen/2.png', alt: 'Sofia Bookmarks', title: 'Signals List' },
  { src: '/img/sofiascreen/3.png', alt: 'Sofia Pulse', title: 'Add a Signals to a Bookmark' },
  { src: '/img/sofiascreen/4.png', alt: 'Sofia Echoes', title: 'Orb Tools Selection' },
  { src: '/img/sofiascreen/5.png', alt: 'Sofia Triples', title: 'Follow List' },
  { src: '/img/sofiascreen/6.png', alt: 'Sofia Signal', title: 'Sofia Analysis Result' },
  { src: '/img/sofiascreen/7.png', alt: 'Sofia Profile', title: 'Write Echoes On Chain' },
  { src: '/img/sofiascreen/8.png', alt: 'Sofia Settings', title: 'Chat Bot' },
  { src: '/img/sofiascreen/9.png', alt: 'Sofia Chat', title: 'Bookmarks' },
  { src: '/img/sofiascreen/11.png', alt: 'Resonance', title: 'Resonance' },
  { src: '/img/sofiascreen/12.png', alt: 'Pulse Analysis', title: 'Pulse Analysis' }
];

export default function BentoGrid(): React.ReactElement {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImage(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % screenshots.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + screenshots.length) % screenshots.length);
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      <div className={styles.bentoGrid}>
        {screenshots.map((screenshot, index) => (
          <div
            key={index}
            className={`${styles.bentoItem} ${styles[`item${index + 1}`]}`}
            onClick={() => openModal(index)}
          >
            <img
              src={screenshot.src}
              alt={screenshot.alt}
              className={styles.bentoImage}
              loading="lazy"
            />
            <div className={styles.bentoOverlay}>
              <span className={styles.bentoTitle}>{screenshot.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage !== null && (
        <div className={styles.modal} onClick={closeModal}>
          <button className={styles.closeButton} onClick={closeModal} aria-label="Close">
            ×
          </button>
          <button className={`${styles.navButton} ${styles.prevButton}`} onClick={(e) => { e.stopPropagation(); prevImage(); }} aria-label="Previous">
            ‹
          </button>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={screenshots[selectedImage].src}
              alt={screenshots[selectedImage].alt}
              className={styles.modalImage}
            />
          </div>
          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={(e) => { e.stopPropagation(); nextImage(); }} aria-label="Next">
            ›
          </button>
        </div>
      )}
    </>
  );
}
