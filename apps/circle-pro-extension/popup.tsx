// Popup — read-only list of links saved via right-click → Add to team. The
// source of truth moves to the backend when we wire infra.
import { useEffect, useState, type CSSProperties } from "react"

import { clearBookmarks, getBookmarks, type SavedBookmark } from "~lib/bookmarks"

const C = {
  ink: "#02000e",
  surface: "#0c0a1e",
  line: "#221f38",
  muted: "#8b87a8",
  text: "#ece9ff",
  accent: "#ffc6b0"
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function timeAgo(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000)
  if (s < 60) return "now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    width: 340,
    maxHeight: 480,
    overflowY: "auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: C.ink,
    color: C.text
  },
  header: {
    position: "sticky",
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: C.ink,
    borderBottom: `1px solid ${C.line}`
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
  empty: { padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 12, lineHeight: 1.6 },
  ul: { listStyle: "none", margin: 0, padding: 6 },
  li: { display: "flex", gap: 10, padding: "9px 8px", borderRadius: 8, cursor: "pointer" },
  fav: { width: 18, height: 18, borderRadius: 4, flex: "none", marginTop: 1 },
  bodyCol: { minWidth: 0, flex: 1 },
  title: { fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  meta: { marginTop: 3, display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: C.muted },
  team: { color: C.accent, fontWeight: 600 },
  host: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
}

function IndexPopup() {
  const [items, setItems] = useState<SavedBookmark[]>([])

  useEffect(() => {
    getBookmarks().then(setItems)
  }, [])

  const onClear = async () => {
    await clearBookmarks()
    setItems([])
  }

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>S</span> Sofia Pro
        </div>
        <button style={styles.clear} onClick={onClear}>
          Clear
        </button>
      </header>

      {items.length === 0 ? (
        <div style={styles.empty}>
          No saved links yet.
          <br />
          Right-click any page or link →<br />
          <b>Add to team</b>.
        </div>
      ) : (
        <ul style={styles.ul}>
          {items.map((b, i) => {
            const host = hostOf(b.url)
            return (
              <li
                key={`${b.url}-${i}`}
                style={styles.li}
                title={b.url}
                onClick={() => chrome.tabs.create({ url: b.url })}>
                <img
                  style={styles.fav}
                  src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
                  alt=""
                />
                <div style={styles.bodyCol}>
                  <div style={styles.title}>{b.title || host}</div>
                  <div style={styles.meta}>
                    <span style={styles.team}>{b.teamLabel}</span>
                    <span>·</span>
                    <span style={styles.host}>{host}</span>
                    <span>·</span>
                    <span>{timeAgo(b.addedAt)}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default IndexPopup
