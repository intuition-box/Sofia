/**
 * MDX module declarations — the Vite MDX plugin compiles each `.md`
 * and `.mdx` file into a React component. Without these decls TypeScript
 * has no way to know what the import returns. The `frontmatter` named
 * export is added by `remark-mdx-frontmatter`.
 */
declare module '*.md' {
  import type { ComponentType } from 'react'
  import type { PostFrontmatter } from './lib/types'
  export const frontmatter: PostFrontmatter | undefined
  const Component: ComponentType
  export default Component
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { PostFrontmatter } from './lib/types'
  export const frontmatter: PostFrontmatter | undefined
  const Component: ComponentType
  export default Component
}
