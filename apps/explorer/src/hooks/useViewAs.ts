/**
 * ViewAs context — allows viewing the app as another user (read-only).
 * When a viewAs address is set, hooks should use it instead of the connected wallet.
 */

import { createContext, useContext, useState, useCallback, createElement } from 'react'
import type { ReactNode } from 'react'

interface ViewAsContextValue {
  /** The address we're viewing as (null = own profile) */
  viewAsAddress: string | null
  /** Whether we're in view-as mode */
  isViewingAs: boolean
  /** Set the address to view as */
  setViewAs: (address: string) => void
  /** Exit view-as mode */
  clearViewAs: () => void
  /** Get the effective address: viewAs address if set, otherwise connected wallet */
  getEffectiveAddress: (connectedAddress: string | undefined) => string | undefined
}

const ViewAsContext = createContext<ViewAsContextValue | null>(null)

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsAddress, setViewAsAddress] = useState<string | null>(null)

  const setViewAs = useCallback((address: string) => {
    setViewAsAddress(address.toLowerCase())
  }, [])

  const clearViewAs = useCallback(() => {
    setViewAsAddress(null)
  }, [])

  const getEffectiveAddress = useCallback(
    (connectedAddress: string | undefined) => {
      return viewAsAddress || connectedAddress
    },
    [viewAsAddress],
  )

  return createElement(
    ViewAsContext.Provider,
    {
      value: {
        viewAsAddress,
        isViewingAs: !!viewAsAddress,
        setViewAs,
        clearViewAs,
        getEffectiveAddress,
      },
    },
    children,
  )
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext)
  if (!ctx) throw new Error('useViewAs must be used within ViewAsProvider')
  return ctx
}
