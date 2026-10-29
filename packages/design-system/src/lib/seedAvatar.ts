// Default avatar for accounts without a picture: a soft gradient with three
// blurred, translucent shapes, derived from a seed (usually the lowercased
// wallet address) so the same account looks the same everywhere.

const SIZE = 100

// FNV-1a, then a xorshift stream: tiny, deterministic, good enough to spread
// colors and positions.
function seededStream(seed: string): () => number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let state = h >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0x100000000
  }
}

const hsl = (h: number, s: number, l: number) =>
  `hsl(${Math.round(h)} ${s}% ${l}%)`

/** SVG markup of the avatar for `seed`. */
export function seedAvatarSvg(seed: string): string {
  const rand = seededStream(seed || 'unknown')
  const hue = rand() * 360
  const shapes = [0, 1, 2]
    .map((i) => {
      const cx = 15 + rand() * 70
      const cy = 15 + rand() * 70
      const r = 22 + rand() * 26
      const shapeHue = (hue + 40 + i * 70 + rand() * 40) % 360
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${hsl(shapeHue, 80, 62)}" fill-opacity="0.75"/>`
    })
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${hsl(hue, 70, 55)}"/>` +
    `<stop offset="1" stop-color="${hsl((hue + 60) % 360, 70, 40)}"/>` +
    `</linearGradient><filter id="b"><feGaussianBlur stdDeviation="9"/></filter></defs>` +
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>` +
    `<g filter="url(#b)">${shapes}</g></svg>`
  )
}

/** The avatar for `seed` as a data URI, ready for an `<img src>`. */
export function seedAvatarDataUri(seed: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(seedAvatarSvg(seed))}`
}
