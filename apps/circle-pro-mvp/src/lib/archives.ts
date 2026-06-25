/**
 * Archives store — an archive is a named collection (e.g. "EthCC Cannes 2025")
 * of saved items grouped into categories. Anyone on the team can add items and
 * spin up new categories. Seeded from mock data; every edit lives here.
 * Event-based store, like the skills store.
 */
import { useSyncExternalStore } from 'react'

export type ItemKind = 'web3' | 'repo' | 'video' | 'article'

/** Type label + accent per item kind (matches the design sheet). */
export const ITEM_KINDS: Record<ItemKind, { label: string; color: string }> = {
  web3: { label: 'Web3 project', color: '#4F46E5' },
  repo: { label: 'Repo · file', color: '#3B6FE0' },
  video: { label: 'Video', color: '#E0483B' },
  article: { label: 'Article', color: '#C9821F' },
}

export interface ArchiveItem {
  id: string
  kind: ItemKind
  /** Domain/topic id (TOPIC_MAP key) → the Domain tag shown on the item. */
  topic: string
  title: string
  host: string
  url: string
  note?: string
  /** Handles who added it — one → "Added by X", several → "Saved together". */
  addedBy: string[]
  votes: number
  voted: boolean
  /** Small mono meta on the type row, e.g. "1.2k", "22 min". */
  meta?: string
}

export interface ArchiveCategory {
  id: string
  name: string
  /** Dot colour. */
  color: string
  /** The catch-all bucket (grey, can't be renamed/removed; items show "File →"). */
  unsorted?: boolean
  items: ArchiveItem[]
}

export interface Archive {
  id: string
  name: string
  desc: string
  createdBy: string
  votes: number
  voted: boolean
  categories: ArchiveCategory[]
}

/** Total items across every category — used for the switcher count badge. */
export const archiveCount = (a: Archive): number => a.categories.reduce((n, c) => n + c.items.length, 0)

/** Infer an item kind from its URL/host. */
export function kindFor(url: string): ItemKind {
  const u = url.toLowerCase()
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(u)) return 'video'
  if (/github\.com|gitlab\.com/.test(u)) return 'repo'
  return 'article'
}

const CAT_COLORS = ['#4F46E5', '#C9821F', '#3B6FE0', '#2E9E6B', '#A47B9E', '#E0483B']

const seed: Archive[] = [
  {
    id: 'ethcc-cannes',
    name: 'EthCC Cannes 2025',
    desc: 'Everything Maxime and I caught at Cannes. Booth projects, talks, repos, people to follow up with. Dumped fast, sorted later.',
    createdBy: 'you',
    votes: 12,
    voted: false,
    categories: [
      {
        id: 'web3',
        name: 'Web3 projects',
        color: '#4F46E5',
        items: [
          {
            id: 'a-intuition',
            kind: 'web3',
            topic: 'gov',
            title: 'Intuition — onchain trust protocol',
            host: 'intuition.systems',
            url: 'https://intuition.systems',
            note: "Met the team at the booth. Peer-validated expertise captured onchain, very close to Sofia's thesis. Follow up with their dev rel.",
            addedBy: ['you'],
            votes: 7,
            voted: false,
          },
          {
            id: 'a-base',
            kind: 'web3',
            topic: 'devtool',
            title: 'Base onchain summer booth',
            host: 'base.org',
            url: 'https://base.org',
            note: 'Two demos with real traction among the crowd. The social-graph one is worth a second look.',
            addedBy: ['you', 'Maxime'],
            votes: 9,
            voted: false,
          },
        ],
      },
      {
        id: 'talks',
        name: 'Talks & repos',
        color: '#C9821F',
        items: [
          {
            id: 'a-sdk',
            kind: 'repo',
            topic: 'devtool',
            title: 'intuition-ts SDK',
            host: 'github.com/0xIntuition/intuition-ts',
            url: 'https://github.com/0xIntuition/intuition-ts',
            note: 'Clean TypeScript SDK for attestation calls. Reference for our frontend wiring.',
            addedBy: ['you'],
            votes: 5,
            voted: false,
            meta: '1.2k',
          },
          {
            id: 'a-eigentrust',
            kind: 'video',
            topic: 'sec',
            title: 'EigenTrust deep dive (talk)',
            host: 'youtube.com/watch?v=eigentrust',
            url: 'https://youtube.com/watch?v=eigentrust',
            note: 'The scoring math behind reputation graphs. Save for the Trust Engine work.',
            addedBy: ['Maxime'],
            votes: 4,
            voted: false,
            meta: '22 min',
          },
        ],
      },
      {
        id: 'unsorted',
        name: 'Unsorted',
        color: '#C9C2B2',
        unsorted: true,
        items: [
          {
            id: 'a-notes',
            kind: 'article',
            topic: 'gov',
            title: 'Notes from the trust-graph panel',
            host: 'mirror.xyz/notes-cannes-trust',
            url: 'https://mirror.xyz/notes-cannes-trust',
            note: 'Good recap of the panel we missed. The part on sybil resistance is relevant.',
            addedBy: ['Maxime'],
            votes: 2,
            voted: false,
            meta: '7 min',
          },
        ],
      },
    ],
  },
  {
    id: 'sofia-research',
    name: 'Sofia research',
    desc: 'Background reading for the Trust Engine — reputation models, sybil resistance, attestation standards.',
    createdBy: 'you',
    votes: 8,
    voted: false,
    categories: [
      {
        id: 'sr-models',
        name: 'Reputation models',
        color: '#3B6FE0',
        items: [
          {
            id: 'sr-eip',
            kind: 'repo',
            topic: 'sec',
            title: 'ERC-8004 — agent identity & reputation',
            host: 'eips.ethereum.org',
            url: 'https://eips.ethereum.org',
            note: 'Portable identity plus onchain reputation. Maps onto our attestation layer.',
            addedBy: ['you'],
            votes: 6,
            voted: false,
          },
        ],
      },
      {
        id: 'sr-unsorted',
        name: 'Unsorted',
        color: '#C9C2B2',
        unsorted: true,
        items: [
          {
            id: 'sr-soulbound',
            kind: 'article',
            topic: 'gov',
            title: 'Decentralized society: soulbound tokens',
            host: 'papers.ssrn.com',
            url: 'https://papers.ssrn.com',
            addedBy: ['Maxime'],
            votes: 3,
            voted: false,
            meta: '20 min',
          },
        ],
      },
    ],
  },
  {
    id: 'slm-project',
    name: 'SLM project',
    desc: 'Saint-Laurent-le-Minier token POC — refs, contracts, governance reading.',
    createdBy: 'you',
    votes: 4,
    voted: false,
    categories: [
      {
        id: 'slm-unsorted',
        name: 'Unsorted',
        color: '#C9C2B2',
        unsorted: true,
        items: [
          {
            id: 'slm-snapshot',
            kind: 'article',
            topic: 'gov',
            title: 'Local-token governance models',
            host: 'snapshot.org',
            url: 'https://snapshot.org',
            addedBy: ['you'],
            votes: 1,
            voted: false,
          },
        ],
      },
    ],
  },
]

