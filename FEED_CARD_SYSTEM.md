# Feed Card System — composant de card partagé (explorer + extension)

> Doc d'archi pour comprendre le système de feed cards `lg / md / sm / xs` avec
> images OpenGraph, désormais **partagé** entre `apps/explorer` et
> `apps/extension` via `@0xsofia/design-system`.

## Le problème qu'on a résolu

Avant, la feed card riche (avatar + image OG + titre + pills + votes, avec 4
tailles `lg/md/sm/xs`) vivait **uniquement dans `apps/explorer`**
(`FeedCardView.tsx` + `feed-card.css`, ~1000 lignes). L'extension avait
**recodé à la main** sa propre card (`.circle-card` dans `CircleFeedTab.tsx`),
sans variantes de taille, sans hero image, et **sans partager une ligne** avec
l'explorer. Deux implémentations à maintenir → divergence garantie.

## La solution

On a **remonté la card dans le design-system** (`@0xsofia/design-system`) en la
rendant agnostique de l'app, et les deux apps la consomment maintenant. La
logique de layout + le système de tailles vivent à **un seul endroit**.

```
packages/design-system/src/
├── components/FeedCardView.tsx     ← LE composant (layout + tailles + votes)
├── styles/feed-card.css            ← LA feuille de style (.fc-card--s-*)
└── lib/
    ├── urlPreview.ts               ← type UrlPreview (contrat partagé)
    ├── spotify.ts / vimeo.ts / soundcloud.ts   ← providers oEmbed
    ├── asyncUrlPreview.ts          ← cascade providers + OG proxy
    └── useUrlPreviewAsync.ts       ← hook React Query (cache 24h/7j)
```

## 1. Le système de tailles

`FeedCardView` prend une prop `size?: 'lg' | 'md' | 'sm' | 'xs'` (défaut `lg`),
appliquée en classe BEM `fc-card fc-card--s-${size}` :

| Size | Largeur cible | Rendu                                   |
| ---- | ------------- | --------------------------------------- |
| `lg` | 432px         | hero pleine largeur (défaut explorer)   |
| `md` | 360px         | hero 360/170                            |
| `sm` | 300px         | hero 300/132                            |
| `xs` | list-row      | pas de hero, ligne compacte horizontale |

Les overrides par taille sont dans `feed-card.css`, section
`/* ── Size variant overrides ── */`.

## 2. Le slot media injectable (le cœur du design)

Le composant DS **ne sait pas** d'où vient l'image (OG ? favicon ? thumbnail ?).
Il **possède** le wrapper `.fc-media` (+ aspect-ratios par taille) et le badge
domaine ; il **délègue** au caller le rendu de l'élément `<img>` via une
render-prop `renderMedia` :

```ts
interface FeedMediaContext {
  url?: string
  domain?: string
  title?: string
  className: string         // 'fc-media-img' (hero) | 'fc-xs-thumb-img' (xs)
  variant: 'card' | 'thumb' // hero (lg/md/sm) | thumb (xs)
  size: FeedCardSize
}

renderMedia?: (ctx: FeedMediaContext) => ReactNode
```

- **Explorer** injecte son `<UrlPreview>` (OG image avec fetch).
- **Extension** injecte un `<UrlPreviewImage>` (OG image + fallback favicon).

Idem pour les pills de topic : `renderTopic?: (topic) => ReactNode` — l'explorer
passe son `<TopicPill>`, l'extension son `.sf-topic-pill`. Résultat : aucune
dépendance app-spécifique (UrlPreview, TopicPill) ne remonte dans le DS.

Autres props notables :

- `showDomainBadge?: boolean` (défaut `true`) — le badge favicon+domaine sur le hero.
- `hideVoteCounts?: boolean` (défaut `false`) — rend les pouces **sans chiffre**,
  pour un UX de vote **toggle** (le cart de l'extension n'a pas de tally par card).

## 3. Le pipeline OG partagé

Tout `<img>` OG vient du même pipeline, maintenant dans le DS :

```
useUrlPreviewAsync(url, ogProxyUrl)   ← hook React Query (cache + dedupe)
        └─ fetchAsyncUrlPreview(url, ogProxyUrl)
               ├─ Spotify oEmbed        (cover art)
               ├─ Vimeo oEmbed          (thumbnail)
               ├─ SoundCloud oEmbed     (artwork)
               └─ OG proxy universel    GET {ogProxyUrl}/og?url=...  → { image, title }
```

Le service OG (`services/og-proxy/`) est **déjà déployé** sur
`https://og.sofia.intuition.box`.

