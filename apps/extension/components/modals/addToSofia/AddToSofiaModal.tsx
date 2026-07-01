// The "Add to Sofia" modal — qualification fields (title + intention + tags) on
// the left, a live preview on the right. Mounted by the content-script entry
// (contents/add-to-sofia-modal.tsx) inside an isolated shadow DOM; opened by a
// right-click → "Add to Sofia" message from the background.
//
// On submit it asks the service worker to queue the page into the extension's
// batch-certification CART (the content script can't touch the cart's IndexedDB
// itself). No workspace, no backend POST — that's the Pro path, kept as
// commented `// PRO (later):` blocks below.
import { useEffect, useState } from "react"

import {
  emptyQualify,
  QualifyFields,
  type QualifyValue
} from "~components/modals/addToSofia/QualifyFields"
import type {
  AddToCartResponse,
  AddToSofiaStatusResponse
} from "~lib/addToSofia/types"
import { hostOf } from "~lib/addToSofia/url"
import { getFaviconUrl } from "~lib/utils"

// PRO (later): workspace picker + circle-pro session types.
// import { CirclePicker } from "~components/modals/addToSofia/CirclePicker"
// import type { CircleMembership, ShareLoadResponse, ShareSubmitResponse } from "~lib/addToSofia/types"

// Ask the service worker, but never wait forever: if it doesn't answer in time
// (asleep / another listener holds the channel), resolve undefined so the UI
// leaves the "Adding…" state instead of hanging.
function askBackground<T>(message: unknown, ms = 8000): Promise<T | undefined> {
  return Promise.race([
    chrome.runtime.sendMessage(message) as Promise<T>,
    new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), ms)
    )
  ]).catch(() => undefined)
}

interface Target {
  url: string
  title: string
}

// Metadata blob for the current page — feeds the tag field's suggestions.
function pageMetadata(): string {
  const meta = (sel: string) =>
    (document.querySelector(sel) as HTMLMetaElement | null)?.content ?? ""
  return [
    document.title,
    meta("meta[name='description']"),
    meta("meta[name='keywords']"),
    meta("meta[property='og:title']"),
    meta("meta[property='og:description']"),
    meta("meta[property='og:site_name']"),
    document.querySelector("h1")?.textContent ?? "",
    location.hostname
  ]
    .filter(Boolean)
    .join(" ")
}

