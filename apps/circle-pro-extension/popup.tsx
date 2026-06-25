// Popup — two views:
//  • Browse: your recent browsing history, each page publishable into Sofia
//    (inline qualification: title + context + taxonomy tags), the frictionless
//    curation loop.
//  • Shared: what you've already contributed.
// Source of truth moves to the backend when we wire infra.
import "~styles.css"

import { useEffect, useMemo, useState, type CSSProperties } from "react"

import { QualifyFields, emptyQualify, type QualifyValue } from "~components/QualifyFields"
import { clearBookmarks, getBookmarks, saveBookmark, type SavedBookmark } from "~lib/bookmarks"
import { getRecentHistory, type HistoryItem } from "~lib/history"
import { hostOf, normalizeUrl } from "~lib/normalizeUrl"

// Mirrors @0xsofia/design-system dark tokens (same as styles.css).
const C = {
  ink: "#0b0a12",
  surface: "#13121f",
  surface2: "#1c1a2b",
  line: "#25223a",
  muted: "#8f8ca8",
  text: "#f5f3ff",
  accent: "#ffc6b0"
}

function timeAgo(ts: number): string {
  if (!ts) return ""
  const s = Math.max(0, (Date.now() - ts) / 1000)
  if (s < 60) return "now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const s: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    width: 460,
    height: 580,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    background: C.ink,
    color: C.text
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px 0"
  },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13 },
  logo: {
    display: "grid",
    placeItems: "center",
    width: 22,
    height: 22,
    borderRadius: 6,
    background: C.accent,
    color: C.ink,
    fontWeight: 800,
    fontSize: 12
  },
  clear: {
    border: `1px solid ${C.line}`,
    background: "transparent",
    color: C.muted,
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 6,
    cursor: "pointer"
  },
  tabs: { display: "flex", gap: 4, padding: "10px 14px", borderBottom: `1px solid ${C.line}` },
  tab: {
    flex: 1,
    padding: "7px 10px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: C.muted,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer"
  },
  tabOn: { background: C.surface2, color: C.text },
  list: { flex: 1, overflowY: "auto", padding: 6 },
  empty: { padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 12, lineHeight: 1.6 },
  row: { display: "flex", gap: 10, padding: "9px 8px", borderRadius: 8, alignItems: "flex-start" },
  rowBtn: { cursor: "pointer" },
  fav: { width: 18, height: 18, borderRadius: 4, flex: "none", marginTop: 1 },
  col: { minWidth: 0, flex: 1 },
  title: { fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ctx: {
    marginTop: 2,
    fontSize: 11,
    color: C.text,
    opacity: 0.75,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  meta: { marginTop: 3, display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: C.muted },
  host: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  done: { color: C.accent, fontWeight: 600 },
  tags: { marginTop: 5, display: "flex", flexWrap: "wrap", gap: 4 },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 7px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    border: `1px solid ${C.line}`
  },
  tagDot: { width: 6, height: 6, borderRadius: "50%", flex: "none" },
  qualify: { padding: "10px 8px 4px" },
  qualifyActions: { display: "flex", gap: 8, marginTop: 12 },
  toast: {
    position: "absolute",
    bottom: 14,
    left: "50%",
    transform: "translateX(-50%)",
    background: C.surface,
    border: `1px solid ${C.line}`,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 600
  }
}

