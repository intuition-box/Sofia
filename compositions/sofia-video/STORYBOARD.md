# Sofia — Storyboard (brain dump avant scènes)

> Tout ce que je sais de Sofia, à jour. Source = repo `THP/Sofia` (état courant), skill `intuition`. Aucun plan de scène ici — c'est la matière première pour construire le storyboard ensuite.

---

## 1. Identité produit

**Sofia** = un protocole de **réputation comportementale** sur Web3.

Une phrase :
> Sofia transforme ta navigation web et tes connexions de plateformes en un **graphe de réputation vérifiable on-chain**, et croise tout le monde dans un **graphe collectif** qui mesure ce qui mérite confiance.

Trois promesses :
- **Mémoire vivante** — chaque page lue avec une intention, chaque plateforme connectée, devient une trace structurée.
- **Réputation portable** — la réputation n'appartient ni à un site ni à une plateforme : elle vit dans tes propres atoms/triples on-chain.
- **Intelligence collective** — l'agrégation des certifications individuelles produit une carte de confiance navigable (qui est crédible sur quoi, qui suit qui, quels topics montent).

Sofia n'embarque **aucun service d'IA**. La logique vit dans le code des apps + le moteur de confiance MCP (algorithmes de graphe, pas LLM).

---

## 2. Architecture (monorepo `bun workspaces`)

```
apps/
├── extension/   Chrome MV3 (Plasmo) — capture l'intention par tab, signe on-chain
├── explorer/    Vite + React 18 — dashboard de réputation + feed collectif
├── landing/     Vite + React 19 + GSAP — page marketing
├── doc/         Docusaurus
└── og/          Next.js 14 — générateur d'images OG pour le partage de profil
packages/
├── graphql/         @0xsofia/graphql — client + codegen partagé
└── design-system/   @0xsofia/design-system — kit UI (composants + tokens + theme.css)
services/
├── mastra/      Backend HTTP : OAuth providers (OAuth1/OAuth2 pour ~140 plateformes) + signal fetchers (GitHub, Spotify, Reddit, YouTube, Twitch, Strava, Discord, ORCID, ProductHunt, SoundCloud, Mixcloud, Coinbase…) + workflows (link-social, social-verifier, signal-fetcher). **Pas d'IA, pas de LLM** — uniquement de l'OAuth + des appels REST aux APIs publiques pour récupérer les métriques utilisées par le scoring.
└── mcp-server/  Serveur MCP qui expose le graphe Intuition aux LLM externes (pas utilisé par Sofia elle-même côté capture).
```

Stack :
| Surface | Framework | Libs clés |
|---|---|---|
| extension | Plasmo (MV3) | Privy, Viem, Wagmi, React Query, Tailwind |
| explorer | Vite + React 18 + TS 5.7 | Privy, Viem v2, React Query v5, Tailwind v4 (oklch), shadcn/ui |
| landing | Vite + React 19 | Privy, Viem, GSAP |
| og | Next.js 14 | @vercel/og, @vercel/kv |
| doc | Docusaurus 3 | GSAP |
| mastra | @mastra/core | Viem, Zod, libsql |
| mcp-server | MCP SDK | Express, codegen |

Exigences : Node ≥ 22.13, Bun ≥ 1.3, wallet (MetaMask/Rabby) ou embedded via Privy.

---

## 3. Le pipeline (extension → graphe)

```
Extension Chrome  ─►  Intuition Protocol (on-chain)  ─►  Explorer + MCP Trust Engine
   capture            atoms / triples / vaults              moteurs collectifs
        │
        └─►  Mastra backend (OAuth + signal fetchers)  pour les plateformes connectées
```

### Capture (extension)
- L'extension reconnaît la page courante et propose **une intention parmi 8** via un sélecteur "bubble".
- L'utilisateur peut **connecter ~140 plateformes** via le backend Mastra : OAuth2/OAuth1, SIWE (Sign-In With Ethereum), SIWF (Sign-In With Farcaster), ou username public (manuel ou auto-analyze pour les plateformes web3).

### Certification (Intuition, on-chain)
- L'extension écrit des **atoms** (URL, plateforme, account, concept) et des **triples** (intention) on-chain via le **Sofia Fee Proxy** (frais fixe + 5%).
- Token natif : **$TRUST** (mainnet, chain 1155) / **tTRUST** (testnet, chain 13579).
- MultiVault mainnet : `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e`.
- SofiaFeeProxy mainnet : `0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c`.
- GraphQL indexer : `https://mainnet.intuition.sh/v1/graphql` (sans auth).

