import { useParams } from 'react-router-dom'
import { Tree } from '~/components/Tree'
import { Crumbs } from '~/components/Crumbs'
import { DocHead } from '~/components/DocHead'
import { Toc } from '~/components/Toc'
import { Pager } from '~/components/Pager'
import { MdxProvider } from '~/components/MdxProvider'
import { useToc } from '~/hooks/useToc'
import { DOC_BY_ID, neighbours } from '~/data/tree'
import { getDoc } from '~/lib/docs'
import { docPath } from '~/lib/paths'
import { NotFoundPage } from './NotFoundPage'

/**
 * Canonical reading layout — tree │ content │ TOC. Renders the real
 * migrated MDX for the route id (`/docs/<id>`), with the shell,
 * breadcrumbs, header, pager and live scroll-spy TOC all driven by
 * the real content tree. `docId` lets special routes
 * (e.g. /architecture) reuse this exact layout for their doc.
 */
export function ReadingPage({ docId }: { docId?: string }) {
  const params = useParams()
  const id = docId ?? params['*'] ?? 'intro'
  const doc = getDoc(id)
  const meta = DOC_BY_ID[id]
  const { ref, headings, activeId } = useToc(id)

  if (!doc) return <NotFoundPage />

  const { Component, frontmatter } = doc
  const { prev, next } = neighbours(id)
  const sectionTitle = meta?.sectionTitle ?? 'Docs'
  const label = frontmatter.title ?? meta?.label ?? id

  const tocItems = headings.map((h) => ({
    label: h.text,
    href: `#${h.id}`,
  }))
  const activeIdx = Math.max(
    headings.findIndex((h) => h.id === activeId),
    0,
  )

  return (
    <div className="shell">
      <Tree activeId={id} />

      <main className="content">
        <Crumbs
          items={[
            { label: 'Docs', to: '/docs/intro' },
            { label: sectionTitle },
            { label: meta?.label ?? label },
          ]}
        />

        <DocHead
          eyebrow={<b>{sectionTitle.toUpperCase()}</b>}
          eyebrowColor="accent"
          title={label}
        />

        <MdxProvider>
          <div className="prose" ref={ref}>
            <Component />
          </div>
        </MdxProvider>

        <Pager
          prev={prev ? { label: prev.label, to: docPath(prev.id) } : undefined}
          next={next ? { label: next.label, to: docPath(next.id) } : undefined}
        />
      </main>

      <Toc items={tocItems} activeIdx={activeIdx} />
    </div>
  )
}
