import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { ReactNode } from "react"
import {
  CACHE_MAX_AGE,
  CACHE_VERSION,
  persister,
  queryClient
} from "./queryClient"

export { queryClient }

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        buster: CACHE_VERSION
      }}>
      {children}
    </PersistQueryClientProvider>
  )
}
