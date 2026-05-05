import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
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

  useEffect(() => {
    const end = new Date('2026-04-27T00:00:00');
    const update = () => {
      const diff = Math.max(0, end.getTime() - Date.now());
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setDisplay(`${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={styles.countdown}>
      <span className={styles.countdownNum}>{display}</span>
    </span>
  );
}

export function Hero() {
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });
  const ledeRef = useScrollAnim<HTMLParagraphElement>();
  const ctasRef = useScrollAnim<HTMLDivElement>();
  const partnersRef = useScrollAnim<HTMLDivElement>();

  const showcaseRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const screenshot = screenshotRef.current;
    const trigger = showcaseRef.current;
    if (!screenshot || !trigger) return;

    gsap.set(screenshot, { scale: 0.92, transformOrigin: 'center top' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'top center',
        scrub: 0.6,
      },
    });

    tl.to(screenshot, { scale: 1, ease: 'none' });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.banner}>
        <div className={styles.bannerInner}>
          <Countdown />

          <h1 ref={titleRef} className={`display anim ${styles.title}`}>
            From surfing the web to <em>owning it.</em>
          </h1>

          <p ref={ledeRef} className={`anim anim-d2 ${styles.lede}`}>
            Sofia turns your web activity into a verifiable, rewarded on-chain identity.
          </p>

          <div ref={ctasRef} className={`anim anim-d3 ${styles.ctas}`}>
            <a
              href="https://tally.so/r/7RdaeR"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Join Alpha <Arrow />
            </a>
            <a href="https://doc.sofia.intuition.box" className="btn btn-secondary">
              Read the docs <Arrow />
            </a>
          </div>
        </div>
      </div>

      <div ref={showcaseRef} className={styles.showcase}>
        <img
          ref={screenshotRef}
          src="/img/sofiascreen/Workspace-Sofia/hero-v1.png"
          alt="Sofia Extension"
          className={styles.screenshot}
        />
      </div>

      <div ref={partnersRef} className={`anim anim-d2 ${styles.partnersWrap}`}>
        <div className={styles.partners}>
          {PARTNERS.map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer">
              <img src={p.logo} alt={p.name} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
