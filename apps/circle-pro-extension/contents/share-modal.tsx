// Content-script UI (Plasmo CSUI) — the "Share in Sofia" modal, injected into
// the current page in an isolated shadow DOM. Opened by a message from the
// background (right-click → Share in Sofia). Dropmark-style two-column layout:
// the shared qualification fields on the left, a live preview on the right.
import { useEffect, useState } from "react"
import type { PlasmoCSConfig } from "plasmo"
import styleText from "data-text:~styles.css"

import { QualifyFields, emptyQualify, type QualifyValue } from "~components/QualifyFields"
import { saveBookmark } from "~lib/bookmarks"
import { hostOf, normalizeUrl } from "~lib/normalizeUrl"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

interface Target {
  url: string
  title: string
}

function faviconFor(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostOf(url)}&sz=128`
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

function ShareModal() {
  const [target, setTarget] = useState<Target | null>(null)
  const [hints, setHints] = useState("")
  const [v, setV] = useState<QualifyValue>(emptyQualify())
  const [saving, setSaving] = useState(false)
  const [shotOk, setShotOk] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const onMessage = (msg: any) => {
      if (msg?.type !== "SHARE_IN_SOFIA") return
      const url: string = msg.url || location.href
      const t: string =
        msg.title && msg.title !== url ? msg.title : document.title || hostOf(url)
      // A link share can't read the linked page's DOM — fall back to its host.
      const isPage = !msg.isLink || url === location.href
      setHints(isPage ? pageMetadata() : `${t} ${hostOf(url)}`)
      setV(emptyQualify(t))
      setShotOk(true)
      setTarget({ url, title: t })
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

  const share = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveBookmark({
        url: target.url,
        normalizedUrl: normalizeUrl(target.url),
        title: v.title.trim() || target.title,
        favicon: faviconFor(target.url),
        context: v.context.trim(),
        contexts: v.contexts,
        addedAt: Date.now()
      })
      setTarget(null)
      setToast("Shared in Sofia")
      setTimeout(() => setToast(null), 2200)
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
          <button className="sis-btn sis-btn--accent" disabled={saving} onClick={share}>
            {saving ? "Sharing…" : "Share in Sofia"}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ShareModal
