/**
 * App providers — Privy (web login + embedded wallet) and React Query. Kept
 * lean: no cache persistence (comment threads are fetched on demand, not worth
 * the localStorage round-trip), no router (the shell is tab-state driven).
 */
import type { ReactNode } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PRIVY_APP_ID } from '../config'
import { CircleProvider } from '../hooks/useCircle'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Email + Google + wallet — an embedded wallet is provisioned for
        // social logins, so a user gets an address without owning a wallet.
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        appearance: {
          theme: '#02000e',
          accentColor: '#ffc6b0',
          showWalletLoginFirst: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <CircleProvider>{children}</CircleProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
