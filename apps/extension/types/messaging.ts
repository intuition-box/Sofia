/**
 * Minimal shim for the legacy `~types/messaging` import path.
 *
 * `PlasmoMessage` was originally meant to mirror the Plasmo Messaging API
 * envelope (chrome.runtime sendMessage payloads). The full type was never
 * formalized in the repo, so we expose a permissive shape that the existing
 * `ChromeMessage = MessageData | PlasmoMessage` union can absorb without
 * widening the safer side.
 */
export interface PlasmoMessage {
  name: string
  body?: unknown
}
