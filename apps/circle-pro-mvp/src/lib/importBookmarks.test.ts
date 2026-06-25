import { describe, expect, test } from 'vitest'
import { parseBookmarksHtml, parseBookmarksTree } from './importBookmarks'

// A trimmed Netscape "bookmarks.html" (Chrome/Brave/Firefox export shape).
const HTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>Dev</H3>
  <DL><p>
    <DT><A HREF="https://github.com/x">GitHub X</A>
    <DT><A HREF="https://news.ycombinator.com">HN</A>
  </DL><p>
  <DT><A HREF="https://example.com">Root link</A>
  <DT><A HREF="javascript:void(0)">should be skipped</A>
</DL><p>`

describe('parseBookmarksHtml (flat)', () => {
  test('returns only http(s) links, in order', () => {
    const links = parseBookmarksHtml(HTML)
    expect(links.map((l) => l.url)).toEqual([
      'https://github.com/x',
      'https://news.ycombinator.com',
      'https://example.com',
    ])
  })

  test('keeps the link title', () => {
    const links = parseBookmarksHtml(HTML)
    expect(links.find((l) => l.url === 'https://github.com/x')?.title).toBe('GitHub X')
  })

  test('dedupes repeated URLs', () => {
    const dup = HTML + '<DT><A HREF="https://example.com">again</A>'
    const links = parseBookmarksHtml(dup)
    expect(links.filter((l) => l.url === 'https://example.com')).toHaveLength(1)
  })
})

describe('parseBookmarksTree', () => {
  // NB: folder-nesting fidelity is validated in the real browser. happy-dom
  // mis-nests the (intentionally malformed) Netscape format — so we only assert
  // links are captured and the flat fallback works here.
  test('captures every link from the tree', () => {
    const urls: string[] = []
    const walk = (nodes: ReturnType<typeof parseBookmarksTree>) => {
      for (const n of nodes) n.type === 'link' ? urls.push(n.url) : walk(n.children)
    }
    walk(parseBookmarksTree(HTML))
    expect(urls).toContain('https://github.com/x')
    expect(urls).toContain('https://example.com')
  })

  test('falls back to a flat list when there is no folder structure', () => {
    const flat = '<a href="https://a.com">A</a><a href="https://b.com">B</a>'
    const tree = parseBookmarksTree(flat)
    expect(tree.every((n) => n.type === 'link')).toBe(true)
    expect(tree).toHaveLength(2)
  })
})
