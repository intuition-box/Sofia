import type { ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Admonition } from './prose/Admonition'

/**
 * MDX component scope. The `remarkAdmonitions` plugin rewrites
 * Docusaurus `:::note` containers into `<Admonition>` elements;
 * making it available here (providerImportSource = '@mdx-js/react')
 * is what lets the compiled docs resolve that name. DocCard /
 * DocCardGrid / StatBox are `import`ed directly by the MDX via the
 * `@site/src` alias, so they don't need to be in this map.
 */
const components = { Admonition }

export function MdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}