export default function AddToSofiaModal() {
  const [target, setTarget] = useState<Target | null>(null)
  const [hints, setHints] = useState("")
  const [v, setV] = useState<QualifyValue>(emptyQualify())
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [shotOk, setShotOk] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  // null = unknown (status not yet resolved). false → the modal swaps its
  // primary action for a "connect" button that opens the side panel.
  const [connected, setConnected] = useState<boolean | null>(null)

  // PRO (later): backend session + workspace state, resolved when the modal
  // opens via the service worker (the JWT stays in the worker). See the
  // mvp-intuition-pro branch for the full loadAuth / CirclePicker wiring.

  useEffect(() => {
    const onMessage = (msg: {
      type?: string
      url?: string
      title?: string
      isLink?: boolean
    }) => {
      if (msg?.type !== "ADD_TO_SOFIA_OPEN") return
      const url = msg.url || location.href
      const t =
        msg.title && msg.title !== url
          ? msg.title
          : document.title || hostOf(url)
      // A link share can't read the linked page's DOM — fall back to its host.
      const isPage = !msg.isLink || url === location.href
      setHints(isPage ? pageMetadata() : `${t} ${hostOf(url)}`)
      setV(emptyQualify(t))
      setShotOk(true)
      setDone(false)
      setTarget({ url, title: t })
      // Resolve wallet-connection state so we can render a connect-first
      // affordance. Unknown → treat as connected (never block the happy path).
      setConnected(null)
      void askBackground<AddToSofiaStatusResponse>({
        type: "ADD_TO_SOFIA_STATUS"
      }).then((res) => setConnected(res ? res.connected : true))
      // PRO (later): void loadAuth()
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTarget(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [target])

  if (!target) {
    return toast ? <div className="sis-toast">✓ {toast}</div> : null
  }

  const close = () => setTarget(null)
  const abs = target.url.startsWith("http")
    ? target.url
    : `https://${target.url}`
  const canAdd = v.intentions.length > 0 && !saving

  // Open the side panel so the user can connect. Called SYNCHRONOUSLY from the
  // button's onClick (no await before) — chrome.sidePanel.open() requires an
  // active user gesture, which a message dispatched during the click preserves.
  const connect = () => {
    try {
      chrome.runtime.sendMessage({ type: "open_sidepanel" })
    } catch {
      // SW asleep / no receiver — nothing else we can do from the page.
    }
    setTarget(null)
  }

  const add = async () => {
    if (!v.intentions.length || saving) return
    setSaving(true)
    try {
      const res = await askBackground<AddToCartResponse>({
        type: "ADD_TO_CART",
        url: target.url,
        title: v.title.trim() || target.title,
        intentions: v.intentions,
        contextSlugs: v.contexts.map((c) => c.id),
        objectTermId: v.objectTermId
      })

      if (res?.ok) {
        // Confirm in place: the button turns green with a check, then close.
        setDone(true)
        setTimeout(() => {
          setTarget(null)
          setDone(false)
        }, 1300)
      } else if (res?.reason === "no-wallet") {
        // Raced a disconnect after the open-time check — reflect it and open
        // the side panel so the user can connect (best-effort; the gesture may
        // be stale after the await, but the open-time pre-check covers the
        // normal case).
        setConnected(false)
        try {
          chrome.runtime.sendMessage({ type: "open_sidepanel" })
        } catch {
          // ignore — SW asleep / no receiver
        }
        setToast("Connect your wallet in the Sofia side panel first")
        setTimeout(() => setToast(null), 2600)
      } else {
        const msg =
          res?.reason === "duplicate"
            ? "Already in your cart"
            : "Couldn't add — try again"
        setToast(msg)
        setTimeout(() => setToast(null), 2600)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sis-overlay" onClick={close}>
      <div className="sis-card" onClick={(e) => e.stopPropagation()}>
        <button className="sis-close" onClick={close} aria-label="Close">
          ✕
        </button>

        {connected === false && (
          <div className="sis-connect-note">
            Connect your wallet to add this page. Opening the Sofia side panel…
          </div>
        )}

        <div className="sis-cols">
          <div className="sis-left">
            {/* PRO (later): workspace picker — choose which circle to share into. */}
            <QualifyFields value={v} onChange={setV} hints={hints} />
          </div>

          <div className="sis-right">
            <section className="sis-section">
              <label className="sis-field-lab">Preview</label>
              <a
                className="sis-preview"
                href={abs}
                target="_blank"
                rel="noopener noreferrer">
                {shotOk ? (
                  <img
                    className="sis-shot"
                    // thum.io renders the page at `width` px wide, so a LARGE
                    // width = desktop layout (dezoomed). The CSS box then scales
                    // it down; crop keeps the 16:10 ratio.
                    src={`https://image.thum.io/get/width/1440/crop/900/noanimate/${abs}`}
                    alt=""
                    onError={() => setShotOk(false)}
                  />
                ) : (
                  <div className="sis-shot-fallback">
                    <img src={getFaviconUrl(target.url, 128)} alt="" />
                  </div>
                )}
              </a>
              <div className="sis-host">{hostOf(target.url)}</div>
            </section>
          </div>
        </div>

        <footer className="sis-foot">
          {connected === false ? (
            <button className="sis-btn sis-btn--accent" onClick={connect}>
              Connect to Sofia
            </button>
          ) : (
            <button
              className={`sis-btn sis-btn--accent${done ? " sis-btn--done" : ""}`}
              disabled={!canAdd || done}
              onClick={add}>
              {done
                ? "✓ Added to my cart"
                : saving
                  ? "Adding…"
                  : "Add to my cart"}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