let state: Archive[] = seed
const listeners = new Set<() => void>()
const emit = () => {
  for (const l of listeners) l()
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

let seq = 0
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`

const mapArchive = (id: string, fn: (a: Archive) => Archive) => {
  state = state.map((a) => (a.id === id ? fn(a) : a))
  emit()
}
const mapCat = (archiveId: string, catId: string, fn: (c: ArchiveCategory) => ArchiveCategory) =>
  mapArchive(archiveId, (a) => ({ ...a, categories: a.categories.map((c) => (c.id === catId ? fn(c) : c)) }))

export function renameArchive(id: string, name: string): void {
  const n = name.trim()
  if (n) mapArchive(id, (a) => ({ ...a, name: n }))
}
export function setArchiveDesc(id: string, desc: string): void {
  mapArchive(id, (a) => ({ ...a, desc }))
}
export function voteArchive(id: string): void {
  mapArchive(id, (a) => ({ ...a, voted: !a.voted, votes: a.votes + (a.voted ? -1 : 1) }))
}
export function voteItem(archiveId: string, catId: string, itemId: string): void {
  mapCat(archiveId, catId, (c) => ({
    ...c,
    items: c.items.map((it) => (it.id === itemId ? { ...it, voted: !it.voted, votes: it.votes + (it.voted ? -1 : 1) } : it)),
  }))
}
export function renameCategory(archiveId: string, catId: string, name: string): void {
  mapCat(archiveId, catId, (c) => ({ ...c, name }))
}
export function removeCategory(archiveId: string, catId: string): void {
  mapArchive(archiveId, (a) => ({ ...a, categories: a.categories.filter((c) => c.id !== catId) }))
}
export function addCategory(archiveId: string, name: string): void {
  const n = name.trim()
  if (!n) return
  mapArchive(archiveId, (a) => {
    const color = CAT_COLORS[a.categories.filter((c) => !c.unsorted).length % CAT_COLORS.length]
    const cat: ArchiveCategory = { id: nextId('cat'), name: n, color, items: [] }
    // Keep the unsorted bucket last.
    const i = a.categories.findIndex((c) => c.unsorted)
    const cats = [...a.categories]
    if (i === -1) cats.push(cat)
    else cats.splice(i, 0, cat)
    return { ...a, categories: cats }
  })
}
export function addItem(archiveId: string, catId: string, url: string, title: string): void {
  const u = url.trim()
  if (!u) return
  const host = u.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const item: ArchiveItem = {
    id: nextId('item'),
    kind: kindFor(u),
    topic: 'devtool',
    title: title.trim() || host,
    host,
    url: u,
    addedBy: ['you'],
    votes: 1,
    voted: true,
  }
  mapCat(archiveId, catId, (c) => ({ ...c, items: [...c.items, item] }))
}
export function createArchive(name: string): string {
  const n = name.trim() || 'New archive'
  const id = nextId('archive')
  const archive: Archive = {
    id,
    name: n,
    desc: '',
    createdBy: 'you',
    votes: 0,
    voted: false,
    categories: [{ id: nextId('cat'), name: 'Unsorted', color: '#C9C2B2', unsorted: true, items: [] }],
  }
  state = [...state, archive]
  emit()
  return id
}

export function useArchivesStore(): Archive[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
