# Landing scroll-driven — plan de faisabilité

> Réponse au brief du 2026-05-10. Direction validée : **on garde le
> HexDeck horizontal comme container narratif central et on ajoute
> des sous-scènes scroll-driven verticales avant et après**. Pas de
> refonte du squelette.

---

## 1. Audit de l'existant

### 1.1 Stack déjà en place

| Couche            | Choix actuel                                               | État                               |
| ----------------- | ---------------------------------------------------------- | ---------------------------------- |
| Framework         | Vite + React 18 (`apps/landing`)                           | ✅                                 |
| Router            | `react-router-dom` v7 (route `/` + auth)                   | ✅                                 |
| Smooth scroll     | `Lenis` (wrapper `lib/animation/SmoothScroll.tsx`)         | ✅                                 |
| Animations scroll | `GSAP` + `ScrollTrigger` (wrapper `lib/animation/gsap.ts`) | ✅                                 |
| Styling           | CSS modules + tokens globaux (`global.css`)                | ✅                                 |
| Web3              | Privy (`WalletProvider`) — hors scope landing              | ✅                                 |
| Lottie / SVG      | Pas encore intégré                                         | À ajouter quand on aura des assets |
| Three.js          | Pas utilisé                                                | À éviter sauf scène 3D justifiée   |

Conclusion : **la stack visée par le brief est déjà installée**. Pas de
migration framework, pas de réinstallation lib. On a tout pour faire du
scroll-driven propre.

### 1.2 Composants & infra qu'on a déjà

- **`HexDeck`** (`components/HexDeck.tsx`) — pin + scrub-timeline GSAP
  qui transforme le scroll vertical en translation horizontale d'un
  rail de 6 slides (`Hero`, `ValueProps`, `Carousel`, `Features`,
  `Values`, `Team`). Pilote en plus le morph d'un hexagone fixe
  (rotation + scale punch à chaque slide boundary, retint selon le
  `bg` du slide actif). Conceptuellement déjà scroll-driven, mais sur
  un seul axe et un seul mécanisme.
- **`HexSplit`** (`components/HexSplit.tsx`) — décoration de fond,
  deux hexagones qui s'écartent au scroll de leur section parente.
  Réutilisable mais pas central.
- **Infra `storyboard/`** (`lib/animation/storyboard/`) — embryon
  posé mais **pas branché** :
  - `Stage.ts` — classe abstraite : `id`, `label`, `weight`, `mount(el)`,
    `build(ctx)`, `destroy()`. Chaque stage déclare un poids et reçoit
    un slot `{ start, end, duration }` sur la master timeline.
  - `Storyboard.ts` — container qui agrège des stages, crée une master
    timeline GSAP pinnée via ScrollTrigger, alloue les slots
    proportionnellement aux poids, et expose `goTo(id)` + `manifest()`
    pour un navigateur de scène.
  - `useStoryboard.ts` — hook React (à inspecter pour le wiring).
  - `stages/HeroStage.ts` — premier stage écrit, jamais branché.
- **`DeckStoryboard.tsx`** — composant qui tente d'utiliser cette infra,
  jamais wiré dans `App.tsx`.

**→ L'infra `<Scene>` que le brief demande existe déjà à l'état de
brouillon non utilisé.** Le plan consiste à la finir, pas à la créer.

### 1.3 Sections actuelles, par catégorie

```
App.tsx (haut → bas)
├─ <Navbar/>                       fixed, top
├─ <HexDeck>                       pinned scroll-driven horizontal
│   ├─ <Hero/>                       slide 1
│   ├─ <ValueProps/>                 slide 2
│   ├─ <Carousel/>                   slide 3
│   ├─ <Features/>                   slide 4
│   ├─ <Values/>                     slide 5
│   └─ <Team/>                       slide 6
├─ <FAQ/>                          flow vertical statique
├─ <CTA/>                          flow vertical statique
└─ <Footer/>                       flow vertical statique
```

