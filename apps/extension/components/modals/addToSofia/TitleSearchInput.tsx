// Title field with existing-atom autocomplete. As you type it searches the
// Intuition graph (via the SW → SearchUrlAtoms) for url/thing atoms whose
// label/name/url matches, letter by letter. Picking a suggestion reuses that
// atom (its term_id) so the certification deposits on it instead of minting a
// duplicate; typing freely clears the pick → a new atom is created from the URL.
import { useEffect, useRef, useState } from "react"

import type { AtomSuggestion, SearchAtomsResponse } from "~lib/addToSofia/types"
import { getFaviconUrl } from "~lib/utils"

interface TitleSearchInputProps {
  value: string
  /** Free typing — the parent clears any picked atom. */
  onChange: (title: string) => void
  /** A suggestion was chosen — the parent stores its term_id. */
  onPick: (atom: AtomSuggestion) => void
  /** True once an atom is picked (reuse mode) — shows a small check. */
  picked?: boolean
}

export function TitleSearchInput({
  value,
  onChange,
  onPick,
  picked
}: TitleSearchInputProps) {
  const [matches, setMatches] = useState<AtomSuggestion[]>([])
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  // Bumped on every pick/blur so an in-flight search can't reopen the list.
  const runRef = useRef(0)

  // Debounced search on the typed title (min 2 chars). Skipped while an atom is
  // picked (the input shows its label, no need to re-search until edited).
  useEffect(() => {
    if (picked || !focused) {
      setMatches([])
      return
    }
    const q = value.trim()
    if (q.length < 2) {
      setMatches([])
      return
    }
    const run = ++runRef.current
    const t = setTimeout(async () => {
      try {
        const res = (await chrome.runtime.sendMessage({
          type: "SEARCH_ATOMS",
          query: q
        })) as SearchAtomsResponse | undefined
        if (run === runRef.current) {
          setMatches(res?.atoms ?? [])
          setActive(0)
        }
      } catch {
        if (run === runRef.current) setMatches([])
      }
    }, 250)
    return () => clearTimeout(t)
  }, [value, focused, picked])

  const pick = (a: AtomSuggestion) => {
    runRef.current++
    setMatches([])
    onPick(a)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!matches.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && matches[active]) {
      e.preventDefault()
      pick(matches[active])
    }
  }

  return (
    <div className="sis-title-wrap">
      <input
        className={`sis-title-input${picked ? " is-picked" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={onKeyDown}
        placeholder="Title — or search an existing Sofia atom…"
      />
      {picked ? (
        <span className="sis-title-badge" title="Reusing an existing atom">
          ✓ existing
        </span>
      ) : null}

      {focused && !picked && matches.length ? (
        <div className="sis-suggest">
          <div className="sis-suggest-head">Existing on Intuition</div>
          {matches.map((m, i) => (
            <button
              key={m.termId}
              className={`sis-suggest-row${i === active ? " active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(m)}>
              <img
                className="sis-suggest-fav"
                src={m.image || (m.url ? getFaviconUrl(m.url, 32) : "")}
                alt=""
              />
              <span className="sis-suggest-label">{m.label}</span>
              <span className="sis-suggest-path">{m.url ?? ""}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
