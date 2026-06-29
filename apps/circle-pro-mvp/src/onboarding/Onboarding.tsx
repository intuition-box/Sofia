/**
 * Onboarding — import your bookmarks, then sort them while SEEING that the team
 * you're joining already keeps the same things.
 *   1. welcome    — "Continue with Brave" (real provider logo)
 *   2. sort       — browse YOUR folder tree (same architecture as My bookmarks)
 *                   and drop each link into your workspace's topics; per row, who keeps it
 *   3. importing → done — add to your workspace, land in My bookmarks
 *
 * Plain copy, real teammate names, no crypto handles.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Icon } from '../components/Icon'
import { DeptTagByName } from '../components/Tag'
import { MY_BOOKMARKS, type BmNode, type BmFolder, type BmLink } from '../data/myBookmarks'
import { suggestCategory } from '../data/topics'
import { classify } from '../data/taxonomyNav'
import { TEAM_MAP, teamFor } from '../data/teams'
import { sharedPeople, sharedTeamIds, countLinks, allLinksDeep } from '../data/folderTree'
import { addBookmark } from '../lib/mybookmarks'
import { parseBookmarksTree } from '../lib/importBookmarks'
import type { ImportedBookmark } from '../lib/imported'
import { TopicSelect } from '../components/TopicSelect'
import { avGrad, hostOf } from '../data/helpers'
import './sort.css'

// NOTE(audit 2026-06-25): fichier de 462 l. — étapes Welcome/Sort/JoinTeam/Importing/Done en sous-composants inline. Candidat à découper (1 fichier/étape). Non appliqué.
type Step = 'welcome' | 'sort' | 'join' | 'importing' | 'done'

// NOTE(audit 2026-06-25): `FlatLink` dupliqué (cf. TeamView/Bookmarks), variante avec `folder`. Base {title,url} à remonter dans data/types.ts puis l'étendre ici.
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

// NOTE(audit 2026-06-25): `Favicon` dupliqué (cf. TeamView/Essential). À extraire dans components/Favicon.tsx (classe CSS en prop).
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
  const [tree, setTree] = useState<BmNode[]>([])
  const [picks, setPicks] = useState<Record<string, string>>({})

  const allLinks = useMemo(() => flattenWithFolder(tree, ''), [tree])
  // No fake "the team already keeps this" proof — real overlap will come from
  // the backend (sharers) once the imports are shared.
  const certifiedCount = 0

  const topicOf = (l: FlatLink) => picks[l.url] ?? suggestCategory(l.folder, l.url)

  // Persist the REAL imported bookmarks to the private (IndexedDB) store, then
  // hand off to the app (which lands the user in My bookmarks).
  const finish = () => {
    for (const l of allLinks) {
      const topicId = topicOf(l)
      const { categoryId, nicheId } = classify(l.url, topicId)
      addBookmark({ title: l.title, url: l.url, host: hostOf(l.url), topicId, categoryId, nicheId, teamId: teamFor(l.url) })
    }
    onComplete(buildImported())
  }

  const buildImported = (): ImportedBookmark[] =>
    allLinks.map((l) => ({
      title: l.title,
      url: l.url,
      host: hostOf(l.url),
      topicId: topicOf(l),
      likes: 0,
      curators: 0,
      certified: false,
    }))

  useEffect(() => {
    if (step === 'importing') {
      const t = setTimeout(() => setStep('done'), 2400)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="ob">
      <div className={`ob-stage ob-stage--${step}`}>
        {step === 'welcome' ? (
          <Welcome
            onLoaded={(t) => {
              setTree(t)
              setStep('sort')
            }}
            onSkip={onSkip}
          />
        ) : null}
        {step === 'sort' ? (
          <Sort
            tree={tree}
            topicOf={topicOf}
            onPick={(url, id) => setPicks((p) => ({ ...p, [url]: id }))}
            onBack={() => setStep('welcome')}
            onNext={() => setStep('join')}
          />
        ) : null}
        {step === 'join' ? (
          <JoinTeam onBack={() => setStep('sort')} onJoin={() => setStep('importing')} />
        ) : null}
        {step === 'importing' ? <Importing total={allLinks.length} /> : null}
        {step === 'done' ? (
          <Done total={allLinks.length} certifiedCount={certifiedCount} onSee={finish} />
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

function Welcome({ onLoaded, onSkip }: { onLoaded: (tree: BmNode[]) => void; onSkip: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setErr(null)
    try {
      const tree = parseBookmarksTree(await file.text())
      if (!tree.length) {
        setErr('No bookmarks found in that file.')
        return
      }
      onLoaded(tree)
    } catch {
      setErr('Could not read that file.')
    }
  }
  const pick = () => fileRef.current?.click()

  return (
    <div className="ob-card ob-welcome">
      <h1 className="ob-title">Import your bookmarks</h1>
      <p className="ob-lede">
        Export your browser bookmarks to a file, then choose it here — same folders, same order.
        You sort them into topics and see who on the team already keeps the same things. Read
        locally — nothing leaves your browser until you Share.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".html,text/html"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
          e.target.value = ''
        }}
      />

      <button className="ob-brave" onClick={pick}>
        <img className="ob-brave-logo" src="https://cdn.simpleicons.org/brave/FB542B" alt="" />
        <span>Choose your bookmarks file</span>
        <ArrowRight size={17} className="ob-brave-go" />
      </button>

      <p className="ob-hint mono">Browser → Bookmarks → Bookmark manager → Export to HTML</p>
      {err ? <p className="ob-err">{err}</p> : null}

      <div className="ob-browsers">
        <span className="ob-or">supported</span>
        {BROWSERS.map(([name, slug]) => (
          <button key={slug} className="ob-browser" title={`Export from ${name}, then choose the file`} onClick={pick}>
            <img src={`https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/${slug}/${slug}_64x64.png`} alt={name} />
          </button>
        ))}
        <button className="btn btn--quiet btn--sm ob-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  )
}

/* ── Act 2 — sort (folder browser) ────────────────────────────────────── */
interface SortProps {
  tree: BmNode[]
  topicOf: (l: FlatLink) => string
  onPick: (url: string, id: string) => void
  onBack: () => void
  onNext: () => void
}

