import React, { useState } from 'react';
import styles from './index.module.css';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}


const faqData: FAQItem[] = [
  {
    question: "What is Sofia?",
    answer: "Sofia transforms your online experience into verifiable proof you own. Instead of platforms exploiting your data in the shadows, Sofia helps you capture and control your digital history. Your actions become your identity, not your claims."
  },
  {
    question: "Why does Sofia exist?",
    answer: "Because the web has betrayed its users. Big platforms extract value from your activity while keeping you in the dark with opaque algorithms. Sofia breaks this model by giving you ownership of your story and the value you generate. We believe in sovereignty over surveillance, proof over promises."
  },
  {
    question: "Who is Sofia for?",
    answer: "Sofia is for anyone who cares about owning their digital identity. Whether you're a creator, builder, or someone who values privacy and transparency—if you believe influence should come from what you do, not just what you claim, Sofia is for you. Every user writes their own story while contributing to our collective history."
  },
  {
    question: "How does Sofia work?",
    answer: "Sofia uses a browser extension to track your web activity (GitHub, YouTube, Figma, etc.). Your personal AI analyzes these interactions and you decide what to keep as verified proof. Everything happens locally on your device first—no surveillance, no hidden tracking. You stay in control."
  },
  {
    question: "Is my data safe and private?",
    answer: "Yes. Your data is processed on your device with secure technology that even the Sofia team cannot access. You choose what to share and what stays private. Everything is transparent and verifiable—no black boxes, no hidden tricks. Our code is open-source so anyone can check."
  },
  {
    question: "What are Sofia's core values?",
    answer: (
      <>
        Sofia is built on five principles: you own your digital history, your actions become verifiable proof, technology should be transparent, value comes from contribution not capital, and individual stories create shared truth. Want to help shape our values? Visit{' '}
        <a href="https://sofia.intuition.box/values/" target="_blank" rel="noopener noreferrer" className={styles.valuesLink}>
          our values page
        </a>{' '}
        to vote for the principles that matter most to you.
      </>
    )
  },
  {
    question: "How can I join or contribute?",
    answer: (
      <>
        We're building Sofia in public and welcoming early contributors. Join our{' '}
        <a href="https://discord.gg/39RP6h4WuH" target="_blank" rel="noopener noreferrer" className={styles.valuesLink}>
          Discord
        </a>{' '}
        to connect with the community. 
      </>
    )
  },
  {
    question: "When will Sofia launch?",
    answer: (
      <>
        We're actively building with our early contributor community. Join our{' '}
        <a href="https://discord.gg/39RP6h4WuH" target="_blank" rel="noopener noreferrer" className={styles.valuesLink}>
          Discord
        </a>{' '}
        to stay updated and be part of the journey from day one.
      </>
    )
  }
];

interface FAQItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemComponent({ item, isOpen, onToggle }: FAQItemProps): React.ReactElement {
  return (
    <div className={styles.faqItem}>
      <button
        className={`${styles.faqQuestion} ${isOpen ? styles.active : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`${styles.faqAnswer} ${isOpen ? styles.open : ''}`}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

export default function FAQ(): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection}>
      <div className="container">
        <h2 className={styles.faqTitle}>Most Asked Questions</h2>
        <div className={styles.faqContainer}>
          {faqData.map((item, index) => (
            <FAQItemComponent
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
