/**
 * Onboarding — import your bookmarks, then sort them while SEEING that the team
 * you're joining already keeps the same things.
 *   1. welcome    — "Continue with Brave" (real provider logo)
 *   2. sort       — browse YOUR folder tree (same architecture as My bookmarks)
 *                   and drop each link into Intuition Core Team's topics; per row, who keeps it
 *   3. importing → done — add to Intuition Core Team, land in My bookmarks
 *
 * Plain copy, real teammate names, no crypto handles.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Icon } from '../components/Icon'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { suggestCategory } from '../data/topics'
import { proofFor } from '../lib/social'
import { TEAM_MAP } from '../data/teams'
import { sharedPeople, sharedTeamIds, countLinks } from '../data/folderTree'
import type { ImportedBookmark } from '../lib/imported'
import { TopicSelect } from '../components/TopicSelect'
import { avGrad, hostOf } from '../data/helpers'
import './sort.css'

type Step = 'welcome' | 'sort' | 'importing' | 'done'

interface FlatLink {
  title: string
  url: string
  folder: string
}

function flattenWithFolder(nodes: BmNode[], folder: string): FlatLink[] {
  const out: FlatLink[] = []
  for (const n of nodes) {
    if (n.type === 'link') out.push({ title: n.title, url: n.url, folder })
    else out.push(...flattenWithFolder(n.children, n.name))
  }
  return out
}

function Favicon({ host }: { host: string }) {
  const [err, setErr] = useState(false)
  if (err || !host) return <span className="kb-res-fav kb-res-fav--fb">{(host[0] || '?').toUpperCase()}</span>
  return (
    <span className="kb-res-fav">
      <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" loading="lazy" onError={() => setErr(true)} />
    </span>
  )
}

interface OnboardingProps {
  onComplete: (items: ImportedBookmark[]) => void
  onSkip: () => void
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [proofReady, setProofReady] = useState(false)

  const allLinks = useMemo(() => flattenWithFolder(MY_BOOKMARKS as BmNode[], ''), [])
  const certifiedCount = useMemo(() => allLinks.filter((l) => proofFor(l.url).certified).length, [allLinks])

  const topicOf = (l: FlatLink) => picks[l.url] ?? suggestCategory(l.folder, l.url)

  const buildImported = (): ImportedBookmark[] =>
    allLinks.map((l) => {
      const p = proofFor(l.url)
      return {
        title: l.title,
        url: l.url,
        host: hostOf(l.url),
        topicId: topicOf(l),
        likes: p.likes,
        curators: p.curators,
        certified: p.certified,
      }
    })

  useEffect(() => {
    if (step === 'sort') {
      setProofReady(false)
      const t = setTimeout(() => setProofReady(true), 900)
      return () => clearTimeout(t)
    }
    if (step === 'importing') {
      const t = setTimeout(() => setStep('done'), 1500)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="ob">
      <div className={`ob-stage ob-stage--${step}`}>
        {step === 'welcome' ? <Welcome onStart={() => setStep('sort')} onSkip={onSkip} /> : null}
        {step === 'sort' ? (
          <Sort
            total={allLinks.length}
            certifiedCount={certifiedCount}
            proofReady={proofReady}
            topicOf={topicOf}
            onPick={(url, id) => setPicks((p) => ({ ...p, [url]: id }))}
            onBack={() => setStep('welcome')}
            onImport={() => setStep('importing')}
          />
        ) : null}
        {step === 'importing' ? <Importing total={allLinks.length} /> : null}
        {step === 'done' ? (
          <Done total={allLinks.length} certifiedCount={certifiedCount} onSee={() => onComplete(buildImported())} />
        ) : null}
      </div>
    </div>
  )
}

/* ── Act 1 — welcome ──────────────────────────────────────────────────── */
const BROWSERS: [string, string][] = [
  ['Chrome', 'chrome'],
  ['Firefox', 'firefox'],
  ['Safari', 'safari'],
  ['Edge', 'edge'],
]

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="ob-card ob-welcome">
      <h1 className="ob-title">Import your bookmarks</h1>
      <p className="ob-lede">
        Bring your Brave folders into Intuition Core Team — same folders, same order. You sort them into topics and
        see who on the team already keeps the same things. Your folders are read locally — nothing is uploaded.
      </p>

      <button className="ob-brave" onClick={onStart}>
        <img className="ob-brave-logo" src="https://cdn.simpleicons.org/brave/FB542B" alt="" />
        <span>Continue with Brave</span>
        <ArrowRight size={17} className="ob-brave-go" />
      </button>

      <div className="ob-browsers">
        <span className="ob-or">or</span>
        {BROWSERS.map(([name, slug]) => (
          <button key={slug} className="ob-browser" title={`Import from ${name}`} onClick={onStart}>
            <img src={`https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/${slug}/${slug}_64x64.png`} alt={name} />
          </button>
        ))}
      </div>

      <button className="ob-skip" onClick={onSkip}>
        Skip
      </button>
    </div>
  )
}

