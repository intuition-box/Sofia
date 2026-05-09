import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ValueProps } from './components/ValueProps'
import { Carousel } from './components/Carousel'
import { Features } from './components/Features'
import { Values } from './components/Values'
import { Team } from './components/Team'
import { FAQ } from './components/FAQ'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
import { HexDeck } from './components/HexDeck'

/**
 * Page order locked from `docs/landing-mockup-refactor-plan.md`:
 *   HexDeck { Hero, ValueProps, Carousel, Product, Values, Team } → FAQ → CTA → Footer
 *
 * The HexDeck pins for one viewport per inter-slide transition and
 * unfolds each slide via a hex-shaped iris. FAQ / CTA / Footer keep
 * a normal vertical flow after the deck unpins.
 */
export default function App() {
  return (
    <>
      <Navbar />
      <HexDeck
        bgs={['peach', 'peach', 'dark', 'peach', 'peach', 'dark']}
      >
        <Hero />
        <ValueProps />
        <Carousel />
        <Features />
        <Values />
        <Team />
      </HexDeck>
      <FAQ />
      <CTA />
      <Footer />
    </>
  )
}
