/**
 * Onboarding entry — placeholder welcome veil.
 *
 * The real guided flow (import bookmarks → classify by topic → share with the
 * team) is refined from the screenshots the user is providing. This is the
 * on-brand entry point it slots into. Two doors: import, or explore.
 */
import { Icon } from '../components/Icon'

interface WelcomeProps {
  onImport: () => void
  onExplore: () => void
}

export function Welcome({ onImport, onExplore }: WelcomeProps) {
  return (
    <div className="veil">
      <div className="vcard">
        <div className="vlogo">S</div>
        <span className="v-eyebrow mono">Sofia Pro · knowledge base</span>
        <h1 className="vtitle">One place for what your team reads</h1>
        <p className="vtx">
          Import the pages you already saved, classify them by <b>topic</b>, and share them with
          your team. Every bookmark stays organized and findable.
        </p>
        <div className="vstats">
          <div className="vstat">
            <b>5</b>
            <span>topics</span>
          </div>
          <div className="vstat">
            <b>2 min</b>
            <span>to import</span>
          </div>
          <div className="vstat">
            <b>1</b>
            <span>shared circle</span>
          </div>
        </div>
        <div className="vbtns">
          <button className="btn btn-accent vbtn-primary" onClick={onImport}>
            <Icon name="download" /> Import your bookmarks
          </button>
          <button className="btn btn-ghost vbtn-ghost" onClick={onExplore}>
            Explore the workspace first
          </button>
        </div>
        <p className="v-foot mono">Mocked MVP · no wallet, no chain — everything is demo data.</p>
      </div>
    </div>
  )
}
