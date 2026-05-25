/**
 * Route helpers. Most docs render through the canonical ReadingPage
 * at `/docs/<id>`; a few get the design's special editorial
 * treatment on their own top-level route.
 */
export function docPath(id: string): string {
  if (id === 'manifesto') return '/manifesto'
  if (id === 'architecture/overview') return '/architecture'
  return `/docs/${id}`
}