function IndexPopup() {
  const [tab, setTab] = useState<"browse" | "shared">("browse")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [shared, setShared] = useState<SavedBookmark[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [v, setV] = useState<QualifyValue>(emptyQualify())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const reloadShared = () => getBookmarks().then(setShared)

  useEffect(() => {
    getRecentHistory().then(setHistory)
    reloadShared()
  }, [])

  const sharedKeys = useMemo(
    () => new Set(shared.map((b) => b.normalizedUrl)),
    [shared]
  )

  const openQualify = (item: HistoryItem) => {
    setSelected(item.url)
    setV(emptyQualify(item.title))
  }

  const share = async (item: HistoryItem) => {
    if (saving) return
    setSaving(true)
    try {
      await saveBookmark({
        url: item.url,
        normalizedUrl: normalizeUrl(item.url),
        title: v.title.trim() || item.title,
        favicon: `https://www.google.com/s2/favicons?domain=${hostOf(item.url)}&sz=128`,
        context: v.context.trim(),
        contexts: v.contexts,
        addedAt: Date.now()
      })
      await reloadShared()
      setSelected(null)
      setToast("Shared in Sofia")
      setTimeout(() => setToast(null), 1800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sis-pop" style={s.body}>
      <header style={s.header}>
        <div style={s.brand}>
          <span style={s.logo}>S</span> Sofia Pro
        </div>
        {tab === "shared" && shared.length ? (
          <button
            style={s.clear}
            onClick={async () => {
              await clearBookmarks()
              setShared([])
            }}>
            Clear
          </button>
        ) : null}
      </header>

      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(tab === "browse" ? s.tabOn : {}) }}
          onClick={() => setTab("browse")}>
          Recent browsing
        </button>
        <button
          style={{ ...s.tab, ...(tab === "shared" ? s.tabOn : {}) }}
          onClick={() => setTab("shared")}>
          Shared{shared.length ? ` (${shared.length})` : ""}
        </button>
      </div>

      <div style={s.list}>
        {tab === "browse" ? (
          history.length === 0 ? (
            <div style={s.empty}>No recent browsing.</div>
          ) : (
            history.map((h) => {
              const host = hostOf(h.url)
              const isShared = sharedKeys.has(normalizeUrl(h.url))
              const isOpen = selected === h.url
              return (
                <div key={h.url}>
                  <div
                    style={{ ...s.row, ...s.rowBtn }}
                    onClick={() => (isOpen ? setSelected(null) : openQualify(h))}>
                    <img
                      style={s.fav}
                      src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
                      alt=""
                    />
                    <div style={s.col}>
                      <div style={s.title}>{h.title}</div>
                      <div style={s.meta}>
                        <span style={s.host}>{host}</span>
                        <span>·</span>
                        <span>{timeAgo(h.lastVisit)}</span>
                        {isShared ? (
                          <>
                            <span>·</span>
                            <span style={s.done}>✓ shared</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {isOpen ? (
                    <div style={s.qualify}>
                      <QualifyFields
                        value={v}
                        onChange={setV}
                        hints={`${h.title} ${host}`}
                        compact
                      />
                      <div style={s.qualifyActions}>
                        <button
                          className="sis-btn sis-btn--ghost"
                          onClick={() => setSelected(null)}>
                          Cancel
                        </button>
                        <button
                          className="sis-btn sis-btn--accent"
                          disabled={saving}
                          onClick={() => share(h)}>
                          {saving ? "Sharing…" : "Share in Sofia"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )
        ) : shared.length === 0 ? (
          <div style={s.empty}>
            Nothing shared yet.
            <br />
            Publish a page from <b>Recent browsing</b>, or right-click → <b>Share in Sofia</b>.
          </div>
        ) : (
          shared.map((b, i) => {
            const host = hostOf(b.url)
            return (
              <div
                key={`${b.normalizedUrl}-${i}`}
                style={{ ...s.row, ...s.rowBtn }}
                title={b.url}
                onClick={() => chrome.tabs.create({ url: b.url })}>
                <img
                  style={s.fav}
                  src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
                  alt=""
                />
                <div style={s.col}>
                  <div style={s.title}>{b.title || host}</div>
                  {b.context ? <div style={s.ctx}>{b.context}</div> : null}
                  <div style={s.meta}>
                    <span style={s.host}>{host}</span>
                    <span>·</span>
                    <span>{timeAgo(b.addedAt)}</span>
                  </div>
                  {b.contexts?.length ? (
                    <div style={s.tags}>
                      {b.contexts.map((c) => (
                        <span key={c.id} style={{ ...s.tag, color: c.color, borderColor: c.color }}>
                          <span style={{ ...s.tagDot, background: c.color }} />
                          {c.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {toast ? <div style={s.toast}>✓ {toast}</div> : null}
    </div>
  )
}

export default IndexPopup
