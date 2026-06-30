// The "Add to Sofia" modal — qualification fields (title + intention + tags) on
// the left, a live preview on the right. Mounted by the content-script entry
// (contents/add-to-sofia-modal.tsx) inside an isolated shadow DOM; opened by a
// right-click → "Add to Sofia" message from the background.
//
// On submit it asks the service worker to queue the page into the extension's
// batch-certification CART (the content script can't touch the cart's IndexedDB
// itself). No workspace, no backend POST — that's the Pro path, kept as
// commented `// PRO (later):` blocks below.
import sofiaLogo from "data-base64:~assets/icon-dark-128.png"
import { useEffect, useState } from "react"

import {
  emptyQualify,
  QualifyFields,
  type QualifyValue
} from "~components/modals/addToSofia/QualifyFields"
import type { AddToCartResponse } from "~lib/addToSofia/types"
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
  const canAdd = !!v.intention && !saving

  const add = async () => {
    if (!v.intention || saving) return
    setSaving(true)
    try {
      const res = await askBackground<AddToCartResponse>({
        type: "ADD_TO_CART",
        url: target.url,
        title: v.title.trim() || target.title,
        intention: v.intention,
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
      } else {
        const msg =
          res?.reason === "no-wallet"
            ? "Connect your wallet in the Sofia side panel first"
            : res?.reason === "duplicate"
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
        <header className="sis-head">
          <img className="sis-logo" src={sofiaLogo} alt="Sofia" />
          <div className="sis-head-t">
            Add to <b>Sofia</b>
          </div>
          <button className="sis-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="sis-cols">
          <div className="sis-left">
            {/* PRO (later): workspace picker — choose which circle to share into. */}
            <QualifyFields value={v} onChange={setV} hints={hints} />
          </div>

          <div className="sis-right">
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
          </div>
        </div>

        <footer className="sis-foot">
          <button
            className={`sis-btn sis-btn--accent${done ? " sis-btn--done" : ""}`}
            disabled={!canAdd || done}
            onClick={add}>
            {done ? "✓ Added to Sofia" : saving ? "Adding…" : "Add to Sofia"}
          </button>
        </footer>
      </div>
    </div>
  )
}