### Lecture & agrégation
- **Explorer** — dashboard React qui lit le graphe + les RPC events, calcule réputation, feed, streaks, leaderboards, circles.
- **MCP Trust Engine** (`https://mcp-trust.intuition.box/mcp`) — service séparé qui calcule des scores de confiance globaux sur le graphe d'attestations (EigenTrust, AgentRank, transitive trust personnalisé).

---

## 4. Modèle Intuition (mécanique financière du graphe)

| Concept | Quoi |
|---|---|
| **Atom** | Entité on-chain (URL, account CAIP-10, plateforme, topic, concept). ID = `bytes32` déterministe. Tout sauf les addresses est pinné en IPFS. |
| **Triple** | Claim `(subject, predicate, object)`. Ex : `(Spotify, has tag, Music & Audio)` ou `(I, trusts, 0xAlice)`. Crée automatiquement une **counter-triple** vault pour le désaccord. |
| **Vault** | Backing financier de chaque atom/triple. Déposer $TRUST mint des shares sur une bonding curve. |
| **term_id** | Identifiant canonique (`bytes32`). Toujours utiliser `term_id`, jamais `id` interne. Côté GraphQL, toujours filtrer `vaults` sur `curve_id = "1"`. |
| **Sofia Fee Proxy** | Wrapper du MultiVault (fixed fee + 5%) — toutes les écritures Sofia passent par là. |

**Pattern « Atom I »** : pour les votes/endorsements/intentions, on **n'utilise pas un atom par utilisateur**. On utilise un **atom partagé `I`** comme subject (`I → trusts → 0xAlice`, `I → visits for learning → URL`), et chaque utilisateur est identifié par sa **position** (deposit) dans le vault du triple. Sa conviction = sa share.

Atom I (mainnet) : `0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b`.

---

## 5. Les 8 intentions canoniques (predicates)

Le coeur sémantique. Six verbes de **visite** + deux verbes de **confiance**.

| Intention | Predicate (label) | Couleur | Usage |
|---|---|---|---|
| **Trusted** | `trusts` | vert | Confiance envers une personne/account |
| **Distrusted** | `distrust` | rouge | Méfiance |
| **Work** | `visits for work` | bleu | Page utile pro |
| **Learning** | `visits for learning` | cyan | Page éducative |
| **Fun** | `visits for fun` | jaune | Divertissement |
| **Inspiration** | `visits for inspiration` | violet | Inspiration créative |
| **Buying** | `visits for buying` | rose | Intention d'achat |
| **Music** | `visits for music` | orange | Écoute musicale |

Extras non first-class : `Attending`, `Valued`, `is following`.

Chaque intention est un **predicate atom on-chain**. Tous les `predicate_id` sont stockés dans la config. Côté UX, l'intention pilote la couleur de l'event dans le feed, du tag dans le profil, de l'arête dans le graphe.

---

## 6. Le catalogue : 14 domaines × ~88 catégories × 300+ niches × ~140 plateformes

Trois axes structurants, **tous on-chain via des triples « has tag »** :

### Taxonomie (`config/taxonomy.ts`)
- 14 **domaines** : Tech & Dev · Design & Creative · Music & Audio · Gaming · Science · Sport & Health · Video & Cinema · Entrepreneurship · Performing Arts · Nature & Environment · Food & Lifestyle · Literature · Personal Dev · Web3 & Crypto.
- ~88 **catégories** sur l'ensemble des domaines.
- 300+ **niches**.

### Catalogue plateformes (`config/platformCatalog.ts`)
~140 plateformes, chacune avec : `id`, `name`, `url`, favicon, `authType` (`oauth2` / `oauth1` / `siwe` / `siwf` / `public` / `none`), catégories rattachées.

### Signal Matrix (`config/signalMatrix.ts`)
Formules de scoring **par plateforme**. Exemples :
- GitHub : `(streak_jours * 1.5) + (commits_moy_quotidien * 3) + (repos_actifs * 2) − burst_malus`
- Stack Overflow : `(reputation / 100) + (reponses_acceptees * 5) − ratio_ask_answer_faible`
- 5 dimensions pondérées : `creation` · `regularity` · `community` · `monetization` · `anciennete` + `burstPenalty`.

