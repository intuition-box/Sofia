// Content-script UI (Plasmo CSUI) — the "Share in Sofia" modal, injected into
// the current page in an isolated shadow DOM. Opened by a message from the
// background (right-click → Share in Sofia). Dropmark-style two-column layout:
// the shared qualification fields + workspace picker on the left, a live preview
// on the right. Ported from the circle-pro prototype; the only new layer is the
// real backend (auth + circle picker + POST) replacing the mocked local save.
import { useEffect, useState } from "react"
import type { PlasmoCSConfig } from "plasmo"
import styleText from "data-text:~contents/shareModal.css"

import { QualifyFields, emptyQualify, type QualifyValue } from "~components/share/QualifyFields"
import { CirclePicker } from "~components/share/CirclePicker"
import type {
  CircleMembership,
  ShareLoadResponse,
  ShareSubmitResponse
} from "~lib/circle-pro/types"
import { hostOf, faviconFor } from "~lib/circle-pro/url"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const PICK_KEY = "sofia_pro_share_circle"

// Ask the service worker, but never wait forever: if it doesn't answer in time
// (asleep / another listener holds the channel), resolve undefined so the UI
// leaves the "Loading…" state instead of hanging.
function askBackground<T>(message: unknown, ms = 8000): Promise<T | undefined> {
  return Promise.race([
    chrome.runtime.sendMessage(message) as Promise<T>,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))
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

type AuthState = "loading" | "ready" | "signed-out"

function ShareModal() {
  const [target, setTarget] = useState<Target | null>(null)
  const [hints, setHints] = useState("")
  const [v, setV] = useState<QualifyValue>(emptyQualify())
  const [saving, setSaving] = useState(false)
  const [shotOk, setShotOk] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Backend state — resolved when the modal opens (the JWT itself stays in the
  // service worker; the modal only ever sees circles + results).
  const [authState, setAuthState] = useState<AuthState>("loading")
  const [circles, setCircles] = useState<CircleMembership[]>([])
  const [circleId, setCircleId] = useState<string | null>(null)

  // Resolve the Pro session + the caller's circles via the service worker (the
  // content script can't reach the backend itself). Re-run each time the modal
  // opens so an expired/cleared token surfaces immediately.
  const loadAuth = async () => {
    setAuthState("loading")
    const res = await askBackground<ShareLoadResponse>({ type: "CIRCLE_PRO_LOAD" })
    if (!res || res.signedOut) {
      setAuthState("signed-out")
      return
    }
    setCircles(res.circles)
    const { [PICK_KEY]: stored } = await chrome.storage.local.get(PICK_KEY)
    const ids = res.circles.map((c) => c.groupTermId)
    setCircleId(
      typeof stored === "string" && ids.includes(stored) ? stored : (ids[0] ?? null)
    )
    setAuthState("ready")
  }

  useEffect(() => {
    const onMessage = (msg: { type?: string; url?: string; title?: string; isLink?: boolean }) => {
      if (msg?.type !== "SHARE_IN_SOFIA") return
      const url = msg.url || location.href
      const t = msg.title && msg.title !== url ? msg.title : document.title || hostOf(url)
      // A link share can't read the linked page's DOM — fall back to its host.
      const isPage = !msg.isLink || url === location.href
      setHints(isPage ? pageMetadata() : `${t} ${hostOf(url)}`)
      setV(emptyQualify(t))
      setShotOk(true)
      setTarget({ url, title: t })
      void loadAuth()
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
  const abs = target.url.startsWith("http") ? target.url : `https://${target.url}`
  const canShare = authState === "ready" && !!circleId && !saving

  const pickCircle = (id: string) => {
    setCircleId(id)
    void chrome.storage.local.set({ [PICK_KEY]: id })
  }

  const share = async () => {
    if (!canShare || !circleId) return
    setSaving(true)
    try {
      const res = await askBackground<ShareSubmitResponse>({
        type: "CIRCLE_PRO_SHARE",
        payload: {
          url: target.url,
          title: v.title.trim() || target.title,
          context: v.context.trim(),
          tags: v.contexts
        },
        circleId
      })

      if (res?.ok) {
        setTarget(null)
        setToast("Shared in Sofia")
        setTimeout(() => setToast(null), 2200)
      } else {
        setToast(res?.message || "Could not share — try again")
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
          <span className="sis-logo">S</span>
          <div className="sis-head-t">
            Share in <b>Sofia</b>
          </div>
          <button className="sis-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="sis-cols">
          <div className="sis-left">
            <label className="sis-field-lab">Workspace</label>
            {authState === "loading" ? (
              <div className="sis-note">Loading your workspaces…</div>
            ) : authState === "signed-out" ? (
              <div className="sis-note">
                Connect your wallet in the <b>Sofia</b> side panel to share into a
                workspace.
              </div>
            ) : circles.length === 0 ? (
              <div className="sis-note">
                You're not in any workspace yet. Join or create one in <b>Sofia Pro</b>.
              </div>
            ) : (
              <CirclePicker circles={circles} value={circleId} onChange={pickCircle} />
            )}

            <QualifyFields value={v} onChange={setV} hints={hints} />
          </div>

          <div className="sis-right">
            <label className="sis-field-lab">Preview</label>
            <a className="sis-preview" href={abs} target="_blank" rel="noopener noreferrer">
              {shotOk ? (
                <img
                  className="sis-shot"
                  src={`https://image.thum.io/get/width/600/crop/420/noanimate/${abs}`}
                  alt=""
                  onError={() => setShotOk(false)}
                />
              ) : (
                <div className="sis-shot-fallback">
                  <img src={faviconFor(target.url)} alt="" />
                </div>
              )}
            </a>
            <div className="sis-host">{hostOf(target.url)}</div>
          </div>
        </div>

        <footer className="sis-foot">
          <button className="sis-btn sis-btn--accent" disabled={!canShare} onClick={share}>
            {saving ? "Sharing…" : "Share in Sofia"}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ShareModal
