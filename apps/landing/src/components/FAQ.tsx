import { useState, type ReactNode } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { Module } from './Module';
import { ModuleHead } from './ModuleHead';
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
  { q: 'How can I join?', a: <>Join our <a href="https://discord.gg/sofia3" target="_blank" rel="noopener noreferrer">Discord</a> or <a href="https://tally.so/r/7RdaeR" target="_blank" rel="noopener noreferrer">apply for beta access</a>.</> },
  { q: 'When will Sofia launch?', a: <>We're in beta with early testers now. Join <a href="https://discord.gg/sofia3" target="_blank" rel="noopener noreferrer">Discord</a> to be part of the journey.</> },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <Module id="faq" code="S.10" label="LOOKUPS" meta={`${FAQS.length} ENTRIES`}>
      <ModuleHead
        eyebrow="Frequently consulted"
        title={
          <>
            Questions, <em>answered.</em>
          </>
        }
        right={
          <p>
            Eight things people ask before they install. If your question isn't
            here, ask in Discord — we answer.
          </p>
        }
      />

      <div className={styles.list}>
        {FAQS.map((faq, i) => (
          <FAQItemComp
            key={faq.q}
            faq={faq}
            index={i}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </Module>
  );
}

function FAQItemComp({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useScrollAnim<HTMLDivElement>();
  return (
    <div ref={ref} className={`${styles.item} ${isOpen ? styles.open : ''} anim anim-up`}>
      <button className={styles.question} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.qIndex}>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.qLabel}>{faq.q}</span>
        <span className={styles.icon} aria-hidden="true">+</span>
      </button>
      <div className={styles.answer}>
        <p>{faq.a}</p>
      </div>
    </div>
  );
}
