import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { Admonition } from './prose/Admonition'

/**
 * MDX component scope.
 *
 *   - `Admonition` is what `remarkAdmonitions` rewrites
 *     `:::note/:::tip/:::info/:::caution/:::danger` containers to.
 *   - `a` is overridden so internal markdown links (rewritten by
 *     `remarkDocLinks` to `/docs/...`, plus the special routes
 *     `/manifesto` and `/architecture`) navigate via React Router
 *     instead of triggering a full reload. External links fall
 *     through to a regular anchor with safe rel attrs.
 *
 * DocCard / DocCardGrid / StatBox are `import`ed directly by MDX
 * via the `@site/src` alias, so they don't need to be in this map.
 */
function isInternal(href: string | undefined): href is string {
  if (!href) return false
  return (
    href.startsWith('/docs/') ||
    href === '/manifesto' ||
    href === '/architecture' ||
    href === '/'
  )
}

function SpaLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (isInternal(href)) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    )
  }
  const external = href && /^([a-z]+:)?\/\//i.test(href)
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...rest}>
      {children}
    </a>
  )
}

const components = { Admonition, a: SpaLink }

export function MdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}
