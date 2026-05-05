import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Comparison } from './components/Comparison';
import { Steps } from './components/Steps';
import { Values } from './components/Values';
import { BlogSection } from './components/BlogSection';
import { Team } from './components/Team';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { Carousel } from './components/Carousel';
import { Instruments } from './components/Instruments';

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />

      <Features />
      <Comparison />
      <Steps />
      <Instruments />
      <Carousel />

      <Values />
      <BlogSection />
      <Team />
      <FAQ />

      <CTA />
      <Footer />
    </>
  );
}
