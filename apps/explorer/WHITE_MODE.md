# White mode — estimation & inventaire

> Doc d'estimation pour réintroduire un thème clair ("white mode") dans
> l'app **explorer**. Énumère tout ce qui doit être modifié, avec une
> estimation d'effort. Généré à partir d'un audit du code au 2026-06-30.

---

## TL;DR

|                                                  |                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Faisabilité**                                  | Bonne — l'infra de tokens light **existe déjà**                                                 |
| **Effort polish complet**                        | **~10–16 j·dev** (≈ 2–3 semaines)                                                               |
| **Effort "rough" (light moche mais utilisable)** | ~3–5 j·dev                                                                                      |
| **Risque principal**                             | Les **couleurs en dur** (~490 littéraux CSS + 109 inline TSX) qui ne passent pas par les tokens |
| **Bloquant**                                     | Aucun — pas de refonte architecturale nécessaire                                                |

Le layer de tokens est déjà bi-thème. **80 % du boulot, c'est de l'audit de
couleurs en dur**, pas de l'architecture.

---

## 1. État actuel du theming

### Ce qui marche déjà ✅

- **`packages/design-system/src/theme.css`** définit **les deux palettes** :
  - `:root, [data-theme='light']` → tokens clairs (`--ds-bg: #ffffff`, `--ds-ink: #02000e`, …)
  - `[data-theme='dark'], .dark` → tokens sombres
  - → **Les ~30 tokens `--ds-*` flippent déjà correctement** selon `.dark` sur `<html>`.
- **`apps/explorer/src/styles/globals.css`** : les tokens shadcn (`--background`, `--foreground`, `--card`, …) ont **aussi** `:root` (clair) + `.dark` (sombre). Layer shadcn bi-thème OK.
- Les couleurs d'intention (`--intent-work`, `--trusted`, …) sont **theme-independent** par design (mêmes valeurs dans les 2 modes) — ne pas y toucher.

### Ce qui bloque le light mode ❌

- **`apps/explorer/src/hooks/useTheme.ts`** force `.dark` en dur :
  ```ts
  // "Dark is now the only theme. The light/white mode (and its toggle) was removed"
  document.documentElement.classList.add('dark') // jamais retiré
  ```
  Le toggle a été **volontairement supprimé**. C'est le point de départ.
- Beaucoup de composants n'utilisent **pas** les tokens et codent les couleurs en dur (souvent des valeurs sombres ou du `#fff` qui supposent un fond noir).

---

## 2. Inventaire chiffré (app explorer)

| Catégorie                              |                       Volume | Note                                           |
| -------------------------------------- | ---------------------------: | ---------------------------------------------- |
| Fichiers CSS                           |                       **56** |                                                |
| Couleurs hex en dur (CSS)              |                     **~380** | une partie = palette intent fixe (à garder)    |
| `rgba()/rgb()` en dur (CSS)            |                     **~113** | ombres, glows, overlays                        |
| `#fff` / `white` en dur (CSS)          |                      **~49** | ⚠️ supposent un fond sombre → cassent en clair |
| Overrides `.dark` existants (CSS)      |   **40** sur **11** fichiers | composants partiellement theme-aware           |
| Hex inline dans TSX                    | **~109** sur **36** fichiers | `style={{ color: '#…' }}`                      |
| Hex en dur dans `design-system/styles` |                      **~29** | à auditer côté package partagé                 |

> ⚠️ Le chiffre "~380 hex" est **brut**. Le sous-ensemble _actionnable_
> (surfaces/texte/bordures qui supposent le dark) est plus petit — il faut
> un **tri manuel** pour distinguer les couleurs de marque/intent (fixes)
> des couleurs de surface (à tokeniser).

### Top fichiers CSS à traiter (par nb de couleurs en dur)

