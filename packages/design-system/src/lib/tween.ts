/**
 * Pure maths behind `<AnimatedNumber>`: where a count stands `elapsed` ms
 * into a `duration` ms run from `from` to `to`, eased out (fast start, soft
 * landing) so the last digits settle instead of stopping dead.
 */
export function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return 1 - (1 - c) ** 3
}

export function tweenValue(
  from: number,
  to: number,
  elapsed: number,
  duration: number,
): number {
  if (duration <= 0 || elapsed >= duration) return to
  return from + (to - from) * easeOutCubic(elapsed / duration)
}
