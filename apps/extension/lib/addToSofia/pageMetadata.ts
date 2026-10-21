// Page metadata blob (title, description, keywords, og:*, h1, host) — feeds
// the tag field's "Suggested from this page". The modal runs it in the page;
// the side panel runs it in the active tab through chrome.scripting.

/** Runs IN the page. Self-contained: chrome.scripting serializes it. */
export function collectPageMetadata(): string {
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

/** Metadata of the active tab, from the side panel ("" when unreachable) */
export async function readActiveTabMetadata(): Promise<string> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return ""
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPageMetadata
    })
    return typeof result?.result === "string" ? result.result : ""
  } catch {
    // chrome:// pages, the web store, … can't be scripted
    return ""
  }
}
