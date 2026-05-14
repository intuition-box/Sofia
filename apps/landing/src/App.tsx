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
import { Deck } from './proto/Deck'

/**
 * Page order:
 *   Deck { Hero, ValueProps, Carousel, Vision, Values, Team } → FAQ → CTA → Footer
 *
 * The deck is a sticky-pinned horizontal carousel of 6 slides. Wheel,
 * touch and keyboard input advance through discrete states. FAQ, CTA
 * and Footer scroll normally under Lenis once the deck unpins.
 */
export default function App() {
  return (
    <>
      <Navbar />
      <Deck bgs={['peach', 'peach', 'dark', 'peach', 'peach', 'dark']}>
        <Hero />
        <ValueProps />
        <Carousel />
        <Features />
        <Values />
        <Team />
      </Deck>
      <FAQ />
      <CTA />
      <Footer />
    </>
  )
}
