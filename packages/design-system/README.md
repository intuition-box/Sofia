# @0xsofia/design-system

Sofia design system — shared taxonomy, components, hooks, and styles consumed by `apps/explorer` and (soon) `apps/extension`.

## Status

Scaffold only. Submodules are added per migration wave. See [`INTEGRATION.md`](./INTEGRATION.md) for the full plan.

## Usage (once submodules land)

```ts
import { INTENTION_CONFIG, calculateLevel, GroupBentoCard } from '@0xsofia/design-system'
```

```css
/* apps/<app>/src/index.css */
@import "@0xsofia/design-system/theme.css";
@import "@0xsofia/design-system/styles/bento.css";
```

## Peer dependencies

- `react` ^18.2.0
- `react-dom` ^18.2.0
- `three` >=0.180.0 (optional, required only for `CompileActionButton`)

## Scripts

- `bun run --filter @0xsofia/design-system typecheck` — `tsc --noEmit` against the package source.