Les composants morts ou hors flow principal (`Steps`, `Comparison`,
`Chronicles`, `Instruments`, `Videos`) existent en source mais ne sont
plus utilisés depuis le refacto HexDeck. À nettoyer ou réintégrer.

### 1.4 Ce qui manque pour atteindre la cible Apple-like

1. **Aucune scène pinnée verticale** avant le deck. Le Hero est dans
   le deck, donc la première impression est immédiatement horizontale.
   Il manque un acte 1 (le constat) qui pose le drame avant la bascule
   horizontale.
2. **Aucune scène pinnée verticale après le deck**. Le passage
   deck → FAQ → CTA est purement vertical statique, sans climax narratif.
3. **L'infra `Storyboard` est posée mais pas câblée**. C'est elle qui
   doit devenir le `<Scene>` réutilisable.
4. **Pas de coordination inter-scènes**. Le hex du HexDeck n'a pas
   d'écho dans les scènes verticales pour l'instant (alors que c'est
   l'objet narratif central qui devrait relier toutes les scènes).
5. **Mobile non traité**. Les pins ScrollTrigger sont durs sur iOS,
   pas de fallback prévu.

---

## 2. Stack technique recommandée

| Besoin                             | Choix                                                                                                               | Justification                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Master timeline + scrub + pin      | **GSAP + ScrollTrigger**                                                                                            | Référence industrie. Déjà installé. Plugin `ScrollTrigger` gère pin, scrub, snap, callbacks, refresh sur resize. Pas d'alternative crédible à ce niveau.                 |
| Smooth scroll                      | **Lenis**                                                                                                           | Déjà installé. Élimine les irrégularités du wheel natif, indispensable pour que le scrub se sente fluide.                                                                |
| Animations légères / illustrations | **Lottie** (via `lottie-web` ou `@lottiefiles/react-lottie-player`) quand un asset existe ; sinon **SVG avec GSAP** | Lottie pour les anims complexes designées dans After Effects. SVG+GSAP pour les morphs simples gérés dans le code. Pas de Framer Motion (pas adapté à du scrub continu). |
| Scènes 3D                          | **Three.js** uniquement si une scène le justifie (ex. un atom qui pivote en 3D)                                     | Coût bundle + WebGL non systématique. À demander explicitement par scène.                                                                                                |
| Composant scène                    | **Refactor de l'infra `storyboard/` existante en `<Scene>` React**                                                  | Réutiliser ce qui est posé, finir le wiring, pas réinventer.                                                                                                             |

### Alternatives écartées

- **Framer Motion `useScroll`** : ok pour des animations simples liées
  au scroll, mais pas conçu pour des master timelines complexes avec
  plusieurs scrubs séquentiels et pinning. Tout ce qui dépasse 1-2
  effets simultanés devient pénible à orchestrer. Refusé.
- **Locomotive Scroll** : redondant avec Lenis.
- **`useTransform` + `motion.div`** : binaire/inline, pas de
  timeline réutilisable, pas de pinning natif. Refusé.

---

## 3. Découpage en scènes

### 3.1 Mapping trame ↔ implémentation

| #   | Trame narrative    | Où                                                         | Mécanisme scroll-driven                                                                                                                                                                   |
| --- | ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Le constat         | **Vertical pinned, avant le deck**                         | Une donnée utilisateur (avatar) est aspirée et fragmentée par des logos plateformes qui convergent. Le scroll comprime + dissout l'avatar dans les logos.                                 |
| 2   | L'idée             | **Vertical pinned, avant le deck**                         | Les fragments se recomposent en cristal/atom hexagonal qui prend la couleur Sofia. Le hex devient l'objet narratif central, transmis ensuite au HexDeck.                                  |
| 3   | Le mécanisme       | **HexDeck — Hero + ValueProps**                            | (Existant) Pose du produit. À aligner sur "Sofia Mark transforme l'activité en preuves".                                                                                                  |
| 4   | Le collectif       | **HexDeck — Carousel + Features**                          | (Existant) Le graphe partagé. Carousel = preuves qui circulent. Features = pourquoi ça compte.                                                                                            |
| 5   | Les personas       | **HexDeck — Values**                                       | (Existant) À recadrer en triptyque Travailleur / Rêveur / Chercheur de tendances.                                                                                                         |
| 6   | La vision          | **HexDeck — Team** _ou_ **Vertical pinned, après le deck** | Décision à prendre : soit on garde Team dernier slide et la vision est diffuse, soit on **sort la vision du deck** et on en fait une scène verticale dédiée après le deck (mon penchant). |
| 7   | L'appel à l'action | **Vertical pinned, après le deck**                         | Le hex du deck explose en N atoms qui se déposent dans l'icône d'une extension navigateur. Scroll = installation visuelle. CTA "Installer l'extension" se révèle au climax.               |

### 3.2 Acte 1 (vertical pinné, avant deck) — détaillé

**Scène 1 — "Tu produis, ils captent"**

- _Pinné_ : section 100vh contenant un avatar utilisateur central et une grille de logos plateformes (X, Insta, TikTok, LinkedIn, YouTube).
- _Transformation pilotée par scroll_ :
  - 0–30% : les logos sont dispersés, l'avatar est net.
  - 30–60% : les logos convergent vers l'avatar, des "lignes d'aspiration" SVG apparaissent.
  - 60–90% : l'avatar se fragmente en pixels qui se déplacent vers les logos.
  - 90–100% : l'avatar a disparu, les logos brillent, chiffre "0 €" affiché.
- _Texte_ : titre + sous-titre qui se révèlent au fil du scroll.

**Scène 2 — "Et si chaque interaction t'appartenait"**

- _Pinné_ : même 100vh. Les pixels dispersés à la fin de la scène 1
  reviennent au centre et se cristallisent.
- _Transformation_ :
  - 0–40% : les pixels convergent du bord vers le centre.
  - 40–70% : ils s'agencent en hexagone, prennent la couleur peach Sofia.
  - 70–100% : le hex se stabilise, un label "ton patrimoine numérique" apparaît, le hex commence à tourner doucement.
- _Pont vers HexDeck_ : à la sortie de la scène 2, le hex est aligné
  pixel-perfect avec la position de départ du hex du HexDeck.
  Visuellement on enchaîne sans rupture.

### 3.3 Acte 3 (vertical pinné, après deck) — détaillé

**Scène 6 (optionnelle) — "La vision"**

- _Pinné_ : 100vh. Trois piliers (Patrimoine, Souveraineté, Second cerveau).
- _Transformation_ :
  - 0–33% : le pilier "Patrimoine" se compose (icône + texte).
  - 33–66% : "Souveraineté".
  - 66–100% : "Second cerveau".
- Pas d'objet hex ici, c'est une scène respiration.

**Scène 7 — "Installe l'extension"**

- _Pinné_ : 100vh. Le hex sortant du deck est central, intact.
- _Transformation_ :
  - 0–25% : le hex se fissure en N atoms.
  - 25–60% : les atoms se déplacent vers une mockup de barre d'outils navigateur en bas/à droite.
  - 60–85% : ils se condensent dans l'icône extension Sofia.
  - 85–100% : le bouton "Installer l'extension" se révèle avec un glow.

Après la scène 7, on déroule normalement FAQ → Footer (flow vertical
statique, pas de pin).

### 3.4 Timeline globale (ASCII)

```
SCROLL  │ SCÈNES                                       │ HEX ÉTAT
────────┼──────────────────────────────────────────────┼──────────────────
   0%   │ ▼ Acte 1 — Scène 1 (pinned, vertical)        │ pas encore
        │   Avatar dispersé par les plateformes        │
  10%   │   logos convergent                            │
        │   avatar se fragmente                         │
        │ ▲ unpin                                       │
  20%   │ ▼ Acte 1 — Scène 2 (pinned, vertical)        │ pixels → hex
        │   pixels reconvergent                         │
  30%   │   hex se cristallise (couleur Sofia)          │ hex naît
        │ ▲ unpin                                       │
  35%   │ ▼ Acte 2 — HexDeck (pinned, horizontal)      │ hex pivote +
        │   Slide 1 Hero                                │ scale punch
  45%   │   Slide 2 ValueProps                          │ par boundary
  55%   │   Slide 3 Carousel                            │
  65%   │   Slide 4 Features                            │
  75%   │   Slide 5 Values (personas)                   │
  82%   │   Slide 6 Team                                │
        │   rest beat (existant)                        │
        │ ▲ unpin                                       │
  85%   │ ▼ Acte 3 — Scène 6 Vision (pinned)           │ hex statique
  90%   │   triptyque Patrimoine/Souveraineté/Cerveau   │
        │ ▲ unpin                                       │
  92%   │ ▼ Acte 3 — Scène 7 CTA (pinned)              │ hex explose
        │   atoms → icône extension                     │ en atoms
  98%   │   bouton "Installer"                          │
        │ ▲ unpin                                       │
 100%   │ FAQ + Footer (flow vertical statique)         │ —
```

Distance totale de scroll = 100vh (Acte 1.1) + 100vh (Acte 1.2) +
3.3vh (deck, valeur actuelle) + 100vh (Acte 3.1) + 100vh (Acte 3.2)

- flow FAQ/Footer ≈ ~7–8 viewports de pinned content + flow normal.
  À calibrer après prototype, c'est l'ordre de grandeur Apple-like.

---

## 4. Composant `<Scene>` réutilisable

### 4.1 Stratégie

On **finit l'infra `storyboard/` existante** plutôt que de la
réécrire. Elle a déjà la bonne forme : master timeline pinnée,
slots proportionnels, méthode `build(ctx)` par stage.

Mais elle a deux limites pour notre cas :

- elle suppose **toutes les scènes dans un seul container pinné**,
  alors qu'on veut **plusieurs containers pinnés indépendants**
  (avant le deck, après le deck) — la classe `Storyboard` actuelle
  marche bien si tous les stages d'un acte partagent un container.
- l'API est en classe TS, pas en composant React.

### 4.2 Forme cible

Deux briques :

**`<Scene>`** (composant React) — un container pinné autonome qui
encapsule un ScrollTrigger pin + un scrub + une callback `useScene(ctx)`.

```tsx
<Scene id="constat" vh={1.5}>
  {(ctx) => (
    // ctx exposes: progress (0..1, scrubbed),
    //              register(el, tween) helper,
    //              isReducedMotion flag
    <ConstaatSceneBody ctx={ctx} />
  )}
</Scene>
```

**`<Storyboard>`** (composant React) — pour les actes qui groupent
plusieurs stages **dans un seul pin partagé** (cas du HexDeck actuel
et des actes 1 & 3 si on les fusionne en un seul pin chacun). Wrappe
la classe `Storyboard.ts` existante. C'est ce que `DeckStoryboard.tsx`
amorce déjà.

### 4.3 Décision de granularité

Question ouverte (cf. §8) : est-ce que l'Acte 1 (scènes 1 + 2) est
**un seul pin avec 2 stages** (recommandé pour la continuité visuelle
entre les pixels et le hex naissant) ou **deux pins séquentiels** ?

Mon penchant : **un seul pin Storyboard pour l'Acte 1**, idem pour
l'Acte 3, **et le HexDeck reste tel quel** (déjà une Storyboard
ad-hoc). Donc 3 conteneurs pinnés au total : Acte 1, HexDeck, Acte 3.

