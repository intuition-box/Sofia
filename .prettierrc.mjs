/**
 * Root Prettier config — applies to every workspace by default.
 *
 * Style follows apps/explorer (single quotes, no semis), which is the
 * majority convention across the monorepo. Workspaces with diverging
 * needs (currently apps/extension, which uses double quotes for legacy
 * reasons) keep their own .prettierrc — Prettier picks the closest config.
 */
export default {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
}
