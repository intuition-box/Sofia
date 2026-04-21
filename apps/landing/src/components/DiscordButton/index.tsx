import React from 'react';
import Discord from '@site/src/theme/Icon/Socials/Discord';
import styles from './index.module.css';

export default function DiscordButton(): React.ReactElement {
  const handleClick = () => {
    window.open('https://discord.gg/39RP6h4WuH', '_blank');
  };

  return (
    <div className={styles.buttonWrapper}>
      <button className={styles.button}>
        <a href="#" onClick={(e) => { e.preventDefault(); handleClick(); }} className={styles.link}>
          <span className={styles.content}>
            <Discord style={{ fontSize: '1.2rem', marginRight: '0.5rem' }} />
            Join us on Discord
          </span>
        </a>
      </button>
    </div>
  );
}