### 4.4 Convention d'écriture pour une scène

Chaque scène fait son propre fichier dans
`src/scenes/<acte>/<scene>/`. Le fichier exporte :

- un composant React rendu dans le container pinné
- une fonction `buildTimeline(master, slot, refs)` qui prend la
  master timeline et le slot alloué, et y attache ses tweens

Le `<Storyboard>` parent gère le pin + la master timeline, les
scènes gèrent leur animation interne.

### 4.5 Référence existante à finir

- `lib/animation/storyboard/Storyboard.ts` ✅ moteur ok
- `lib/animation/storyboard/Stage.ts` ✅ contrat ok
- `lib/animation/storyboard/stages/HeroStage.ts` 🟡 à jeter ou
  refondre quand on saura ce que le Hero devient
- `lib/animation/storyboard/DeckStoryboard.tsx` 🟡 à transformer
  en `<Storyboard>` réutilisable React
- `lib/animation/storyboard/useStoryboard.ts` 🟡 à inspecter

---

## 5. Performance

### 5.1 Risques connus

| Risque                                                  | Mitigation                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout shift pendant le pin                             | Toujours `pinSpacing: true`. Pre-calc des heights. `invalidateOnRefresh: true` sur resize.                                                                           |
| Scrub saccadé                                           | Animer **uniquement** des propriétés composées au GPU : `transform`, `opacity`, `clip-path`, `filter`. Jamais `top/left/width/height` au scroll.                     |
| `will-change` qui plombe la RAM                         | Le poser **uniquement pendant la scène active**, le retirer à la fin (via callbacks ScrollTrigger `onEnter`/`onLeaveBack`).                                          |
| Refresh ScrollTrigger pendant le resize iOS (barre URL) | Déjà géré par Lenis + `invalidateOnRefresh`. Tester quand même.                                                                                                      |
| Lottie + scrub lourd                                    | Si on en a, charger les Lottie en `lazy`, et n'en avoir qu'une par scène pinnée à la fois.                                                                           |
| Préférence reduced-motion                               | Hook `prefers-reduced-motion` qui désactive scrub + pin et bascule sur un fallback statique (sections empilées, opacity-only fade-in). À implémenter dans `<Scene>`. |