/* ── Act 2 — sort (folder browser) ────────────────────────────────────── */
interface SortProps {
  total: number
  certifiedCount: number
  proofReady: boolean
  topicOf: (l: FlatLink) => string
  onPick: (url: string, id: string) => void
  onBack: () => void
  onImport: () => void
}

function Sort({ total, certifiedCount, proofReady, topicOf, onPick, onBack, onImport }: SortProps) {
  const [path, setPath] = useState<string[]>([])
  const [openCrumb, setOpenCrumb] = useState<number | null>(null)
  const crumbsRef = useRef<HTMLElement>(null)

  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = MY_BOOKMARKS as BmNode[]
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [path])

  const folderName = path.length ? path[path.length - 1] : ''
  const links = useMemo<FlatLink[]>(
    () =>
      currentNodes
        .filter((n): n is BmLink => n.type === 'link')
        .map((l) => ({ title: l.title, url: l.url, folder: folderName })),
    [currentNodes, folderName],
  )

  const overlapPeople = useMemo(() => sharedPeople(MY_BOOKMARKS as BmNode[], 5), [])
  const sharedTeams = useMemo(
    () => sharedTeamIds(MY_BOOKMARKS as BmNode[]).map((id) => TEAM_MAP[id]).filter(Boolean),
    [],
  )

  // Folder navigation mirrors My bookmarks: child folders live in each
  // breadcrumb crumb's dropdown, not as a separate chip row.
  const foldersAt = (c: number): BmFolder[] => {
    let nodes = MY_BOOKMARKS as BmNode[]
    for (const seg of path.slice(0, c)) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes.filter((n): n is BmFolder => n.type === 'folder')
  }
  const crumbClick = (c: number) => {
    setPath((p) => p.slice(0, c))
    setOpenCrumb((o) => (o === c ? null : c))
  }
  const navTo = (c: number, name: string) => {
    setPath((p) => p.slice(0, c).concat(name))
    setOpenCrumb(null)
  }

  useEffect(() => {
    if (openCrumb === null) return
    const onDoc = (e: MouseEvent) => {
      if (crumbsRef.current && !crumbsRef.current.contains(e.target as Node)) setOpenCrumb(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openCrumb])

  return (
    <div className="ob-card ob-categorize">
      <header className="ob-cat-head">
        <h2 className="ob-title ob-title--sm obc-title">Sort your bookmarks into Intuition Core Team's topics</h2>
      </header>

      <div className={`ob-overlap${proofReady ? ' ready' : ''}`}>
        <span className="ob-overlap-avs">
          {overlapPeople.map((t, j) => (
            <span key={t.name} className="ob-overlap-av" title={t.name} style={{ background: avGrad(t.grad), zIndex: 9 - j }} />
          ))}
        </span>
        <p className="ob-overlap-txt">
          <b className="tnum">{proofReady ? certifiedCount : '··'}</b> of your <b className="tnum">{total}</b> bookmarks
          are already kept by people on <b>Intuition Core Team</b>.
          {proofReady && sharedTeams.length ? (
            <span className="ob-overlap-teams">
              {sharedTeams.map((t) => (
                <span key={t.id} className="team-tag" style={{ ['--c' as string]: t.color }}>
                  {t.label}
                </span>
              ))}
            </span>
          ) : null}
        </p>
      </div>

      <nav className="fab-crumbs" aria-label="Breadcrumb" ref={crumbsRef}>
        {[{ label: 'My bookmarks', c: 0 }, ...path.map((seg, i) => ({ label: seg, c: i + 1 }))].map(
          ({ label, c }, idx) => {
            const folders = foldersAt(c)
            return (
              <span className="fab-seg" key={`${label}-${c}`}>
                {idx > 0 ? (
                  <span className="fab-sep" aria-hidden="true">›</span>
                ) : null}
                <span className="fab-crumb-wrap">
                  <button
                    className={`fab-crumb fab-crumb--nav${openCrumb === c ? ' open' : ''}`}
                    onClick={() => crumbClick(c)}
                  >
                    {c > 0 ? <Icon name="folder" /> : null}
                    {label}
                    {folders.length ? <Icon name="chevronDown" /> : null}
                  </button>
                  {openCrumb === c && folders.length ? (
                    <div className="fab-dd">
                      {folders.map((f) => {
                        const people = sharedPeople(f.children)
                        return (
                          <button className="fab-dd-item" key={f.name} onClick={() => navTo(c, f.name)}>
                            <Icon name="folder" />
                            <span className="fab-dd-name">{f.name}</span>
                            {people.length ? (
                              <span className="fab-dd-avs">
                                {people.slice(0, 3).map((p, j) => (
                                  <span
                                    key={p.name}
                                    className="fab-dd-av"
                                    title={p.name}
                                    style={{ background: avGrad(p.grad), zIndex: 9 - j }}
                                  />
                                ))}
                              </span>
                            ) : (
                              <span className="fab-dd-n tnum">{countLinks(f.children)}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </span>
              </span>
            )
          },
        )}
      </nav>

      {links.length ? (
        <div className="kb-list obc-list">
          {links.map((l) => (
            <div className="kb-res" key={l.url}>
              <Favicon host={hostOf(l.url)} />
              <div className="kb-res-main">
                <div className="kb-res-title">{l.title}</div>
                <div className="obc-topic">
                  <TopicSelect value={topicOf(l)} onChange={(id) => onPick(l.url, id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="obc-empty">Open a folder above to start sorting.</p>
      )}

      <footer className="ob-cat-foot">
        <button className="ob-back" onClick={onBack}>
          Back
        </button>
        <button className="ob-cta" onClick={onImport}>
          Add {total} bookmarks to Intuition Core Team <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  )
}

/* ── Act 3 — importing / done ─────────────────────────────────────────── */
function Importing({ total }: { total: number }) {
  return (
    <div className="ob-card ob-importing">
      <div className="ob-spinner" />
      <h2 className="ob-title ob-title--sm">Adding to Intuition Core Team</h2>
      <p className="ob-lede ob-lede--sm mono">
        <b className="tnum">{total}</b> bookmarks · adding to Intuition Core Team
      </p>
    </div>
  )
}

function Done({ total, certifiedCount, onSee }: { total: number; certifiedCount: number; onSee: () => void }) {
  return (
    <div className="ob-card ob-done">
      <div className="ob-check">
        <Check size={28} />
      </div>
      <h1 className="ob-title">Your bookmarks are in</h1>
      <div className="ob-done-stats">
        <div className="ob-done-stat">
          <b className="tnum">{total}</b>
          <span>imported</span>
        </div>
        <div className="ob-done-stat">
          <b className="tnum">{certifiedCount}</b>
          <span>shared with the team</span>
        </div>
      </div>
      <button className="ob-cta" onClick={onSee}>
        Open my bookmarks <ArrowRight size={16} />
      </button>
    </div>
  )
}
