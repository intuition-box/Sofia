import React from 'react';
import styles from './index.module.css';

const sofiaImages = [
  { src: '/img/sofiascreen/Workspace-Sofia/slide1.png', alt: 'Sofia Screenshot 1' },
  { src: '/img/sofiascreen/Workspace-Sofia/slide2.png', alt: 'Sofia Screenshot 2' },
  { src: '/img/sofiascreen/Workspace-Sofia/slide3.png', alt: 'Sofia Screenshot 3' },
  { src: '/img/sofiascreen/Workspace-Sofia/slide4.png', alt: 'Sofia Screenshot 4' },
  { src: '/img/sofiascreen/Workspace-Sofia/slide5.png', alt: 'Sofia Screenshot 5' },
  { src: '/img/sofiascreen/Workspace-Sofia/slide6.png', alt: 'Sofia Screenshot 6' },
];

export default function SofiaCarousel(): React.ReactElement {
  const infiniteImages = [...sofiaImages, ...sofiaImages, ...sofiaImages, ...sofiaImages];

  return (
    <div className={styles.carousel}>
      <div className={styles.scrollContainer}>
        <div className={styles.scrollTrack}>
          {infiniteImages.map((image, index) => (
            <div key={index} className={styles.imageSlide}>
              <img
                src={image.src}
                alt={image.alt}
                className={styles.carouselImage}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}