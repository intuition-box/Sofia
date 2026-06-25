/* ─────────────────────────────────────────────────────────────────────────
 * ⚠️  CODE ORPHELIN — audit 2026-06-25, non monté dans App.tsx (aucun importeur).
 * Écran « carte de topics » jamais branché (cœur de la PO topic-first).
 * Vestige importé via Claude Design. Décision : TAGUÉ, non supprimé.
 * À recâbler (carte de topics) ou supprimer dans une passe dédiée.
 * Ne pas étendre tel quel. Garde-fou : ne pas toucher au code de Maxime.
 * ──────────────────────────────────────────────────────────────────────── */
/**
 * Overview — the workspace home: the topic map (what the team cares about) and
 * a join band. A topic drills into the people working it. De-cryptoized — no
 * on-chain teaser, no trust language.
 */
import { TopicsTreemap } from '../components/TopicsTreemap'

interface OverviewProps {
  onTopic: (id: string) => void
}

export function Overview({ onTopic }: OverviewProps) {
  return (
    <div className="content">
      <TopicsTreemap domain="all" onPick={onTopic} />
    </div>
  )
}
