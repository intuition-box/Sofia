/**
 * EcosystemFigure — one-line read-only context for a platform: activity on
 * every atom that represents it across the Intuition graph, e.g.
 * "Ecosystem: 12 supporters · 3.40 T across 5 atoms". Renders nothing when
 * the ecosystem adds nothing beyond the Sofia atom.
 */
import type { PlatformEcosystemStats } from '@/services/platformMarketService'
import { formatTrust } from '@/utils/formatting'

interface EcosystemFigureProps {
  stats: PlatformEcosystemStats | undefined
  className?: string
}

/** True when other atoms or claims add to the Sofia atom's own numbers. */
export function hasEcosystemActivity(
  stats: PlatformEcosystemStats | undefined,
): stats is PlatformEcosystemStats {
  return !!stats && (stats.atomCount > 1 || stats.claimCount > 0)
}

export function ecosystemText(stats: PlatformEcosystemStats): string {
  const supporters = `${stats.supporters} supporter${stats.supporters === 1 ? '' : 's'}`
  const atoms = `${stats.atomCount} atom${stats.atomCount === 1 ? '' : 's'}`
  return `Ecosystem: ${supporters} · ${formatTrust(BigInt(stats.totalStaked))} across ${atoms}`
}

export default function EcosystemFigure({
  stats,
  className,
}: EcosystemFigureProps) {
  if (!hasEcosystemActivity(stats)) return null
  return (
    <span
      className={className ?? 'pm-eco'}
      title={`All atoms representing this platform on Intuition, plus ${stats.claimCount} claim${stats.claimCount === 1 ? '' : 's'} on them. Taking a position uses the Sofia atom.`}
    >
      {ecosystemText(stats)}
    </span>
  )
}