| Fichier                                      | Couleurs |
| -------------------------------------------- | -------: |
| `src/index.css`                              |       75 |
| `src/components/styles/landing.css`          |       50 |
| `src/components/styles/scores-page.css`      |       40 |
| `src/components/styles/circles.css`          |       36 |
| `src/components/styles/cart-amplify.css`     |       36 |
| `src/components/styles/vote-page.css`        |       25 |
| `src/components/styles/profile-sections.css` |       19 |
| `src/components/styles/streaks-page.css`     |       17 |
| `src/components/styles/profile-charts.css`   |       15 |
| `src/styles/globals.css`                     |       14 |
| `src/components/styles/pages.css`            |       12 |
| `src/components/styles/circles-pro.css`      |       12 |

> `landing.css` (50) = page marketing avec sa propre palette peach/ink —
> probablement **hors scope** du white mode applicatif (à confirmer).

---

## 3. Travail à faire — par catégorie

### A. Infrastructure de thème (réactivation du toggle)

- [ ] Réécrire **`hooks/useTheme.ts`** : vraie gestion `light | dark`, persistée (localStorage / `chrome.storage`), avec `setTheme`/`toggleTheme` fonctionnels (l'API existe déjà mais est figée).
- [ ] Appliquer la classe `dark` **ou** `light` (ou attribut `data-theme`) sur `<html>` selon la préférence.
- [ ] **Anti-FOUC** : poser la classe avant le premier paint (script inline dans `index.html` qui lit la préférence avant React).
- [ ] Choix valeur par défaut (system / dark / light) + respect `prefers-color-scheme` optionnel.
- [ ] **UI du toggle** : bouton dans la NavSidebar (cluster profil) ou dans les settings.
- [ ] `components/ui/sonner.tsx` consomme `useTheme` de **`next-themes`** (pas notre hook) → soit installer un `ThemeProvider` next-themes, soit le brancher sur notre hook. **À unifier.**

**Effort : ~0,5–1 j**

### B. Tokens design-system

- [ ] Vérifier/affiner les valeurs **light** de `theme.css` (contraste, accent peach `--ds-accent-ink` qui diffère entre modes).
- [ ] Auditer les **~29 hex en dur** dans `packages/design-system/src/styles/*` (package partagé → impact extension potentiel).
- [ ] Vérifier les overrides `.dark` dans le DS (`nav-sidebar.css`, `feed-card.css`).

**Effort : ~0,5 j**

### C. Couleurs en dur dans le CSS explorer (le gros morceau)

- [ ] Trier les ~380 hex + ~113 rgba : **marque/intent (garder)** vs **surface/texte/bordure (tokeniser)**.
- [ ] Remplacer les surfaces/texte par les tokens `--ds-*` / shadcn correspondants.
- [ ] Traiter en priorité les **~49 `#fff`/`white`** (texte blanc sur fond supposé noir → illisible en clair).
- [ ] Passe fichier par fichier en commençant par le top offenders.

**Effort : ~3–5 j** (le poste le plus lourd)

### D. Overrides `.dark` existants (40 / 11 fichiers)

- [ ] Pour chaque règle `.dark`, vérifier qu'il existe une **base claire** correcte (sinon le composant n'a jamais de variante light).
- [ ] Fichiers concernés : `circles.css`, `cart-amplify.css`, `vote-page.css`, `compose.css`, `circles-free-panel.css`, `platform-grid.css`, `scores-page.css`, `streaks-page.css`, `platform-market.css`, `perspective.css`, `nav-sidebar-trust-circle.css`.

**Effort : ~0,5–1 j**

### E. Couleurs inline dans les composants TSX (109 / 36 fichiers)

- [ ] Remplacer `style={{ color/background: '#…' }}` par des tokens (CSS var via `var(--ds-…)`) ou des classes.
- [ ] Cas durs : couleurs **calculées en JS** (voir F).

**Effort : ~1–2 j**

### F. Couleurs calculées en JS (graphiques / data-viz)

