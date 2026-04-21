import React from 'react';
import styles from './index.module.css';

export default function EarlyAccessButton(): React.ReactElement {
  const handleClick = () => {
    window.open('https://tally.so/r/n9bvrY', '_blank');
  };

  return (
    <div className={styles.buttonWrapper}>
      <button className={styles.button}>
        <a href="#" onClick={(e) => { e.preventDefault(); handleClick(); }} className={styles.link}>
          <span className={styles.content}>
            Early Access Program
          </span>
        </a>
      </button>
    </div>
  );
}
