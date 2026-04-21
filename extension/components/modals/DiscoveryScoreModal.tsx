/**
 * DiscoveryScoreModal — transparency modal for the Discovery Score.
 *
 * Explains how the user's Gold earnings from discovery activity break
 * down into Pioneer / Explorer / Contributor categories, with the
 * exact formula and the path to earn more.
 *
 * Inspired by sofia-explorer's ScoreExplanationDialog but adapted to
 * Sofia's model (no multi-platform topic scoring, no trust composite).
 */

import { createPortal } from "react-dom"
import { useEffect } from "react"

import type { UserDiscoveryStats } from "~/types/discovery"
import "../styles/DiscoveryScoreModal.css"

const PIONEER_GOLD = 50
const EXPLORER_GOLD = 20
const CONTRIBUTOR_GOLD = 10

interface DiscoveryScoreModalProps {
  isOpen: boolean
  onClose: () => void
  stats: UserDiscoveryStats | null
}

const DiscoveryScoreModal = ({
  isOpen,
  onClose,
  stats
}: DiscoveryScoreModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const pioneer = stats?.pioneerCount ?? 0
  const explorer = stats?.explorerCount ?? 0
  const contributor = stats?.contributorCount ?? 0
  const fromPioneer = stats?.discoveryGold.fromPioneer ?? pioneer * PIONEER_GOLD
  const fromExplorer =
    stats?.discoveryGold.fromExplorer ?? explorer * EXPLORER_GOLD
  const fromContributor =
    stats?.discoveryGold.fromContributor ?? contributor * CONTRIBUTOR_GOLD
  const totalGold =
    stats?.discoveryGold.total ?? fromPioneer + fromExplorer + fromContributor
  const totalCerts =
    stats?.totalCertifications ?? pioneer + explorer + contributor

  return createPortal(
    <div className="score-modal-overlay" onClick={onClose}>
      <div
        className="score-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <header className="score-modal__header">
          <h2>Why is your Discovery Score {totalGold} Gold?</h2>
          <button
            className="score-modal__close"
            onClick={onClose}
            aria-label="Close">
            ×
          </button>
        </header>

        <div className="score-modal__body">
          {totalCerts === 0 ? (
            <p className="score-modal__empty">
              No discoveries yet. Start certifying pages to earn Gold —
              the earlier you certify a page that others certify later,
              the more Gold you get.
            </p>
          ) : (
            <>
              <section className="score-modal__section">
                <h3>Discovery Gold breakdown</h3>
                <div className="score-row">
                  <div className="score-row__label">
                    <strong>Pioneer</strong>
                    <span className="score-row__hint">
                      First few to certify a page (×{PIONEER_GOLD} Gold)
                    </span>
                  </div>
                  <div className="score-row__value">
                    {pioneer} × {PIONEER_GOLD} ={" "}
                    <strong>{fromPioneer}</strong>
                  </div>
                </div>
                <div className="score-row">
                  <div className="score-row__label">
                    <strong>Explorer</strong>
                    <span className="score-row__hint">
                      Early certifiers (×{EXPLORER_GOLD} Gold)
                    </span>
                  </div>
                  <div className="score-row__value">
                    {explorer} × {EXPLORER_GOLD} ={" "}
                    <strong>{fromExplorer}</strong>
                  </div>
                </div>
                <div className="score-row">
                  <div className="score-row__label">
                    <strong>Contributor</strong>
                    <span className="score-row__hint">
                      Joined an existing discovery (×{CONTRIBUTOR_GOLD}{" "}
                      Gold)
                    </span>
                  </div>
                  <div className="score-row__value">
                    {contributor} × {CONTRIBUTOR_GOLD} ={" "}
                    <strong>{fromContributor}</strong>
                  </div>
                </div>
                <div className="score-row score-row--total">
                  <div className="score-row__label">
                    <strong>Total Discovery Gold</strong>
                  </div>
                  <div className="score-row__value">
                    <strong>{totalGold}</strong>
                  </div>
                </div>
              </section>

              <section className="score-modal__section score-modal__tip">
                <h3>How to earn more</h3>
                <ul>
                  <li>
                    Certify pages <em>before</em> others do — Pioneer
                    earns the most per discovery
                  </li>
                  <li>
                    Keep exploring new corners of the web, don't just
                    re-certify the same domains
                  </li>
                  <li>
                    Certifications, votes and daily quests also earn
                    their own Gold (not counted here)
                  </li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DiscoveryScoreModal
