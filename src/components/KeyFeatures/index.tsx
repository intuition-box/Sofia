import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './index.module.css';

const features = [
  { id: 1, image: '/img/sofiascreen/Workspace-Sofia/slide1.png' },
  { id: 2, image: '/img/sofiascreen/Workspace-Sofia/slide2.png' },
  { id: 3, image: '/img/sofiascreen/Workspace-Sofia/slide3.png' },
  { id: 4, image: '/img/sofiascreen/Workspace-Sofia/slide4.png' },
  { id: 5, image: '/img/sofiascreen/Workspace-Sofia/slide5.png' },
  { id: 6, image: '/img/sofiascreen/Workspace-Sofia/slide6.png' },
];

export default function KeyFeatures(): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate through images every 3 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentFeature = features[currentIndex];

  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Key Features</h2>

        <div
          className={styles.carouselWrapper}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              className={styles.featureCard}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.cardContent}>
                <div className={styles.imageContent}>
                  <img
                    src={currentFeature.image}
                    alt={`Sofia Screenshot ${currentFeature.id}`}
                    className={styles.featureImage}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className={styles.carouselIndicators}>
            {features.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
