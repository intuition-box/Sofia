/**
 * Parse a browser's exported bookmarks file (Netscape "bookmarks.html" format,
 * shared by Chrome/Brave/Firefox/Edge/Safari). Returns a flat list of links.
 * The web app can't read the browser's bookmarks live (that needs the
 * extension), but it CAN import the exported file — this is that parser.
 */
import type { BmNode } from '../data/myBookmarks'

export interface ParsedBookmark {
  title: string
  url: string
}

/** Flat list of links — used by the My-bookmarks "Sync" button. */
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

/** Folder TREE (BmNode[]) preserving the Netscape <H3> folders — used by the
 *  onboarding's folder-browser. Falls back to a flat list if no structure. */
export function parseBookmarksTree(html: string): BmNode[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const rootDl = doc.querySelector('dl')
  const tree = rootDl ? parseDl(rootDl) : []
  if (!hasLink(tree)) {
    return parseBookmarksHtml(html).map<BmNode>((b) => ({ type: 'link', title: b.title, url: b.url }))
  }
  return tree
}

function parseDl(dl: Element): BmNode[] {
  const out: BmNode[] = []
  for (const dt of Array.from(dl.children)) {
    if (dt.tagName !== 'DT') continue
    const h3 = Array.from(dt.children).find((c) => c.tagName === 'H3')
    const a = Array.from(dt.children).find((c) => c.tagName === 'A')
    if (h3) {
      // The folder's children live either inside the <DT> or as its next <DL> sibling.
      let childDl = Array.from(dt.children).find((c) => c.tagName === 'DL')
      if (!childDl) {
        let sib = dt.nextElementSibling
        while (sib && sib.tagName !== 'DL' && sib.tagName !== 'DT') sib = sib.nextElementSibling
        if (sib && sib.tagName === 'DL') childDl = sib
      }
      out.push({
        type: 'folder',
        name: h3.textContent?.trim() || 'Folder',
        children: childDl ? parseDl(childDl) : [],
      })
    } else if (a) {
      const url = a.getAttribute('href')?.trim() ?? ''
      if (/^https?:\/\//i.test(url)) out.push({ type: 'link', title: a.textContent?.trim() || url, url })
    }
  }
  return out
}

function hasLink(nodes: BmNode[]): boolean {
  return nodes.some((n) => (n.type === 'link' ? true : hasLink(n.children)))
}