---

## 7. Extension — UI réelle (5 onglets de la bottom dock)

Le dock du bas (composant `Dock` magnifié) expose 5 destinations, plus un **CartFab** (panier de certifications) flottant et un **CartDrawer** qui s'ouvre depuis n'importe quelle page.

### 7.1. Mark (`/mark`)
La page de **certification de la page courante**.
- `PageBlockchainCard` : header de la page (favicon, titre, URL), score de discovery (pioneer / explorer / contributor), reward potentielle, analyse de crédibilité.
- `IntentionBubbleSelector` : 8 bulles colorées (une par intention). Click = ajout au cart.
- `InterestContextSelector` : permet d'attacher un ou plusieurs topics à la certification (triple imbriqué `in context of`).
- `PagePositionBoard` : qui a déjà certifié cette URL et dans quel sens.
- `ExtendedMetricsPanel` : market cap du triple, position count, ratio support/oppose.
- `ShareCertificationButton` : partage de la certification.
- `WeightModal` : à la confirmation, choix du montant de $TRUST à déposer.

### 7.2. My Profile (`/my-profile`)
4 tabs en haut de page :
- **Echoes** — les certifications de l'utilisateur, regroupées par groupe sémantique (via `useIntentionGroups` du DS, layout bento `GroupBentoCard`).
- **Bookmarks** — favoris locaux qu'on peut convertir en certifications.
- **History** — historique de navigation avec triplets associés (expandable).
- **Connect** (SocialsTab) — connexion des plateformes via Mastra (OAuth / SIWE / SIWF / public).

### 7.3. Circles (`/circles`)
Une page à **3 layers** avec navigation par boutons "Back" :
- **Home** (`CommunityHomeView`) — bannière "My Trust Circle" cliquable avec stack d'avatars (4 max + overflow `+N`), count des membres. Sous la bannière : `ExplorerPanel` qui aide à découvrir des nouveaux comptes à trust.
- **Feed** (`CircleFeedTab`) — fil temps réel des certifications des membres du Trust Circle, regroupé par catégorie (cards) avec drill-down (`CategoryDetailView`).
- **Members** (`TrustCirclePanel`) — liste des comptes trustés avec leur trust amount, options Stake (modifier le poids) / Redeem (retirer la position), bouton "+ add a member" via `FollowSearchBox`.

### 7.4. Score (`/score`)
Header `ProfileHeader` + 3 tabs :
- **Stats** (`ScoreTab`) — vue principale : signaux créés, trusted-by count, gold, social verified, identité (ENS / Discord), daily streak profit.
- **Quests** (`AchievementsTab`) — système de **quêtes/badges** avec niveau & XP. Quêtes claimables → halo sur l'icône Score dans le dock.
- **Pool** (`PoolTab`) — Season Pool de stake saisonnier, PnL %.

### 7.5. Settings (`/settings`)
Disconnect, language, clear data, debug, etc.

### Pages annexes (hors dock)
- **HomePage** — écran de login (50/50 vertical, top peach avec diagramme `TopicsIntentions`, bottom ink avec eyebrow `S.01 · CONNECT`, headline *"Your web, mapped."*, lede, bouton "Connect wallet", footer Privy/Terms/Privacy).
- **UserProfilePage** — fiche publique d'un autre utilisateur, avec son trust circle, ses certifications, ses scores.
- **Onboarding** — BookmarkSelectPage, ImportPage, TutorialPage.

---

## 8. Circles dans l'Explorer — état réel et concept

L'Explorer a sa propre vue Circles (`/circles` + `/circles/:id`) plus complète que celle de l'extension. C'est là qu'émerge la **structure sociale du graphe**.

### 8.1. État actuel
- Un seul "vrai" circle wiré : le **Trust Circle personnel** à `/circles/trust`.
- Le reste de la page sert d'**échafaudage** pour un futur système plus large : création de groupes, invite, leave, sponsor budget, top-topics agrégés — tout ça est rendu en UI avec des valeurs mock (TODOs explicites dans le code).