**Point clé — l'env est paramétré, pas lu en dur.** Le module partagé ne lit
**aucune** variable d'environnement (sinon il casserait entre Vite et Plasmo).
Chaque app lit **sa** variable et passe l'URL au hook :

| App                | Variable d'env               | Lecture                                  |
| ------------------ | ---------------------------- | ---------------------------------------- |
| explorer (Vite)    | `VITE_OG_PROXY_URL`          | `import.meta.env.VITE_OG_PROXY_URL`      |
| extension (Plasmo) | `PLASMO_PUBLIC_OG_PROXY_URL` | `process.env.PLASMO_PUBLIC_OG_PROXY_URL` |

Si la variable est absente → pas d'OG, fallback favicon (extension) ou favicon
gradient (explorer).

## 4. Comment chaque app consomme le composant

### Explorer (`apps/explorer/src/components/feed/FeedCardView.tsx`)

Un **adaptateur mince** wrappe le composant DS et injecte ses slots. Les ~7
call-sites existants importent toujours `@/components/feed/FeedCardView`
inchangés :

```tsx
import { FeedCardView as DSFeedCardView } from '@0xsofia/design-system'
import { UrlPreview } from '@/components/UrlPreview'
import { TopicPill } from '@/components/profile/FeedPills'

export default function FeedCardView(props) {
  return (
    <DSFeedCardView
      {...props}
      renderMedia={(ctx) => <UrlPreview variant="card" {...ctx} />}
      renderTopic={(t) => <TopicPill topicId={t.glyphTopicId ?? t.id} {...t} />}
    />
  )
}
```

Le hook explorer (`hooks/useUrlPreviewAsync.ts`) est lui aussi un wrapper mince
qui injecte `VITE_OG_PROXY_URL`. Le CSS `feed-card.css` de l'explorer n'est plus
qu'un `@import "@0xsofia/design-system/styles/feed-card.css";`.

### Extension (`apps/extension/components/pages/circles-tabs/CircleFeedTab.tsx`)

La circle feed rend maintenant `<FeedCardView>` directement :

```tsx
<FeedCardView
  size="md"
  hideVoteCounts // votes via cart = toggle, pas de tally
  handle={group.memberLabel}
  title={group.pageLabel}
  url={group.pageUrl}
  domain={group.domain}
  verbs={verbs} // intentions → fc-verb pills
  topics={topics} // contextSlugs → renderTopic
  userUp={hasSupported || inCartSupport}
  userDown={hasOpposed || inCartOppose}
  onVote={(side) =>
    addVotesToCart(group, side === 'support' ? 'Support' : 'Oppose')
  }
  renderMedia={(ctx) => <UrlPreviewImage {...ctx} />} // OG + fallback favicon
  renderTopic={(t) => <span className="sf-topic-pill">…</span>}
/>
```

`UrlPreviewImage` (`apps/extension/components/ui/UrlPreviewImage.tsx`) appelle le
hook partagé avec `PLASMO_PUBLIC_OG_PROXY_URL` et retombe sur le favicon si pas
d'OG. Le CSS `feed-card.css` du DS est `@import` dans `Global.css`.

## 5. Recettes

**Ajouter une nouvelle taille** (ex. `xl`) :

1. `FeedCardSize` dans `packages/design-system/src/components/FeedCardView.tsx`.
2. Bloc `.fc-card--s-xl { … }` dans `packages/design-system/src/styles/feed-card.css`.

**Ajouter un nouveau consommateur** (autre surface) :

1. `import { FeedCardView } from '@0xsofia/design-system'`.
2. Fournir `renderMedia` (et `renderTopic` si topics) avec les composants de l'app.
3. S'assurer que le CSS est chargé (`@import` du DS, déjà fait dans explorer + extension).

**Ajouter un provider OG** (ex. Twitch) :

1. `packages/design-system/src/lib/twitch.ts` (sur le modèle de `spotify.ts`).
2. Le brancher dans `asyncUrlPreview.ts` (cascade `fetchAsyncUrlPreview`).

## Notes de build (pièges connus)

- Le DS est consommé **depuis les sources** (`main: ./src/index.ts`, pas de build
  step). Ses peerDeps (`react`, `lucide-react`, `@tanstack/react-query`) sont
  fournies par les apps.
- Le repo est en **LF**. Sous Windows, builder/git **uniquement dans WSL**
  (le Git Bash MINGW a `autocrlf=true` et réécrit tout en CRLF).
- L'extension se build avec `cd apps/extension && bun run build` (Plasmo).
