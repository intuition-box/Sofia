/**
 * useUrlPreviewAsync (explorer wrapper) — calls the shared
 * `@0xsofia/design-system` async-preview hook, injecting the explorer's OG
 * proxy base from `VITE_OG_PROXY_URL`. Kept as a thin wrapper so every
 * call-site keeps the 1-arg `useUrlPreviewAsync(url)` signature and the
 * provider list / caching logic stays single-sourced in the design system.
 */
import { useUrlPreviewAsync as useSharedUrlPreviewAsync } from '@0xsofia/design-system'

const OG_PROXY_URL = import.meta.env.VITE_OG_PROXY_URL as string | undefined

export function useUrlPreviewAsync(url: string | undefined) {
  return useSharedUrlPreviewAsync(url, OG_PROXY_URL)
}
