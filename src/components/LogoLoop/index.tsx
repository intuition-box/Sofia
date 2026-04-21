import React from 'react';
import LogoLoop from './LogoLoop';
import type { LogoItem } from './LogoLoop';
import './partners.css';

const partnerLogos: LogoItem[] = [
  {
    src: "/img/partners/mastra.svg",
    alt: "Mastra",
    href: "https://mastra.ai/",
    className: "logo-mastra"
  },
  {
    src: "/img/partners/gaianetlogo.png",
    alt: "Gaianet",
    href: "https://www.gaianet.ai",
    className: "logo-gaianet"
  },
  {
    src: "/img/partners/colonnylogo.png",
    alt: "Colonny",
    href: "https://colony.io/",
    className: "logo-gaianet"
  },
  {
    src: "/img/partners/intuitionlogo.svg",
    alt: "Intuition",
    href: "https://intuition.systems",
    className: "logo-intuition"
  },
  {
    src: "/img/partners/ollama.png",
    alt: "Ollama",
    href: "https://ollama.com",
    className: "logo-ollama"
  }
];

export default function PartnerLogoLoop() {
  return (
    <div style={{ padding: '3rem 0' }}>
      <LogoLoop
        logos={partnerLogos}
        speed={40}
        direction="left"
        logoHeight={60}
        gap={120}
        pauseOnHover={false}
        fadeOut={true}
        fadeOutColor="#0b0b0b"
        scaleOnHover={true}
        ariaLabel="Partner logos"
      />
    </div>
  );
}
