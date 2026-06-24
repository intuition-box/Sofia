/**
 * Pure, dependency-free helpers shared across the app. Ported from the
 * design's `circle/components.jsx` + `circle/data.jsx`.
 */
import type { Member, Person } from './types'

/** Deterministic avatar gradients — no external images. */
const AV_GRADS: [string, string][] = [
  ['#22c55e', '#0ea5e9'],
  ['#8b5cf6', '#ec4899'],
  ['#f59e0b', '#ef4444'],
  ['#06b6d4', '#3b82f6'],
  ['#ec4899', '#8b5cf6'],
  ['#ff5722', '#f59e0b'],
  ['#3b82f6', '#22c55e'],
  ['#14b8a6', '#22c55e'],
  ['#a78bdb', '#5cc4d6'],
  ['#e4b95a', '#e0896a'],
  ['#5cc4d6', '#7bade0'],
  ['#d98cb3', '#a78bdb'],
  ['#7bade0', '#6dd4a0'],
  ['#ef4444', '#ff5722'],
  ['#06b6d4', '#8b5cf6'],
  ['#22c55e', '#f59e0b'],
  ['#ec4899', '#06b6d4'],
]

/** Linear gradient string for an avatar index. */
export function avGrad(i: number): string {
  const g = AV_GRADS[i % AV_GRADS.length]
  return `linear-gradient(140deg, ${g[0]}, ${g[1]})`
}

/** Two-letter monogram from a handle (strips `.eth` / `0x`). */
export function initials(handle: string): string {
  const base = handle.replace(/\.eth$/, '').replace(/^0x/, '')
  const letters = base.replace(/[^a-zA-Z0-9]/g, '')
  return (letters.slice(0, 2) || '??').toUpperCase()
}

/** Locale-grouped integer, e.g. 8420 → "8,420". */
export function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

export interface DomainLevel {
  id: string
  level: number
}

/** A member's strongest topics, sorted desc, above a floor. */
export function topDomains(
  m: { themes: Record<string, number> },
  n = 3,
  min = 40,
): DomainLevel[] {
  return Object.entries(m.themes)
    .filter(([, v]) => v >= min)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, level]) => ({ id, level }))
}

/** Parse "5m" / "2h" / "yesterday" / "3d" → minutes (for recency sorts). */
export function parseRecency(str: string): number {
  if (!str) return 1e9
  if (str === 'yesterday') return 1440
  const m = str.match(/(\d+)\s*(m|h|d)/)
  if (!m) return 1e7
  const n = +m[1]
  return m[2] === 'm' ? n : m[2] === 'h' ? n * 60 : n * 1440
}

/** "12m" / "2h" / "3d" / "1w" → minutes, for activity ordering. */
export function whenToMin(w: string): number {
  const n = parseInt(w, 10)
  if (w.includes('m')) return n
  if (w.includes('h')) return n * 60
  if (w.includes('d')) return n * 1440
  if (w.includes('w')) return n * 10080
  return 9e9
}

/**
 * Two distinct scores, never conflated:
 *  · trust     — reliability (coherence + peer-confirmation + stake)
 *  · influence — amplification (volume + reach; can exceed trust for farmers)
 */
export function dualScore(p: Person): { trust: number; influence: number } {
  const trust = p.score ?? p.roleScore
  let influence: number
  if (p.extra) {
    influence = Math.min(
      96,
      Math.round(p.roleScore * 0.6 + (p.contributions || 0) / 18),
    )
  } else {
    influence = Math.min(
      96,
      Math.round(
        (p.peers ?? 0) * 1.4 +
          (p.pioneer30d ?? 0) * 2 +
          (p.stake ?? 0) / 220 +
          (p.raw ?? 0) * 0.3 +
          (p.coherence ?? 0) * 0.08,
      ),
    )
  }
  return { trust, influence }
}

/** Bare host from a URL (protocol + www + path stripped). */
export function hostOf(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
}

export type { Member }
