import { useState, type ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import styles from './FAQ.module.css';

interface FAQItem {
  q: string;
  a: ReactNode;
}

const FAQS: FAQItem[] = [
  { q: 'What is Sofia?', a: 'Sofia transforms your online experience into verifiable proof you own. Your actions become your identity, not your claims.' },
  { q: 'Why does Sofia exist?', a: 'The web has betrayed its users. Sofia breaks the extraction model by giving you ownership of your story and value. Sovereignty over surveillance, proof over promises.' },
  { q: 'Who is Sofia for?', a: 'Anyone who cares about owning their digital identity. Creators, builders, or anyone who believes influence should come from what you do, not what you claim.' },
  { q: 'How does Sofia work?', a: 'A browser extension tracks your web activity locally. Your personal AI analyzes interactions and you decide what to keep as verified proof. Everything on your device first.' },
  { q: 'Is my data safe?', a: <>Yes. Processed on your device with secure tech even we can't access. Our code is <a href="https://github.com/intuition-box" target="_blank" rel="noopener noreferrer">open-source</a>.</> },
  { q: "What are Sofia's core values?", a: <>Digital sovereignty, transparent integrity, identity through action, contribution-based power, and collective narrative. <a href="https://sofia.intuition.box/values/" target="_blank" rel="noopener noreferrer">Vote here</a>.</> },
  { q: 'How can I join?', a: <>Join our <a href="https://discord.gg/sofia3" target="_blank" rel="noopener noreferrer">Discord</a> or <a href="https://tally.so/r/7RdaeR" target="_blank" rel="noopener noreferrer">apply for alpha access</a>.</> },
  { q: 'When will Sofia launch?', a: <>We're in alpha with early testers now. Join <a href="https://discord.gg/sofia3" target="_blank" rel="noopener noreferrer">Discord</a> to be part of the journey.</> },
];

export function FAQ() {
  const titleRef = useScrollAnim();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className={styles.section} id="faq">
      <div className="container">
        <h2 ref={titleRef} className={`section-title anim ${styles.centered}`}>Questions? Answers.</h2>
        <div className={styles.list}>
          {FAQS.map((faq, i) => (
            <FAQItemComp key={faq.q} faq={faq} isOpen={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItemComp({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const ref = useScrollAnim();
  return (
    <div ref={ref} className={`${styles.item} ${isOpen ? styles.open : ''} anim`}>
      <button className={styles.question} onClick={onToggle}>
        <span>{faq.q}</span>
        <span className={styles.icon}>+</span>
      </button>
      <div className={styles.answer}>
        <p>{faq.a}</p>
      </div>
    </div>
  );
}
