/**
 * FreeRecommendService — free Recommends through Sofia's write-relayer
 * (services/write-relayer). The landing's /auth hands over an extension
 * session (RELAYER_SESSION); a right-click Recommend then goes through the
 * relayer: no signature, no TRUST, the position is the user's. Anything the
 * relayer can't take (no session, quota used, relayer down) returns
 * `unavailable` and the caller falls back to the usual paths.
 */
import { createServiceLogger } from "../utils/logger"

const logger = createServiceLogger("FreeRecommendService")

const RELAYER_URL = process.env.PLASMO_PUBLIC_WRITE_RELAYER_URL || ""
const STORAGE_KEY = "relayerSession"

export interface RelayerSession {
  token: string
  expiresAt: string
  /** The wallet it was issued for (lowercase) */
  wallet: string
}

/** The page fields the relayer pins for a page with no atom yet */
export interface PageThing {
  name: string
  description: string
  url: string
  image?: string
}

export type FreeRecommendResult =
  | { status: "done"; objectId: string | null; left: number }
  | { status: "unavailable"; reason: string }

class FreeRecommendServiceClass {
  async saveSession(session: RelayerSession): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: { ...session, wallet: session.wallet.toLowerCase() }
    })
  }

  /** Signs the extension out of the relayer (best effort) */
  async clearSession(): Promise<void> {
    const session = await this.read()
    await chrome.storage.local.remove(STORAGE_KEY)
    if (!session || !RELAYER_URL) return
    await fetch(`${RELAYER_URL}/sponsor/extension-session`, {
      method: "DELETE",
      headers: { Authorization: `Extension ${session.token}` }
    }).catch(() => undefined)
  }

  private async read(): Promise<RelayerSession | null> {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    return (stored[STORAGE_KEY] as RelayerSession | undefined) ?? null
  }

  /** The live session for this wallet, else null */
  async getSession(wallet: string): Promise<RelayerSession | null> {
    const session = await this.read()
    if (!session || session.wallet !== wallet.toLowerCase()) return null
    if (Date.parse(session.expiresAt) < Date.now()) return null
    return session
  }

  async recommend(
    wallet: string,
    thing: PageThing,
    tags: readonly string[]
  ): Promise<FreeRecommendResult> {
    if (!RELAYER_URL) return { status: "unavailable", reason: "not configured" }
    const session = await this.getSession(wallet)
    if (!session) return { status: "unavailable", reason: "no session" }
    let res: Response
    try {
      res = await fetch(`${RELAYER_URL}/sponsor/recommend`, {
        method: "POST",
        headers: {
          Authorization: `Extension ${session.token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          wallet,
          pages: [{ thing, tags: [...tags] }]
        })
      })
    } catch (error) {
      logger.warn("Relayer unreachable", error)
      return { status: "unavailable", reason: "unreachable" }
    }
    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      objectIds?: string[]
      left?: number
    }
    if (res.status === 401) await chrome.storage.local.remove(STORAGE_KEY)
    if (!res.ok) {
      logger.info("Free Recommend not taken", {
        status: res.status,
        error: json.error
      })
      return { status: "unavailable", reason: json.error ?? `${res.status}` }
    }
    return {
      status: "done",
      objectId: json.objectIds?.[0] ?? null,
      left: json.left ?? 0
    }
  }
}

export const freeRecommendService = new FreeRecommendServiceClass()
