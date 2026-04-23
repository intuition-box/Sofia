/**
 * Deterministic avatar fallback colour — picks one of the proto's pastel
 * palette slots based on a seed string so each identity always gets the
 * same tile. Ported from proto-explorer/src/data.ts member palette.
 */
const AVATAR_COLORS = [
  '#ffc6b0', // peach
  '#7bade0', // blue
  '#a78bdb', // purple
  '#e4b95a', // gold
  '#6dd4a0', // green
  '#d98cb3', // pink
  '#e0896a', // coral
  '#5cc4d6', // cyan
] as const

export function avatarColor(seed: string): string {
  let hash = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