function Sort({ tree, topicOf, onPick, onBack, onNext }: SortProps) {
  const [path, setPath] = useState<string[]>([])
  const [openCrumb, setOpenCrumb] = useState<number | null>(null)
  const allUrls = useMemo(() => allLinksDeep(tree).map((l) => l.url), [tree])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allUrls))
  const crumbsRef = useRef<HTMLElement>(null)
  const allOn = selected.size >= allUrls.length

  const toggleSel = (url: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(url)) n.delete(url)
      else n.add(url)
      return n
    })

  const currentNodes = useMemo<BmNode[]>(() => {
    let nodes = tree
    for (const seg of path) {
      const f = nodes.find((n) => n.type === 'folder' && n.name === seg) as BmFolder | undefined
      if (!f) return []
      nodes = f.children
    }
    return nodes
  }, [tree, path])

  const folderName = path.length ? path[path.length - 1] : ''
  const links = useMemo<FlatLink[]>(
    () =>
      currentNodes
        .filter((n): n is BmLink => n.type === 'link')
        .map((l) => ({ title: l.title, url: l.url, folder: folderName })),
    [currentNodes, folderName],
  )


  // Folder navigation mirrors My bookmarks: child folders live in each
  // breadcrumb crumb's dropdown, not as a separate chip row.
  const foldersAt = (c: number): BmFolder[] => {
    let nodes = tree
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
        <h2 className="ob-title ob-title--sm obc-title">Sort your bookmarks into your workspace's topics</h2>
      </header>

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
        <button
          type="button"
          className="obc-selall"
          onClick={() => setSelected(allOn ? new Set() : new Set(allUrls))}
        >
          {allOn ? 'Deselect all' : 'Select all'}
        </button>
      </nav>

      {links.length ? (
        <div className="kb-list obc-list">
          {links.map((l) => {
            const on = selected.has(l.url)
            return (
              <div className={`kb-res obc-row${on ? '' : ' obc-row--off'}`} key={l.url}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  aria-label={`Import ${l.title}`}
                  className={`obc-check${on ? ' on' : ''}`}
                  onClick={() => toggleSel(l.url)}
                >
                  {on ? <Check size={13} strokeWidth={3.2} /> : null}
                </button>
                <Favicon host={hostOf(l.url)} />
                <div className="kb-res-main">
                  <div className="kb-res-title">{l.title}</div>
                  <div className="obc-topic">
                    <TopicSelect value={topicOf(l)} onChange={(id) => onPick(l.url, id)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="obc-empty">Open a folder above to start sorting.</p>
      )}

      <footer className="ob-cat-foot">
        <button className="btn btn--quiet btn--sm ob-back" onClick={onBack}>
          Back
        </button>
        <button className="ob-cta" onClick={onNext} disabled={selected.size === 0}>
          Next · {selected.size} selected <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  )
}

/* ── Act 2.5 — join the team (pre-filled invite) ──────────────────────── */
function JoinTeam({ onBack, onJoin }: { onBack: () => void; onJoin: () => void }) {
  const [code, setCode] = useState('')
  return (
    <div className="ob-card ob-join">
      <h2 className="ob-title ob-title--sm">Join your team</h2>
      <p className="ob-lede ob-lede--sm">
        You've been invited to a Circle. Confirm to join and bring your bookmarks in.
      </p>

      <div className="ob-join-team">
        <span className="ob-join-av">IN</span>
        <div className="ob-join-id">
          <div className="ob-join-name">Intuition</div>
          <div className="ob-join-sub mono">Core Team · 24 members</div>
        </div>
      </div>

      <label className="ob-join-lab mono">Invite code</label>
      <input
        className="ob-join-input mono"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && code.trim()) onJoin()
        }}
      />

      <footer className="ob-cat-foot">
        <button className="btn btn--quiet btn--sm ob-back" onClick={onBack}>
          Back
        </button>
        <button className="ob-cta" onClick={onJoin} disabled={!code.trim()}>
          Join <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  )
}

/* ── Act 3 — importing (energy flux) / done ───────────────────────────── */
function Importing({ total }: { total: number }) {
  return (
    <div className="ob-card ob-importing">
      <div className="ob-flux" aria-hidden="true">
        <div className="ob-flux-src">
          {Array.from({ length: 6 }).map((_, i) => (
            <span className="ob-flux-tile" key={i} />
          ))}
        </div>
        <div className="ob-flux-wire">
          {[0, 0.45, 0.9, 1.35].map((d, i) => (
            <span className="ob-flux-dot" key={i} style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
        <div className="ob-flux-node">IN</div>
      </div>
      <h2 className="ob-title ob-title--sm">Joining Intuition</h2>
      <p className="ob-lede ob-lede--sm mono">
        <b className="tnum">{total}</b> bookmarks flowing in
      </p>
    </div>
  )
}

/* Social proof — how much of your library the team already keeps. Lives on the
   Done screen (two steps after Sort), self-contained so it owns its own data. */
function TeamOverlap({ total, certifiedCount }: { total: number; certifiedCount: number }) {
  const overlapPeople = useMemo(() => sharedPeople(MY_BOOKMARKS as BmNode[], 5), [])
  const sharedTeams = useMemo(
    () => sharedTeamIds(MY_BOOKMARKS as BmNode[]).map((id) => TEAM_MAP[id]).filter(Boolean),
    [],
  )
  return (
    <div className="ob-overlap ready">
      <span className="ob-overlap-avs">
        {overlapPeople.map((t, j) => (
          <span key={t.name} className="ob-overlap-av" title={t.name} style={{ background: avGrad(t.grad), zIndex: 9 - j }} />
        ))}
      </span>
      <p className="ob-overlap-txt">
        <b className="tnum">{certifiedCount}</b> of your <b className="tnum">{total}</b> bookmarks are already kept by people
        on <b>your workspace</b>.
        {sharedTeams.length ? (
          <span className="ob-overlap-teams">
            {sharedTeams.map((t) => (
              <DeptTagByName key={t.id} name={t.label} />
            ))}
          </span>
        ) : null}
      </p>
    </div>
  )
}

function Done({ total, certifiedCount, onSee }: { total: number; certifiedCount: number; onSee: () => void }) {
  const teamBase = 2400 // Intuition's existing collective knowledge
  const teamTotal = teamBase + total
  const share = Math.max(1, Math.round((total / teamTotal) * 100))
  return (
    <div className="ob-card ob-done">
      <div className="ob-check">
        <Check size={28} />
      </div>
      <h1 className="ob-title">You're part of Intuition</h1>

      <div className="ob-cmp">
        <div className="ob-cmp-heads">
          <div className="ob-cmp-head">
            <span className="ob-cmp-n tnum">{total}</span>
            <span className="ob-cmp-lab">Your bookmarks</span>
          </div>
          <div className="ob-cmp-head ob-cmp-head--team">
            <span className="ob-cmp-n tnum">{teamTotal.toLocaleString('en-US')}</span>
            <span className="ob-cmp-lab">Intuition's knowledge</span>
          </div>
        </div>
        <div className="ob-cmp-bar">
          <span className="ob-cmp-bar-you" style={{ width: `${share}%` }} />
        </div>
        <p className="ob-cmp-note">
          Your knowledge is now <b className="tnum">{share}%</b> of the Circle's.
        </p>
      </div>

      <TeamOverlap total={total} certifiedCount={certifiedCount} />

      <button className="ob-cta" onClick={onSee}>
        Open my bookmarks <ArrowRight size={16} />
      </button>
    </div>
  )
}