### 5.2 Budget

- JS landing gzipped (objectif `web/performance.md` : <150kb) — risque
  de dépassement à surveiller. GSAP (~50kb) + Lenis (~5kb) + Lottie
  (~70kb si on l'inclut) = serré.
- Pas de Three.js par défaut. Si scène 3D demandée, mesurer avant.
- Hero / scènes pinnées : préload les SVG critiques.

### 5.3 À mesurer après prototype

- LCP du Hero (cible <2.5s).
- INP au scroll (cible <200ms par interaction).
- CLS pendant les transitions pin/unpin (cible <0.1, attention aux
  pin spacers).
- FPS moyen en scrolling continu sur la timeline complète (cible 60).

---

## 6. Mobile

### 6.1 Constat

Le ScrollTrigger pin tient sur Android (Chrome récent) mais **est
historiquement instable sur iOS Safari** à cause de la barre d'URL
qui se rétracte au scroll et reflow le viewport. Lenis aide mais
ne supprime pas le problème.

### 6.2 Stratégie recommandée

**Dégradation progressive sur < 720px** :

- **Pas de pin horizontal sur mobile pour HexDeck.** Sur un écran
  étroit, lire 6 slides à 100vw chacun en scrub horizontal est
  visuellement pauvre. Bascule en **stack vertical de 6 sections
  empilées** (déjà le mode natif si on retire le pin).
- **Acte 1 et Acte 3 sur mobile** : on garde le pin (1 seul axe,
  beaucoup plus stable) mais on simplifie les animations à des
  fade-in séquentiels pilotés par scroll. L'objet hex peut rester,
  mais réduit en taille.
- **Reduced-motion** : tout désactiver, sections empilées, opacity-only.

### 6.3 Détection

Un seul hook `useScrollDriven()` qui retourne :

```ts
{
  enabled: boolean,        // false sur mobile <720px OU reduced-motion
  pinHorizontal: boolean,  // false sur mobile, true desktop
  scrub: number | false,   // false en reduced-motion
}
```

Les composants `<Scene>` et `<Storyboard>` lisent ce hook pour se
configurer eux-mêmes.

---

## 7. Risques & points bloquants

1. **Continuité visuelle hex entre Acte 1 et HexDeck.** Pour que le
   hex né dans la scène 2 enchaîne sans saut sur le hex du HexDeck,
   il faut soit (a) que ce soit **le même élément DOM** (donc le hex
   sort du Storyboard de l'Acte 1 et est repris par le HexDeck — pas
   simple), soit (b) que le hex du HexDeck soit pixel-aligné avec le
   hex de fin d'acte 1 et qu'on accepte une micro-coupure. **Décision
   à prendre en design.**
2. **Distance totale de scroll.** ~7–8 viewports pinnés c'est long.
   On l'a déjà vu sur le HexDeck (réduction de `vhPerSlide` à 0.55).
   Risque : la landing devient longue à parcourir. À calibrer.
3. **Snapping ou pas.** Apple snap les scènes (chaque scène a un
   "rest point" magnétique). On peut le faire avec `snap` de
   ScrollTrigger, mais ça gâche le scroll libre. À trancher.
4. **Mobile vs desktop divergent.** On va probablement devoir
   maintenir deux expériences. Réaliste ?
5. **Asset production.** Aujourd'hui pas de Lottie / pas d'illustration
   animée. Sans design assets, on tombe vite dans le SVG hand-coded
   limité.
6. **SEO** (hors scope brief mais signalé) : avec Vite + SPA, les
   crawlers voient une page vide tant que le JS n'a pas tourné. À
   traiter en P2 (pré-rendu statique).

---

## 8. Questions ouvertes (à trancher en une session)

1. **Acte 1 : un seul pin avec 2 stages, ou 2 pins consécutifs ?**
   Penchant : un seul pin pour continuité hex.
2. **La vision (narrative #6) reste dans le HexDeck ou sort en scène
   verticale dédiée après le deck ?** Penchant : la sortir.
3. **Le hex de fin d'Acte 1 et le hex du HexDeck = même élément DOM
   ou deux éléments alignés ?** Penchant : deux éléments alignés au
   pixel, plus simple.
4. **Snap aux frontières de scène, ou scroll libre ?**
5. **Sur mobile, on dégrade le HexDeck en stack vertical (perte de
   l'effet horizontal) ou on supprime carrément 1-2 slides ?**
6. **On supprime les composants morts (`Steps`, `Comparison`,
   `Chronicles`, `Instruments`, `Videos`) ou on les réintègre ?**
7. **Lottie pour les animations d'illustration, ou tout en SVG +
   GSAP ? (impacte le pipeline design)**
8. **Pré-rendu SSR/SSG (Next.js, Astro) pour SEO en P2, ou on reste
   Vite SPA ?**

---

## Annexe — fichiers à toucher (premier passage)

```
apps/landing/
├─ src/App.tsx                              wrap deck + ajouter Acte 1 / Acte 3
├─ src/scenes/                              NEW
│  ├─ act1/
│  │  ├─ Act1Storyboard.tsx                 NEW (container pinné)
│  │  ├─ ConstatScene.tsx                   NEW
│  │  └─ IdeaScene.tsx                      NEW
│  └─ act3/
│     ├─ Act3Storyboard.tsx                 NEW
│     ├─ VisionScene.tsx                    NEW (si sortie du deck)
│     └─ CtaScene.tsx                       NEW
├─ src/lib/animation/storyboard/
│  ├─ Storyboard.ts                         existant — éventuel ajustement
│  ├─ Stage.ts                              existant ok
│  ├─ useStoryboard.ts                      à finir
│  ├─ DeckStoryboard.tsx                    à promouvoir en <Storyboard> React générique
│  └─ stages/                               à supprimer/refondre
├─ src/lib/animation/useScrollDriven.ts     NEW (hook capabilities)
└─ src/components/                          composants morts à arbitrer
```

---

_Fin du document. Quand tu as tranché les 8 questions du §8 on peut
attaquer une scène à la fois — je propose de commencer par l'Acte 1
puisque c'est l'amorce narrative et qu'elle pose le pattern qu'on
appliquera à l'Acte 3._
