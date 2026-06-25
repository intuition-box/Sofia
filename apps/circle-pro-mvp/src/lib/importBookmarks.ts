/**
 * Parse a browser's exported bookmarks file (Netscape "bookmarks.html" format,
 * shared by Chrome/Brave/Firefox/Edge/Safari). Returns a flat list of links.
 * The web app can't read the browser's bookmarks live (that needs the
 * extension), but it CAN import the exported file — this is that parser.
 */
export interface ParsedBookmark {
  title: string
  url: string
}

export function parseBookmarksHtml(html: string): ParsedBookmark[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const seen = new Set<string>()
  const out: ParsedBookmark[] = []
  doc.querySelectorAll('a[href]').forEach((a) => {
    const url = a.getAttribute('href')?.trim() ?? ''
    if (!/^https?:\/\//i.test(url) || seen.has(url)) return
    seen.add(url)
    out.push({ title: a.textContent?.trim() || url, url })
  })
  return out
}
