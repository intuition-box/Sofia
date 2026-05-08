import React, { type ReactNode } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import BlogSidebar from '@theme/BlogSidebar'

import type { Props } from '@theme/BlogLayout'

/**
 * Mirrors `DocRoot/Layout`: a flex shell with a sticky sidebar at
 * viewport-left and a main column that spans the remaining width.
 * Inside `<main>` we re-use Infima's `.container` + `.row` so that the
 * article + TOC layout matches the docs page byte-for-byte.
 */
export default function BlogLayout(props: Props): ReactNode {
  const { sidebar, toc, children, ...layoutProps } = props
  const hasSidebar = sidebar && sidebar.items.length > 0

  return (
    <Layout {...layoutProps}>
      <div className="blog-shell">
        {hasSidebar && <BlogSidebar sidebar={sidebar} />}
        <main className="blog-shell-main">
          <div className="container padding-top--md padding-bottom--lg">
            <div className="row">
              <div className={clsx('col', toc ? 'col--9' : 'col--12')}>
                {children}
              </div>
              {toc && <div className="col col--3">{toc}</div>}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  )
}
