import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Comparison } from './components/Comparison';
import { Citation } from './components/Citation';
import { Steps } from './components/Steps';
import { Values } from './components/Values';
import { BlogSection } from './components/BlogSection';
import { Team } from './components/Team';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { Carousel } from './components/Carousel';
import { Instruments } from './components/Instruments';
import { Module } from './components/Module';
import { ModuleHead } from './components/ModuleHead';
import { URLS } from './lib/config/urls';

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

      <Module id="story" code="S.06" label="FIELD NOTES" meta="FROM THE BUILDERS">
        <ModuleHead
          eyebrow="Why we are building this"
          title={
            <>
              The web has betrayed its users. <em>We are reading it back.</em>
            </>
          }
          right={
            <p>
              Two notes from the builders, on the day they decided this had to
              exist. Each one is a triple — staked, signed, public.
            </p>
          }
        />

        <Citation
          quote="Working as tech support for several companies, I have seen data used internally without any compensation to users. After 30 minutes browsing meaningless ads, I realized the internet wasn't enriching; it was exhausting."
          name="Samuel Chauche"
          role="Core Contributor"
          bio=""
          photo="https://avatars.githubusercontent.com/u/193877792?s=400&u=b40a4d61b73ba9be24d01694392ac4cb700f82a6&v=4"
          blogLink={URLS.blog.fromIdea}
          blogLabel="Read the full story on Sofia Chronicles"
          reversed
        />
        <Citation
          quote="10 years as a music producer showed me how streaming platforms manipulate discovery with fake artists and paid algorithms, burying real creators. We're building the alternative."
          name="Maxime Saint-Joannis"
          role="Core Contributor"
          bio=""
          photo="https://avatars.githubusercontent.com/u/193876743?v=4"
          blogLink={URLS.blog.index}
          blogLabel="Read more on Sofia Chronicles"
        />
      </Module>

      <Values />
      <BlogSection />
      <Team />
      <FAQ />

      <CTA />
      <Footer />
    </>
  );
}