### 8.2. Trust Circle — métadonnées (mock pour l'instant)
- Nom : "Trust Circle".
- Description : *"People whose taste you value — their signals shape your feed."*
- Couleur : `--trusted` (pastel vert) par défaut, **modifiable via un color picker** (8 pastels d'intention au choix), choix persisté en `localStorage` (`sofia-trust-circle-color`).
- `sponsorClaimsLeft` : 3200 (placeholder budget de sponsor).

### 8.3. Comment se construit ton Trust Circle
- `circleService.fetchTrustedWallets(addresses)` — union des wallets que **n'importe lequel** de tes wallets liés a trusté (predicate `TRUSTS`), cache 60s.
- `circleService.fetchCircleFeed(addresses)` — feed filtré sur ce graphe, enrichi via `enrichWithTopicContexts` (résout les triples imbriqués `in context of` pour chaque event).
- `useCircleTopicCounts(wallets, slugs)` — agrège pour chaque topic combien de certifs ont été faites par les membres du circle.

### 8.4. Page detail `/circles/trust`
- `CircleDetailHero` — bannière colorée du circle, nom, description, age, member count, color picker, sponsorClaimsLeft.
- `CircleMembersCard` — avatars des membres + bouton "View all" → ouvre `AllMembersPanel`.
- `CircleTopTopicsCard` — top 4 topics du circle (par count), couleur du circle, items du feed associés.
- `CircleFeedSection` — feed live des certifications des membres (cards `CircleFeedCard`, filtres par verbe via `CircleVerbFilter`).
- `AllMembersPanel` — drawer latéral qui liste tous les membres (avec `MemberAvatar`).

### 8.5. Groups — la suite logique
- Service `groupsService` lit toutes les triples avec predicate `MEMBER_OF`.
- Pattern : **n'importe qui peut claim "X is member of Y"**, et d'autres wallets viennent **voucher** en déposant sur le triple.
- Un `GroupEntry` agrège par object atom (le groupe) :
  - `memberCount` (subjects distincts), `voucherCount` (wallets ayant déposé), `totalShares` (wei staké total), `createdAt` (premier claim).
- `DiscoverGroupsSection` sur `/circles` liste les groupes émergents (avec count "X groups on-chain").
- C'est l'embryon des **circles ouverts/communautaires** au-delà du Trust Circle personnel.

### 8.6. CreateCircleDrawer
- Drawer de création d'un nouveau circle (en cours de câblage on-chain).
- L'idée : créer un atom-groupe + permettre aux gens de claim "is member of" dessus.

### 8.7. Pourquoi c'est l'IC du produit
Le Trust Circle est le filtre social qui transforme une réputation individuelle en **vue collective curatée** :
- **Feed All** = trop bruyant, tout le réseau.
- **Feed Circle** = filtré par les gens à qui tu fais confiance — ton "internet de confiance".
- Et demain, les **groups** = circles communautaires partagés (un DAO, un collectif, un fandom…), où chacun peut entrer ou sortir, et où la coût d'entrée est l'attestation publique sur le graphe.

---

## 9. Intelligence collective — ce que l'Explorer rend visible

Une fois que des milliers d'individus déposent leurs intentions on-chain, l'Explorer agrège :

### 9.1. Activity Feed (page `/`)
- Flux temps réel des certifications on-chain (filtrable par intention).
- Bascule **All Activity** ↔ **My Circle**.
- Pour chaque event : qui (avatar + ENS), quelle intention (couleur), quel URL, depuis quand, combien de gens l'ont déjà certifié dans le même sens / dans le sens opposé.
- **Topic context** — un triple imbriqué `(triple_certif, in context of, Tech & Dev)` permet de rattacher l'event à un ou plusieurs topics.

### 9.2. Profil de réputation (`/profile`, `/profile/interest/:topicId`)
- Score par **domaine** (14 domaines).
- Composé de :
  - **Score plateformes connectées** — formule Signal Matrix × intentions on-chain.
  - **Trust boost** — 20% du composite trust MCP, ajouté aux points.
- Sans plateforme connectée → trust-only capped à 15. Avec plateformes → pas de cap.
- Drill-down par topic → catégories → niches → plateformes.
- **EthCC wallet linking** — relier un wallet embedded à son profil pour agréger les signaux cross-wallet.

### 9.3. Trust Engine (MCP) — moteur de confiance global
Service séparé (`mcp-trust.intuition.box`) qui calcule **trois scores complémentaires** sur tout le graphe :
- **EigenTrust** (50%) — score global de propagation de confiance type PageRank.
- **AgentRank** (30%) — variante d'EigenTrust qui pondère selon le rôle des noeuds du graphe.
- **Personalized Transitive Trust** (20%) — chemins de confiance vers une address depuis l'utilisateur courant.
- **Confidence** = robustesse du score (volume + diversité d'attestations).
- **Paths** = nombre de chemins de trust distincts qui mènent au wallet.

Onglet **Trust Ranking** du leaderboard = top 50 wallets par EigenTrust. Fallback gracieux si MCP injoignable.

### 9.4. Discovery Score — pioneer / explorer / contributor
Pour chaque URL certifiée par l'utilisateur, on compte combien d'autres l'ont aussi certifiée :
- **Pioneer** — 1 seul certifier (toi).
- **Explorer** — 2 à 10 certifiers.
- **Contributor** — 11+ certifiers.
- **Trusted** — nombre de trusts reçus sur les account-atoms de l'utilisateur.
- **Signals** — total des certifications de l'utilisateur.

C'est la métrique qui mesure si tu es un défricheur ou un suiveur.

### 9.5. Streaks (`/streaks`)
Jours consécutifs avec au moins un dépôt on-chain via `SofiaFeeProxy`. Leaderboard. Badges streak (committed / dedicated / relentless).

### 9.6. Season Pool
Saison en cours : **Beta** (Feb 21 – Apr 5, 2026). PnL % sur le pool de stake saisonnier — incite à participer dans une fenêtre temporelle.

### 9.7. Debate / Vote (`/vote`)
Cartes de claims curatés. Pour chaque claim : market cap, position count, action **Support** ($TRUST sur le triple) ou **Oppose** ($TRUST sur le counter-triple). Marché de prédiction social appliqué aux opinions.

### 9.8. Quest Badges
Système de badges. 7 catégories : `daily`, `milestone`, `discovery`, `gold`, `vote`, `social`, `streak`.

### 9.9. Partage de profil
Génération d'images OG via `sofia-og.vercel.app` + share Twitter/X.

---

## 10. Comment le « collectif » émerge — résumé en boucles

1. **Boucle individuelle** : tu navigues → tu certifies (intention) → tes signaux nourrissent ton score par domaine.
2. **Boucle de pairs (Trust Circle)** : tu trustes des wallets → leur feed devient ton Circle → tu vois ce qu'ils certifient → tu peux re-certifier.
3. **Boucle de groupe** : quelqu'un claim "X is member of Y" → d'autres vouch en déposant → un groupe émerge avec sa propre temperature économique.
4. **Boucle de marché** : tu mets du $TRUST sur un claim/URL → tu prends une position économique sur sa véracité/utilité → si beaucoup convergent, le triple monte en market cap → il devient visible.
5. **Boucle de réputation globale** : EigenTrust propage les attestations dans tout le graphe → tu hérites de la confiance de ceux qui te trustent, pondérée par leur propre confiance.
6. **Boucle saisonnière** : la Season Pool concentre l'attention sur une fenêtre, force la régularité (streaks), classe les profils sur PnL %.

L'intelligence collective émerge **sans agrégateur central** — c'est le graphe lui-même, lu par n'importe qui via GraphQL, qui produit du sens.

---

## 11. Design system (`@0xsofia/design-system`)

Kit UI pur. Consommé par `apps/explorer`, en cours d'adoption par `apps/extension`. Toute la taxonomie/predicates/quests/topic-emojis/level math a été **déplacée hors du DS** vers `apps/explorer` ; le DS n'expose plus que composants + styles + `theme.css` + un `INTENTION_HEX` minimal.

### 11.1. Palette intention — VIVID + PASTEL (dualité volontaire)

| Intention | VIVID (pills, badges, contraste) | PASTEL (ambient, borders, soft tints) |
|---|---|---|
| Trusted | `#22C55E` | `#6dd4a0` |
| Distrusted | `#EF4444` | `#e87c7c` |
| Work | `#3B82F6` | `#7bade0` |
| Learning | `#06B6D4` | `#5cc4d6` |
| Fun | `#F59E0B` | `#e4b95a` |
| Inspiration | `#8B5CF6` | `#a78bdb` |
| Buying | `#EC4899` | `#d98cb3` |
| Music | `#FF5722` | `#e0896a` |

- VIVID exposé en TS via `INTENTION_HEX` — éléments à fort contraste sur fond blanc.
- PASTEL exposé en CSS vars unprefixed (`--trusted`, `--work`, …) — ambiances, fonds de cards, bordures.
- Règle : *un pill = vivid, un fond = pastel.*

### 11.2. Tokens de surface (préfixés `--ds-*`)

```
--ds-bg            #ffffff  /  #0b0a12 (dark)
--ds-bg-subtle     #f7f6f2  /  #121120
--ds-card          #ffffff  /  #13121f
--ds-border        #ececf0  /  #25223a
--ds-ink           #02000e  /  #f5f3ff
--ds-muted         #6b6880  /  #8f8ca8
--ds-accent        #ffc6b0           (peach — couleur signature)
--ds-accent-soft   #ffe9df  /  rgba(255,198,176,0.12)
--ds-grid-dot      rgba(10,10,10,0.045) / rgba(255,255,255,0.05)
--ds-radius        10px
```

Dark mode déclenché par **`[data-theme="dark"]` OU `.dark`** (les deux conventions supportées).

### 11.3. Typographie

| Famille | Style | Usage |
|---|---|---|
| **Fraunces** | serif moderne, contrasté | titres de hero, labels topics, headings emphatiques |
| **JetBrains Mono** | mono technique | kickers, eyebrows, stats, niveaux, codes |
| **Geist** | sans grotesque | corps de texte, nav, UI générale |

### 11.4. Composants exposés

- **Layout** : `AppShell`, `NavSidebar`, `NavBrand`, `NavSection`, `NavItem`, `PageHero`, `SectionTitle`, `SubHeader`, `InterestHero`.
- **Primitives** : `FaviconWrapper`, `VerbTag` (pill 8 variantes d'intention), `UserBadge` (tier pioneer/explorer/contributor).
- **Cartes** : `GroupBentoCard` (Echoes composite), `InterestsGrid` / `InterestCard` / `AddInterestCard` (grille 3 colonnes avec hover-reveal coloré au topic), `TopicPicker` / `TopicCard`, `NicheChips` / `NicheChip`, `PlatformsGrid` / `PlatformCard` / `PlatformAddCard` / `PlatformSkeleton`.

### 11.5. Mise en page Explorer

```
┌──────────────────────────────────────────────────────────────┐
│  Header 56px — logo, search, cart, theme, auth              │
├──────────┬──────────────────────────┬────────────────────────┤
│ Sidebar  │   Main (zoom: 1.25)      │   RightSidebar (320px) │
│ 262px    │                          │                        │
│          │   ┌──────────────────┐   │   Suggested Accounts   │
│ Nav      │   │   Page Router    │   │   Trending Platforms   │
│Interests │   │  14 pages        │   │   Recent Activity      │
│Season    │   └──────────────────┘   │                        │
│Countdown │                          │   (hidden sur /profile │
│          │                          │    et cart ouvert)     │
└──────────┴──────────────────────────┴────────────────────────┘
```

Root font-size `18px` (vs 16 standard). Transitions 0.35–0.45s cubic-bezier sur sidebar/drawer.

### 11.6. Ambiance signature

- **Fond radial dot grid** (`--ds-grid-dot`) — texture "papier millimétré" très ténue.
- **Accent peach** (`#ffc6b0`) — bannière PageHero, carré déco incliné, hero login extension. **C'est LA couleur Sofia.**
- **Liquid glass** côté extension (héritage) — fonds semi-transparents + blur.

### 11.7. Implications pour la vidéo

- **Peach + dot grid** = signature visuelle immédiate. Toute scène marquée "Sofia" doit l'avoir.
- **Fraunces + JetBrains Mono** = duo typo identitaire. Titres en Fraunces, codes/labels système en mono.
- **8 couleurs d'intention** = palette narrative. On peut faire des séquences mono-couleur (la scène Work est bleue, Learning est cyan…).
- **Dualité VIVID/PASTEL** = deux registres : marketing-pop ↔ ambient-calme.
- **Carré incliné déco** = élément graphique réutilisable.

---

## 12. Lexique (à utiliser dans la vidéo)

| Terme | Sens court |
|---|---|
| Atom | Unité de connaissance on-chain |
| Triple | Relation S/P/O entre atoms |
| Vault | Bourse de shares adossée à un atom/triple |
| $TRUST | Token natif d'Intuition, 18 décimales |
| Signal | Triple créé/upvoté par un user |
| Certification | L'acte d'écrire une intention on-chain |
| Predicate | Verbe d'un triple (`trusts`, `visits for work`…) |
| Intention | Une des 8 catégories sémantiques |
| Trust Circle | Union des wallets que tes wallets liés trustent |
| Group | Object atom agrégé via le predicate `is member of` |
| Echoes | Vue regroupée des certifications de l'utilisateur |
| Discovery Score | Pioneer / Explorer / Contributor selon co-certifications |
| EigenTrust | Score global de confiance, propagation type PageRank |
| AgentRank | Variante EigenTrust pondérée par rôle de noeud |
| Streak | Jours consécutifs d'activité on-chain |
| Season Pool | Pool de stake saisonnier avec PnL % |
| Atom I | Atom partagé utilisé comme subject pour les triples utilisateurs |
| Sofia Proxy | Wrapper qui taxe et dépose dans le MultiVault |
| Counter-triple | Vault de désaccord, créé automatiquement avec chaque triple |
| Cart | Panier de certifications avant signature batch on-chain |

---

## 13. Tensions narratives exploitables pour la vidéo

- **Navigation volatile → savoir certifié** — un onglet ouvert/fermé/oublié vs un atom permanent.
- **Identité fragmentée → réputation portable** — ~140 plateformes qui chacune ne voient qu'un bout de toi vs un profil agrégé que tu possèdes.
- **Verbatim → verbe** — passer du clic anonyme au choix d'une intention (8 verbes) qui donne du sens.
- **Solo → cercle → groupe → collectif** — étapes successives : ta mémoire, ton Trust Circle, les groupes émergents, le graphe global.
- **Opinion → marché d'opinion** — un claim, deux vaults (support / oppose), du $TRUST des deux côtés, un prix qui émerge.
- **Suiveur → défricheur** — Pioneer/Explorer/Contributor récompense les premiers certifieurs.
- **EigenTrust** — visuel naturel : un graphe qui se réorganise, les noeuds bien-trustés grossissent et tirent les autres avec eux.
- **Bonding curve** — la conviction n'est pas binaire, elle est mesurée en shares achetées sur une courbe.
- **Atom I** — tous les « I » du monde convergent vers le même atom : image littérale de réseau.

---

## 14. Sources internes consultées

- `THP/Sofia/README.md` — repo overview, stack
- `THP/Sofia/apps/explorer/README.md` — architecture Explorer, scoring, MCP, pages
- `THP/Sofia/apps/explorer/src/pages/CirclesPage.tsx` — page Circles + état actuel (1 vrai circle + mocks)
- `THP/Sofia/apps/explorer/src/services/circleService.ts` — construction du Trust Circle (union + cache 60s)
- `THP/Sofia/apps/explorer/src/services/groupsService.ts` — agrégation des groupes via `MEMBER_OF`
- `THP/Sofia/apps/explorer/src/components/circles/*` — TrustCircleCard, GroupCard, CircleDetailHero, CircleFeedSection, CircleMembersCard, CircleTopTopicsCard, CreateCircleDrawer, etc.
- `THP/Sofia/apps/explorer/src/config/intentions.ts` — 8 intentions + quest badges
- `THP/Sofia/apps/explorer/src/config/taxonomy.ts` — taxonomie 14×88×300+
- `THP/Sofia/apps/explorer/src/config/signalMatrix.ts` — formules par plateforme
- `THP/Sofia/apps/explorer/src/services/mcpTrustService.ts` — EigenTrust / AgentRank / transitive trust
- `THP/Sofia/apps/explorer/src/services/discoveryScoreService.ts` — Pioneer/Explorer/Contributor
- `THP/Sofia/apps/explorer/src/services/reputationScoreService.ts` — calcul du score réputation
- `THP/Sofia/apps/extension/components/layout/BottomNavigation.tsx` — dock 5 items (Mark, My Profile, Circles, Score, Settings)
- `THP/Sofia/apps/extension/components/pages/*` — MarkPage, MyProfilePage (Echoes/Bookmarks/History/Connect), CirclesPage (home/feed/members), ScorePage (Stats/Quests/Pool), SettingsPage, HomePage (login)
- `THP/Sofia/apps/extension/components/ui/PageBlockchainCard.tsx` — coeur de la page Mark
- `THP/Sofia/services/mastra/src/mastra/{oauth,signals,workflows}/*` — OAuth providers + signal fetchers + workflows
- `THP/Sofia/packages/design-system/{README,src/theme.css,src/palette.ts}` — kit UI
- `~/.claude/skills/intuition/SKILL.md` — protocole Intuition
- `~/.claude/skills/intuition/reference/{sofia-extension,atom-i-pattern}.md`

---

## 15. Mapping vers la vidéo v1 (35s)

État courant : `video/index.html` + `video/timeline.js` — 8 frames, 35 secondes, scénario *Thailand hotel search*. Détail beat par beat dans [SCENES.md](SCENES.md).

### Ce que v1 a choisi de surfacer

| Tension du brain dump | Surfacée comment, où |
|---|---|
| Navigation volatile → savoir certifié | F2 (18 onglets éphémères) → F4 (6 URLs rangées dans la fenêtre *Thailand Trips Circle*) |
| Verbatim → verbe | F5 — l'utilisateur appose **TRUSTED** ou **DISTRUSTED** sur 4 cards, pas une note ni un like |
| Solo → cercle | F5 (toi seul) → F6 (4 autres curateurs : alice, marie, jules, sam, noah) → F7 (`+6`, `+4`, `+3` agrégés) |
| Opinion → marché d'opinion (partiel) | F6 — Reddit reçoit DISTRUSTED de toi mais Sam vote quand même : on voit deux verdicts coexister |
| Suiveur → défricheur (effleuré) | F6 — alice est la **première** à voter Tripadvisor, qui devient la winning card |

### Ce que v1 a délibérément laissé hors-champ

- **Toute mention on-chain** : pas de `triple`, `vault`, `atom`, `stake`, `$TRUST`, `predicate`, `Sofia Fee Proxy`. Le mot *endorsement* dans F7 sert d'agrégat neutre.
- **L'Explorer en screencast**. Sofia vit par sa wordmark Fraunces, son mark SVG, et ses verb pills — jamais par sa vraie UI.
- **Le catalogue 14×88×300+ et les ~140 plateformes**. Seuls les 4 tags d'intention (DEALS, ITINERARY, STAY, COMMUNITY) apparaissent — et ils ne sont pas explicitement reliés à la taxonomie produit.
- **Les 8 intentions complètes**. v1 montre 3 verbes : TRUSTED, DISTRUSTED, BUYING. Les 5 autres (work, learning, fun, inspiration, music) sont disponibles pour des extensions thématiques.
- **EigenTrust / AgentRank / Discovery Score**. Aucun chiffre de score, pas de leaderboard. La "winning card" gagne par accumulation visible (4 avatars dans la stack), pas par algorithme nommé.
- **Atom I**. La mécanique "même atom partagé" n'est pas dramatisée — les avatars curateurs suffisent à montrer l'agrégation.
- **Cart, Streaks, Season Pool, Quests, Echoes, Bookmarks**. Tous hors-champ.

### Réserves pour v2 / variantes thématiques

Le moteur de la vidéo est paramétrable (voir tableau "Réglages courants" dans SCENES.md). Variantes naturelles :

- **Verticale Music** — réutiliser le même 8-frame avec un autre verbe (Music), 4 cards Spotify/SoundCloud/Bandcamp/Mixcloud, curators différents. Couleur orange à la place du peach pour les verb pills.
- **Verticale Learning** — DeFi/Rust/3D — la requête tape "where do I learn X seriously", verbe LEARNING (cyan), 4 cards docs/blog/video/forum.
- **Verticale Buying** — déjà semi-présente dans v1 (verb BUYING sur Airbnb + Booking en F7). Une vidéo dédiée pourrait dramatiser la chaîne intention → cart → preuve d'achat.
- **Continuation v1.5** — après F8, montrer le profil `you.eth` qui *à son tour* propose une page Thailand à un autre cercle (la boucle "B devient Marie" du concept initial — désormais sans Marie, mais avec le même mécanisme).

### Contraintes durables (à respecter sur toutes les variantes)

1. **Direct stylization, pas screencast fidèle.** L'identité visuelle de Sofia tient dans : mark SVG, wordmark Fraunces, verb pills, cards à favicon + intent tag + verb.
2. **Pas de jargon Intuition.** Le viewer ne doit pas avoir besoin du protocole pour comprendre.
3. **Les couleurs curateurs sont stables.** alice peach, marie green, jules blue, sam purple, noah pink — réemploi entre frames et entre vidéos.
4. **Le geste reste verbal et explicite.** Ce n'est jamais "Sofia décide" — c'est "tu poses un verbe, ton cercle l'agrège, ton SERP en hérite".
