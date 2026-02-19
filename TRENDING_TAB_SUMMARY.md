# Trending Tab — Resume Implementation

## Statut : 90% fait, reste codegen + test

## Ce qui est fait

### 1. Query GraphQL (`extension/packages/graphql/src/queries/trending.graphql`)
- `GetTrendingByPredicate` — Recupère les triples triés par `position_count desc` pour un predicate donné
- `GetTripleCertifiers` — Recupère les positions (certifieurs) pour un triple, triées par shares desc
- Filtre : `triple_vault.position_count > 0`

### 2. Hook (`extension/hooks/useTrendingCertifications.ts`)
- Appelle `GetTrendingByPredicate` 7 fois en parallèle (une par catégorie : trusted, distrusted, work, learning, fun, inspiration, buying)
- `Promise.allSettled` pour resilience
- Filtre les ENS (`.eth`, `.box`) côté client
- `fetchCertifiers(termId)` — charge les certifieurs on-demand avec cache
- Pas de dependance wallet, données publiques
- `available: false` sur testnet (predicate IDs vides)

### 3. Composant (`extension/components/pages/resonance-tabs/TrendingTab.tsx`)
- Chips de filtre (All | Trusted | Distrusted | Work | Learning | Fun | Inspiration | Buying)
- Liste classée : rank, favicon, titre, domain, nb certifieurs, chevron
- **Click = expand** pour voir les certifieurs (Avatar + nom + shares)
- Lien "Open domain" dans le panel expandé
- Réutilise `INTENTION_CONFIG` pour couleurs, `Avatar` pour les certifieurs

### 4. CSS (`extension/components/styles/TrendingTab.css`)
- `.trending-item-wrapper` expandable avec border animée
- Gold/silver/bronze pour #1/#2/#3
- `.trending-detail` panel avec certifier list
- `.trending-certifier-row` avec avatar, nom, shares
- Chevron animé (rotation 90°)

### 5. ResonancePage (`extension/components/pages/ResonancePage.tsx`)
- Tab switching Circle / Trending
- Lazy loading des deux tabs
- Utilise les classes `.tabs` / `.tab` de CorePage.css

### 6. Exports (`extension/hooks/index.ts`)
- `useTrendingCertifications`, `TrendingItem`, `TrendingCategory`, `Certifier`

## Ce qu'il reste à faire

### OBLIGATOIRE avant build
```bash
cd extension/packages/graphql && pnpm codegen
```
Le codegen génère `GetTrendingByPredicateDocument` et `GetTripleCertifiersDocument` depuis `trending.graphql`.

### A verifier après build
- [ ] `pnpm build` compile sans erreur
- [ ] Onglet Trending visible dans ResonancePage
- [ ] Chips de filtre fonctionnent (All + chaque catégorie)
- [ ] Click sur un item expand et affiche les certifieurs
- [ ] Lien "Open domain" ouvre l'URL dans un nouvel onglet
- [ ] Les ENS (.eth, .box) ne s'affichent pas
- [ ] Message "only available on mainnet" s'affiche en testnet

## Architecture des fichiers

```
extension/
├── packages/graphql/src/queries/trending.graphql  ← 2 queries
├── hooks/
│   ├── useTrendingCertifications.ts               ← hook principal
│   └── index.ts                                    ← exports
├── components/
│   ├── pages/
│   │   ├── ResonancePage.tsx                       ← tab switching
│   │   └── resonance-tabs/
│   │       └── TrendingTab.tsx                     ← composant UI
│   └── styles/
│       └── TrendingTab.css                         ← styles
```
