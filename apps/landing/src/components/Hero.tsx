import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

const PARTNERS = [
  { name: 'Mastra', logo: '/img/partners/mastra.svg', url: 'https://mastra.ai/' },
  { name: 'Gaianet', logo: '/img/partners/gaianetlogo.png', url: 'https://www.gaianet.ai' },
  { name: 'Colony', logo: '/img/partners/colonnylogo.png', url: 'https://colony.io/' },
  { name: 'Intuition', logo: '/img/partners/intuitionlogo.svg', url: 'https://intuition.systems' },
  { name: 'Ollama', logo: '/img/partners/ollama.png', url: 'https://ollama.com' },
];

function Countdown() {
  const [display, setDisplay] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    const end = new Date('2026-04-27T00:00:00');

    const update = () => {
      const diff = Math.max(0, end.getTime() - Date.now());
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setDisplay(`${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
      setLabel('remaining — Alpha Reward Program is live');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.countdown}>
      <span className={styles.countdownNum}>{display}</span>
      <span className={styles.countdownLabel}>{label}</span>
    </div>
  );
}

export function Hero() {
  const titleRef = useScrollAnim();
  const bgRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    const hero = heroRef.current;
    if (!bg || !hero) return;

    gsap.set(bg, { scale: 0.72, transformOrigin: 'center center' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=200vh',
        scrub: 1,
      },
    });

    tl.to(bg, { scale: 1, ease: 'none' });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={heroRef} className={styles.hero}>
      <h1 ref={titleRef} className={`${styles.title} anim`}>
        From Surfing<br />the Web to <em>Owning It.</em>
      </h1>

      <Countdown />

      <div className={styles.greenWrap}>
        <div ref={bgRef} className={styles.greenBg} />
        <img
          src="/img/sofiascreen/Workspace-Sofia/hero-v1.png"
          alt="Sofia Extension"
          className={styles.screenshot}
        />

        <div className={styles.banner}>
          <p>Sofia turns your web activity into a verifiable, rewarded on-chain identity.</p>
        </div>

        <div className={styles.ctas}>
          <a href="https://tally.so/r/7RdaeR" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Join Alpha <Arrow />
          </a>
          <a href="https://doc.sofia.intuition.box" className="btn btn-light">
            Read the docs <Arrow />
          </a>
        </div>

        <div className={styles.logos}>
          {PARTNERS.map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer">
              <img src={p.logo} alt={p.name} />
            </a>
          ))}
        </div>

      </div>

      <div className={styles.spacer} />
    </section>
  );
}
