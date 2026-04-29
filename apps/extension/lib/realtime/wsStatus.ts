/**
 * wsStatus — write-only sinks for SubscriptionManager connection events.
 * No reader is currently wired; these stubs preserve the call sites until
 * the offline-badge UI is implemented (or the store is removed).
 */

export function markConnecting() {}
export function markConnected() {}
export function markOffline(_reason?: string) {}
export function markError(_reason: string) {}
