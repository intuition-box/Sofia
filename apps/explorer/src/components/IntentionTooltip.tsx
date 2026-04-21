import { useState, useRef, useCallback } from 'react'
import { Users } from 'lucide-react'
import { useVaultTooltip, formatEth } from '../hooks/useVaultTooltip'
import './styles/intention-tooltip.css'

interface IntentionTooltipProps {
  termId?: string
  color: string
  children: React.ReactNode
}

export default function IntentionTooltip({ termId, color, children }: IntentionTooltipProps) {
  const [open, setOpen] = useState(false)
  const { stats, loading, fetchStats, clear } = useVaultTooltip()
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  const handleEnter = useCallback(() => {
    clearTimeout(timeout.current)
    if (termId) {
      fetchStats(termId)
      timeout.current = setTimeout(() => setOpen(true), 200)
    }
  }, [termId, fetchStats])

  const handleLeave = useCallback(() => {
    clearTimeout(timeout.current)
    setOpen(false)
    clear()
  }, [clear])

  return (
    <span
      className="relative inline-block cursor-default"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}

      {open && termId && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none it-tooltip"
        >
          <span
            className="block rounded-lg border border-border bg-popover text-popover-foreground shadow-lg px-3 py-2 text-xs"
            style={{ borderTop: `2px solid ${color}` }}
          >
            {loading && !stats && (
              <span className="text-muted-foreground">Loading...</span>
            )}

            {stats && (
              <span className="flex flex-col gap-1.5">
                {/* Support row */}
                <span className="flex items-center justify-between gap-3">
                  <span className="text-emerald-500 font-semibold">Support</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {stats.supportCount}
                    {' · '}
                    {formatEth(stats.supportMarketCap)} T
                  </span>
                </span>

                {/* Oppose row */}
                <span className="flex items-center justify-between gap-3">
                  <span className="text-red-500 font-semibold">Oppose</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {stats.opposeCount}
                    {' · '}
                    {formatEth(stats.opposeMarketCap)} T
                  </span>
                </span>

                {/* User PL */}
                {stats.userPnlPct !== null && (
                  <>
                    <span className="border-t border-border my-0.5" />
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold">Your P&L</span>
                      <span
                        className="font-bold"
                        style={{ color: stats.userPnlPct >= 0 ? '#22C55E' : '#EF4444' }}
                      >
                        {stats.userPnlPct >= 0 ? '+' : ''}{stats.userPnlPct}%
                      </span>
                    </span>
                  </>
                )}
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  )
}
