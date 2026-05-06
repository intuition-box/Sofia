import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Steps } from './components/Steps';
import { Comparison } from './components/Comparison';
import { Carousel } from './components/Carousel';
import { Values } from './components/Values';
import { Chronicles } from './components/Chronicles';
import { Team } from './components/Team';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Carousel />
      <Features />
      <Steps />
      <Comparison />
      <Values />
      <Chronicles />
      <Team />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
