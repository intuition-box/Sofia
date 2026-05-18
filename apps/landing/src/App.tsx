import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { SceneStack } from './scenes/SceneStack'
import {
  LAYOUT_AREAS,
  PlaceholderSlide,
} from './scenes/PlaceholderSlide'
import {
  REVEAL_BGS,
  SLIDES,
  SUB_STATES,
  VARIANTS,
} from './scenes/slides.config'

export default function App() {
  let zoneCursor = 1
  return (
    <>
      <Navbar />
      {/* SceneStack reserves N × 100vh of scroll space (one stage per
          scene + one extra per sub-state). ScrollTrigger snaps the
          active stage; the sticky stage layer paints the layout.
          Footer follows in normal flow after the last snap stage. */}
      <SceneStack
        bgs={[...VARIANTS]}
        revealBgs={REVEAL_BGS}
        subStates={SUB_STATES}
        slideCodes={SLIDES.map((s) => s.code)}>
        {SLIDES.map((s, i) => {
          const zoneStart = zoneCursor
          zoneCursor +=
            LAYOUT_AREAS[s.layout].length +
            (s.revealLayout ? LAYOUT_AREAS[s.revealLayout].length : 0)
          return (
            <PlaceholderSlide
              key={s.code}
              {...s}
              variant={VARIANTS[i]}
              zoneStart={zoneStart}
            />
          )
        })}
      </SceneStack>
      <Footer />
    </>
  )
}
