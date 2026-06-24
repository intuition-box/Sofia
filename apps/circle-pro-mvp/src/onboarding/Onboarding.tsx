/**
 * Onboarding — import your bookmarks, then sort them while SEEING that the team
 * you're joining already keeps the same things.
 *   1. welcome    — "Continue with Brave" (real provider logo)
 *   2. sort       — browse YOUR folder tree (same architecture as My bookmarks)
 *                   and drop each link into Acme's topics; per row, who keeps it
 *   3. importing → done — add to Acme, land in My bookmarks
 *
 * Plain copy, real teammate names, no crypto handles.
 */
import { useEffect, useMemo, useState } from 'react'
import { Check, ArrowRight, Users } from 'lucide-react'
import { Icon } from '../components/Icon'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { suggestCategory } from '../data/topics'
import { proofFor } from '../lib/social'
import { TEAM_MAP, teamFor } from '../data/teams'
import { likedBy } from '../data/teammates'
import { sharedPeople } from '../data/folderTree'
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
      <div className={`ob-stage ob-stage--${step}`} key={step}>
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
  ['Chrome', 'googlechrome'],
  ['Firefox', 'firefoxbrowser'],
  ['Safari', 'safari'],
  ['Edge', 'microsoftedge'],
]

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="ob-card ob-welcome">
      <h1 className="ob-title">Import your bookmarks</h1>
      <p className="ob-lede">
        Bring your Brave folders into Acme — same folders, same order. You sort them into topics and
        see who on the team already keeps the same things.
      </p>

      <button className="ob-brave" onClick={onStart}>
        <img className="ob-brave-logo" src="https://cdn.simpleicons.org/brave/FB542B" alt="" />
        <span>Continue with Brave</span>
        <ArrowRight size={17} className="ob-brave-go" />
      </button>
      <p className="ob-reassure mono">Reads your folders locally · nothing is uploaded</p>

      <div className="ob-browsers">
        <span className="ob-or">or</span>
        {BROWSERS.map(([name, slug]) => (
          <button key={slug} className="ob-browser" title={`Import from ${name}`} onClick={onStart}>
            <img src={`https://cdn.simpleicons.org/${slug}`} alt={name} />
          </button>
        ))}
      </div>

      <button className="ob-skip" onClick={onSkip}>
        Skip — explore the workspace first
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

  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = MY_BOOKMARKS as BmNode[]
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [path])

  const subfolders = useMemo(
    () =>
      currentNodes
        .filter((n): n is BmFolder => n.type === 'folder')
        .map((f) => ({ name: f.name, people: sharedPeople(f.children) })),
    [currentNodes],
  )

  const folderName = path.length ? path[path.length - 1] : ''
  const links = useMemo<FlatLink[]>(
    () =>
      currentNodes
        .filter((n): n is BmLink => n.type === 'link')
        .map((l) => ({ title: l.title, url: l.url, folder: folderName })),
    [currentNodes, folderName],
  )

  const overlapPeople = useMemo(() => sharedPeople(MY_BOOKMARKS as BmNode[], 5), [])

  return (
    <div className="ob-card ob-categorize">
      <header className="ob-cat-head">
        <h2 className="ob-title ob-title--sm obc-title">Sort your bookmarks into Acme's topics</h2>
      </header>

      <div className={`ob-overlap${proofReady ? ' ready' : ''}`}>
        <span className="ob-overlap-ic">
          <Users size={16} />
        </span>
        <span className="ob-overlap-avs">
          {overlapPeople.map((t, j) => (
            <span key={t.name} className="ob-overlap-av" title={t.name} style={{ background: avGrad(t.grad), zIndex: 9 - j }} />
          ))}
        </span>
        <p className="ob-overlap-txt">
          <b className="tnum">{proofReady ? certifiedCount : '··'}</b> of your <b className="tnum">{total}</b> bookmarks
          are already kept by people on <b>Acme</b>.
          <span className="ob-overlap-sub">Open your folders below — you'll see exactly who shares each one.</span>
        </p>
      </div>

      <nav className="obc-crumbs" aria-label="Folder path">
        <button className="obc-crumb" onClick={() => setPath([])}>
          My bookmarks
        </button>
        {path.map((seg, i) => (
          <span className="obc-seg" key={`${seg}-${i}`}>
            <span className="obc-sep" aria-hidden="true">›</span>
            <button className="obc-crumb" onClick={() => setPath((p) => p.slice(0, i + 1))}>
              {seg}
            </button>
          </span>
        ))}
      </nav>

      {subfolders.length ? (
        <div className="obc-folders">
          {subfolders.map((f) => (
            <button className="kb-chip kb-chip--folder" key={f.name} onClick={() => setPath((p) => [...p, f.name])}>
              <Icon name="folder" />
              {f.name}
              {f.people.length ? (
                <span className="kb-chip-people">
                  {f.people.slice(0, 3).map((p, j) => (
                    <span key={p.name} className="kb-chip-av" title={p.name} style={{ background: avGrad(p.grad), zIndex: 9 - j }} />
                  ))}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {links.length ? (
        <div className="kb-list obc-list">
          {links.map((l) => {
            const liked = likedBy(l.url)
            const team = TEAM_MAP[teamFor(l.url)]
            return (
              <div className="kb-res" key={l.url}>
                <Favicon host={hostOf(l.url)} />
                <div className="kb-res-main">
                  <div className="kb-res-title">{l.title}</div>
                  <div className="kb-res-signals">
                    {!proofReady ? (
                      <span className="ob-skel" />
                    ) : liked.total ? (
                      <span className="kb-sig kb-likedby">
                        <span className="kb-lb-avs">
                          {liked.people.map((t, j) => (
                            <span key={t.name} className="kb-lb-av" title={t.name} style={{ background: avGrad(t.grad), zIndex: 9 - j }} />
                          ))}
                        </span>
                        <span className="kb-lb-txt">
                          <b>{liked.total}</b> from{' '}
                          <span className="kb-lb-team-name" style={{ color: team.color }}>{team.label}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="kb-sig kb-sig--new">Only you so far</span>
                    )}
                  </div>
                </div>
                <div className="obc-topic">
                  <TopicSelect value={topicOf(l)} onChange={(id) => onPick(l.url, id)} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="obc-empty">Open a folder above to start sorting.</p>
      )}

      <footer className="ob-cat-foot">
        <button className="ob-back" onClick={onBack}>
          Back
        </button>
        <button className="ob-cta" onClick={onImport}>
          Add {total} bookmarks to Acme <ArrowRight size={16} />
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
      <h2 className="ob-title ob-title--sm">Adding to Acme</h2>
      <p className="ob-lede ob-lede--sm mono">
        <b className="tnum">{total}</b> bookmarks · adding to Acme
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
      <p className="ob-lede">Same folders — and now you can see who on the team keeps the same things.</p>
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