- [ ] `utils/avatarColor.ts` (avatars déterministes) — OK en l'état mais vérifier le contraste sur fond clair.
- [ ] **Recharts** (`profile-charts`, `scores`) : couleurs d'axes/grilles/tooltips souvent en dur → passer aux tokens.
- [ ] **Radar** (`RadarChart.tsx`, `radar/RadarPolygon.tsx`) : stroke/fill/grid en dur.
- [ ] **Treemap / constellation / contribution-calendar** : palettes à vérifier en clair.
- [ ] DiceBear (`glass` style) : fond généré — vérifier rendu sur clair.

**Effort : ~1 j**

### G. Effets visuels pensés pour le dark

- [ ] **Glassmorphism** : `backdrop-filter`, opacités, `mix-blend-mode` calibrés sur fond sombre → à réajuster en clair.
- [ ] **Glows / halos** : `radial-gradient` + `--ds-accent` à faible opacité (countdown, hero, cards) — peu visibles/sales sur blanc.
- [ ] **Ombres** : `--ds-shadow-card` flippe déjà, mais les ombres en dur (`rgba(0,0,0,…)`) à vérifier.

**Effort : ~1–2 j**

### H. Assets supposant un fond sombre

- [ ] `public/spline-background.webm` (fond animé) — pensé sombre, à décliner clair ou masquer en light.
- [ ] Logos / icônes monochromes blancs → variante sombre.
- [ ] Images OG (générées via `og.sofia.intuition.box`) — hors app mais à noter si cohérence voulue.

**Effort : ~0,5–1 j**

### I. QA / recette

- [ ] Parcourir **chaque page** dans les 2 thèmes : explore, circles (+ détail), compose, profile, public profile, leaderboard, streaks, scores, notifications, platforms, markets.
- [ ] Vérifier contrastes (a11y AA), états hover/active/disabled, modals, drawers, toasts, skeletons.
- [ ] Tester le switch à chaud + persistance + anti-FOUC.

**Effort : ~2–3 j**

---

## 4. Récap effort

| Poste                     | Effort           |
| ------------------------- | ---------------- |
| A. Infra toggle           | 0,5–1 j          |
| B. Tokens DS              | 0,5 j            |
| C. CSS en dur (explorer)  | **3–5 j**        |
| D. Overrides `.dark`      | 0,5–1 j          |
| E. Inline TSX             | 1–2 j            |
| F. Couleurs JS / dataviz  | 1 j              |
| G. Glass / glows / ombres | 1–2 j            |
| H. Assets                 | 0,5–1 j          |
| I. QA bi-thème            | 2–3 j            |
| **Total**                 | **~10–16 j·dev** |

---

## 5. Approche recommandée (phasée)

1. **Phase 0 — Infra (1 j)** : réactiver `useTheme` + toggle + anti-FOUC + unifier `next-themes`. À ce stade, le light mode "marche" mais est visuellement cassé là où les couleurs sont en dur.
2. **Phase 1 — Tokeniser le critique (3–4 j)** : top offenders + les `#fff`, page par page (explore → circles → profile → leaderboard…). Light mode lisible.
3. **Phase 2 — Dataviz + effets (2–3 j)** : charts, radar, glass, glows.
4. **Phase 3 — Polish + QA (2–3 j)** : assets, contrastes, recette complète.

> Astuce : créer un **script d'audit** (`grep` des hex hors tokens) pour
> traquer la dette restante et éviter les régressions futures (lint CSS
> interdisant les hex de surface en dur).

---

## 6. Risques & pièges

- **Tri manuel inévitable** : un hex `#22c55e` (intent) ne se traite pas comme `#13121f` (surface dark). Pas de remplacement automatique aveugle.
- **Package partagé** : toucher `design-system/styles` impacte aussi l'**extension** — vérifier la non-régression côté extension.
- **`next-themes` vs `useTheme` maison** : double source de vérité actuelle (sonner) → unifier sous peine de toasts au mauvais thème.
- **Contraste de l'accent peach** : `--ds-accent-ink` change entre modes (`#7a3a1e` clair vs `#ffc6b0` dark) — vérifier toutes les puces/CTA accent.
- **Glows & glass** : le plus chronophage en "feeling" — beaucoup d'itérations visuelles, peu automatisable.
