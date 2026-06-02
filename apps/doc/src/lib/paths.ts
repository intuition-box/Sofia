/**
 * Route helpers. Most docs render through the canonical ReadingPage
 * at `/docs/<id>`; a few get the design's special editorial
 * treatment on their own top-level route. Inverse of docPath:
 * `activeIdFromPath` resolves a current pathname back to a tree id
 * so the sidebar / drawer can highlight the active entry.
 */
export function docPath(id: string): string {
  if (id === 'manifesto') return '/manifesto'
  if (id === 'architecture/overview') return '/architecture'
  return `/docs/${id}`
}

export function activeIdFromPath(pathname: string): string | undefined {
  if (pathname.startsWith('/docs/')) {
    return pathname.slice('/docs/'.length)
  }
  if (pathname === '/manifesto') return 'manifesto'
  if (pathname === '/architecture') return 'architecture/overview'
  return undefined
}
