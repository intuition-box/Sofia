import { useState, useEffect, useRef, useMemo } from 'react'
import type { Address } from 'viem'
import { batchResolve, getDisplayName, getAvatarUrl } from '@/services/ensService'

export function useEnsNames(addresses: Address[]) {
  const [revision, setRevision] = useState(0)
  const runningRef = useRef(false)

  const addressKey = useMemo(
    () => addresses.map((a) => a.toLowerCase()).sort().join(','),
    [addresses],
  )

  useEffect(() => {
    if (!addressKey) return

    // If already running, queue a re-run after current finishes
    if (runningRef.current) {
      const timer = setTimeout(() => setRevision((r) => r + 1), 500)
      return () => clearTimeout(timer)
    }

    runningRef.current = true
    batchResolve(addresses, () => setRevision((r) => r + 1)).finally(() => {
      runningRef.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressKey])

  void revision

  function getDisplay(addr: Address): string {
    return getDisplayName(addr)
  }

  function getAvatar(addr: Address): string {
    return getAvatarUrl(addr)
  }

  return { getDisplay, getAvatar }
}
