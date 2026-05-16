# Sofia — Hero video (35s, 8 frames, 1776×890)

> **Pitch** : on tape la même requête deux fois — _find me the best hotel in Thailand_. La première fois, c'est le chaos Google : 18 onglets, aucun signal. La deuxième fois, c'est Sofia : ton cercle a déjà fait le tri, ton classement remonte directement dans le SERP.
>
> **Format** : 1776×890 canvas, 35 secondes deterministes, GSAP timeline (`video/timeline.js`). 8 frames qui s'enchaînent sans coupure de chrono. Pas de voix-off, pas de musique imposée par le code — la musique se calle en post.
>
> **Univers visuel** : pastiches stylisés de Chrome (chaos) et de Google SERP (final). Pas de capture pixel-fidèle. Sofia est représentée par sa wordmark Fraunces + son mark (logo SVG) + son langage de verb pills (TRUSTED / DISTRUSTED / BUYING) emprunté au design system.
>
> **Palette** :
>
> - Gris froid `#dde2ea` pendant le chaos Chrome (F2 → bascule)
> - Peach `--ds-accent` `#ffc6b0` dès que Sofia entre en scène (F3, F4, F5, F6, F8)
> - Blanc Google SERP (F7) avec accents Sofia
>
> **Typographie** : Fraunces (display, headlines, italique pour émotion), Geist (UI body), JetBrains Mono (chronos, URLs, méta-données froides).
>
> **Personae** : aucun visage humain. Les curateurs sont représentés par des avatars circulaires colorés à initiale unique (alice, marie, jules, sam, noah). L'utilisateur principal est `you.eth`, représenté par un curseur peach dans F5.

---

## Synoptique

| Frame | Timecode        | Beat                                                          | Track |
| ----- | --------------- | ------------------------------------------------------------- | ----- |
| F1    | 0:00 – 0:02.5   | Google search — typewriter de la requête                      | 1     |
| F2    | 0:02.5 – 0:06   | 18 onglets Chrome jaillissent puis fuient                     | 1     |
| F3    | 0:03.5 – 0:08.5 | Le logo Sofia émerge derrière le chaos, peach wash-in         | 2     |
| F4    | 0:08.5 – 0:14.5 | Lasso : 6 onglets se rangent dans une fenêtre Sofia           | 2     |
| F5    | 0:14.5 – 0:20.5 | Tu tagges 4 cards (3 TRUSTED + 1 DISTRUSTED)                  | 2     |
| F6    | 0:20.5 – 0:28.5 | Ton cercle vote en live (9 votes, alice/marie/jules/sam/noah) | 3     |
| F7    | 0:27.5 – 0:32   | Nouvelle recherche Google → ton SERP Sofia atterrit en tête   | 2     |
| F8    | 0:32 – 0:35     | Closing : _Browse with trust_ — `sofia.intuition.box`         | 2     |

> Les frames se chevauchent volontairement (F2/F3, F6/F7) pour fluidifier les transitions. Les tracks 1/2/3 sont des layers GSAP, pas des bandes audio.

---

## F1 — Search (0:00 → 0:02.5)

**Scène** : fond clair, wordmark Google centrée (6 lettres couleurs Google), grosse barre de recherche blanche en dessous, icône loupe + cursor + dot micro. Tout est stylisé — pas de Chrome chrome, pas d'onglet, pas d'URL bar.

**Animation**

- `t=0` : scène vide, stage à `scale: 0.96`.
- `t=0.25 → 1.80` (1.55s) : typewriter character-by-character de `find me the best hotel in Thailand` dans `#f1-text`. Cursor `#f1-cursor` clignote 5× (0.5s on/off) pendant la frappe.
- `t=0.25 → 1.95` : stage push-in `scale: 0.96 → 1`, `ease: power1.out`.
- `t=1.80` : Enter — `#f1-flash` opacity 0 → 0.85 → 0 (durée 0.42s), `.f1-bar` pulse `scale: 1 → 1.04 → 1`.

**Intention narrative** : démarrer dans le plus banal possible — Google, requête anglophone, voyage. Le viewer doit penser _« c'est moi qui tape ça tous les jours »_.

---

## F2 — Chaos (0:02.5 → 0:06)

**Scène** : 18 onglets Chrome stylisés (`.cw`) jaillissent du centre, chacun avec son favicon et son URL : booking, tripadvisor, expedia, hotels, airbnb, agoda, trivago, facebook, reddit, kayak, skyscanner, hostelworld, marriott, lonelyplanet, youtube, vrbo, tiktok, quora.

**Animation**

- Tous les `#cw-i` partent de `x:0, y:0, scale:0, opacity:0`.
- `t=2.5 → 3.6` : burst — chaque onglet vole vers sa position cible (`x`, `y`, `rotation` table `CW_TARGETS`), stagger 55ms, `back.out(1.3)`. Les positions remplissent tout le canvas, des coins lointains aux centres haut/bas.
- `t=4.2 → 5.05` : **scatter radial** — chaque onglet s'éloigne du centre selon son vecteur d'arrivée (`x * 2.8, y * 2.8`), rotation amplifiée, `scale: 0.78`, opacity 0. Stagger 12ms. `ease: power3.in`.
- `t=4.4` : `#f2-stage` wash blanc-peach (`rgba(255,248,238,0.65)`) — préfigure l'arrivée de Sofia.

**Intention narrative** : le chaos _est_ le produit Google aujourd'hui. 18 onglets pour répondre à une question. Personne ne lit, on accumule. Quand la lumière peach monte au centre, on sent qu'autre chose va prendre la place.

---

## F3 — Reveal (0:03.5 → 0:08.5, recouvre F2)

**Scène** : fond peach `--ds-accent` qui remplace le gris, logo Sofia qui grandit depuis le centre, rays soft qui rayonnent derrière, headline _Introducing Sofia_, sous-titre _collective intelligence for the web_.

**Animation**

- `t=3.5` : `#f3-logo` apparaît derrière les onglets (`scale: 0.05 → 0.4`).
- `t=4.05 → 4.6` : logo gonfle `scale: 0.4 → 1.5` — c'est _cette_ poussée qui justifie le scatter Chrome à `t=4.2`. Sofia pousse le chaos hors-cadre.
- `t=4.6 → 4.95` : settle `scale: 1.5 → 1`.
- `t=4.9 → 5.45` : `#f3-bg` (peach) fade in.
- `t=5.05 → 8.05` : `#f3-rays` rotation 0 → 18°, fade-in.
- `t=5.45` : `#f3-intro` (Fraunces, _Introducing Sofia_) slide-up + letter-spacing tighten.
- `t=5.8` : `#f3-sub` slide-up.

**Intention narrative** : le pivot. On a vu le chaos. On apprend que ce qui va remplacer ce chaos a un nom, un visage, et un manifeste en une ligne : _collective intelligence for the web_.

---

## F4 — Lasso (0:08.5 → 0:14.5)

**Scène** : split vertical. À gauche, mur d'onglets miniatures (`f4-wall`, 8 `.cw-mini` avec favicons booking/tripadvisor/airbnb/reddit/agoda/expedia/facebook/hotels). À droite, fenêtre glassmorphism estampillée _Thailand Trips Circle_, vide au départ, qui se remplit ligne à ligne. Caption en bas : _One window. The links your circle already vouched for._

**Animation**

- `t=8.5` : eyebrows CHAOS / SOFIA. Mur d'onglets stagger-in en random (`back.out(1.4)`).
- `t=9.0` : `#f4-window` slide-in depuis la droite. Pulse peach box-shadow (calling pulse).
- `t=10.1 → 14.05` : 6 cycles `tagCard`-style à 0.65s d'intervalle (`GATHER`). Chaque cycle :
  1. L'onglet correspondant (`lcw-0..5`) jiggle dans son slot (rotation ±5°, scale 1.08).
  2. Il s'élève (`+dx*0.55, -20px, scale 0.85`) puis plonge (`+dx*0.45, +dy+20, scale 0.20, opacity 0`) vers le bord gauche de la Sofia window.
  3. À l'instant d'arrivée, la ligne URL correspondante (`#f4-url-i`) pop-in dans la fenêtre (`back.out(1.7)`).
  4. Le texte de l'URL typewrites caractère par caractère (12ms/char).
  5. La fenêtre Sofia flashe peach.
- URLs finales rangées dans la fenêtre : booking.com/thailand-deals · tripadvisor.com/thailand-hotels · airbnb.com/rooms/chiang-mai · reddit.com/r/ThailandTourism · agoda.com/thailand-hotels · expedia.com/Thailand.
- `t=14.15` : `#f4-caption` fade-in.

**Intention narrative** : Sofia n'invente pas le contenu. Elle prend les 6 liens que _ton cercle a déjà ouverts_ (vu sur le mur de gauche) et les classe dans une fenêtre lisible. Le geste du chrome qui plonge dans la fenêtre = capture / consolidation, pas magie LLM.

---

## F5 — Validation (0:14.5 → 0:20.5)

**Scène** : la fenêtre `Thailand Trips Circle · 4 links` s'ouvre en plein. 4 cards en grille 2×2, chacune avec favicon, titre, host, tag d'intention (DEALS / ITINERARY / STAY / COMMUNITY) et verb pill (TRUSTED ou DISTRUSTED). Un curseur peach `you.eth` (custom SVG arrow) flotte sur la scène.

**Animation**

- `t=14.5` : window fade-in + scale 0.96 → 1. Cards stagger 80ms.
- `t=14.5` : tous les verb pills cachés (`opacity:0, scale:0.6`) — on les fait _apparaître_ sur clic.
- `t=14.8` : curseur `#f5-ptr` fade-in en bas-droite (1700, 880).
- 4 clics `tagCard` à `F5 + 0.5 / 1.75 / 3.00 / 4.25` :
  - **Tripadvisor** (`#f5-c-1`, ITINERARY) → TRUSTED — `target.x=1092, y=293`
  - **Booking** (`#f5-c-0`, DEALS) → TRUSTED — `target.x=316, y=293`
  - **Airbnb** (`#f5-c-2`, STAY) → TRUSTED — `target.x=300, y=477`
  - **Reddit** (`#f5-c-3`, COMMUNITY) → DISTRUSTED — `target.x=1113, y=477`
- Chaque clic : curseur drift vers la cible (0.60s), pulse `scale: 0.85 → 1`, card pulse `border → peach-deep` + `y: -3`, verb pill pop-in (`back.out(2)`).
- `t=19.8` : curseur dérive au centre (880, 820) en 0.8s.

**Intention narrative** : _tu_ poses des verbes. Pas des étoiles, pas des likes. Un acte explicite : TRUSTED ou DISTRUSTED. La 4ème card (Reddit) prend DISTRUSTED — Sofia n'est pas un système de validation aveugle ; refuser fait partie du geste. C'est aussi ce qui permet de qualifier ce qu'on rejette.

---

## F6 — Social validation (0:20.5 → 0:28.5)

**Scène** : même fenêtre, retitrée `Thailand Trips Circle · live`. Les 4 cards portent maintenant un crédit `Certified by alice.eth` / `Recommended by marie.eth` / `Validated by jules.eth` / etc. À droite de chaque verb pill, une `vote-stack` vide attend les avatars.

**Curateurs**
| ID | Couleur | Init |
|---|---|---|
| alice | `#ffc6b0` (peach) | A |
| marie | `#22c55e` (green) | M |
| jules | `#3b82f6` (blue) | J |
| sam | `#8b5cf6` (purple) | S |
| noah | `#ec4899` (pink) | N |

**Vote sequence** — 9 votes, ~0.65s d'intervalle (`F6 + 0.8 → 6.1`) :

| t    | card        | curator |
| ---- | ----------- | ------- |
| +0.8 | Tripadvisor | alice   |
| +1.4 | Airbnb      | marie   |
| +2.1 | Booking     | jules   |
| +2.8 | Tripadvisor | marie   |
| +3.5 | Reddit      | sam     |
| +4.2 | Airbnb      | noah    |
| +4.9 | Booking     | noah    |
| +5.5 | Tripadvisor | jules   |
| +6.1 | Tripadvisor | sam     |

Comptes finaux : Tripadvisor **4**, Airbnb 2, Booking 2, Reddit 1.

**Animation par vote**

- L'avatar (init dans cercle coloré) pop dans le slot suivant de la vote-stack (`back.out(2.2)`).
- Un `+1` flotte juste à droite, coloré au color du curateur, fade-in puis disparait (~0.95s total).

**Climax**

- `t=26.8` (`F6 + 6.3`) : Tripadvisor (`#f6-c-1`) gagne — `y: -8`, border peach-deep, double box-shadow peach (`0 0 0 2px peach`), `back.out(1.4)`, 0.7s.

**Intention narrative** : ton tag (F5) n'est pas isolé. D'autres l'ont confirmé. Pas en likes anonymes — chaque vote a un visage (initiale + couleur) qu'on retrouvera. La carte gagnante n'est pas celle qui a _le plus de clics au monde_, c'est celle que **ton cercle** a élue.

---

## F7 — New search (0:27.5 → 0:32)

**Scène** : un nouveau SERP Google. **Pas de typewriter cette fois**, pas de zoom sur la search bar — on atterrit directement sur la page de résultats. Section _FROM YOUR SOFIA CIRCLE · 3 RESULTS_ en haut, puis une section _OTHER RESULTS_ (vanilla Google) en dessous, dim.

**Slide-relay F6 → F7** (commence à `t=27.10`)

- `#f6-c-1` (la carte gagnante Tripadvisor) glisse hors-cadre vers la droite : `x: +1776, duration: 0.75, ease: power3.in`.
- Les 3 autres cards F6 (booking/airbnb/reddit) fade-out (opacity 0, 0.35s).
- `#f7-srp-0` (vide à l'écran) entre par la gauche : `x: -1776 → 0, opacity 0 → 1, 0.85s, ease: power3.out` à partir de `F7+0.30`. **C'est la même carte qui change de scène** — F6 sort à droite, F7 entre à gauche : le viewer comprend que son verdict de cercle est _littéralement_ devenu son SERP.

**Cascade SERP**

- `t=27.5` : `.f7-results` fade + slide-up (0.55s).
- `t=27.6` : section eyebrow + logo Sofia (rotation -90° → 0°, `back.out(1.6)`).
- `t=27.9` : `#f7-srp-1` (Airbnb · BUYING · 7 endorsements) et `#f7-srp-2` (Booking · BUYING · 5 endorsements) stagger-in (0.14s).
- `t=28.3` : `#f7-vanilla` (Expedia / Agoda / Trivago) entre à `opacity: 0.55` — présent mais déjà disqualifié.

**Composition des 3 SRP Sofia**
| Slot | Source | Verb | Endorsements | Snippet curateur |
|---|---|---|---|---|
| #f7-srp-0 | tripadvisor.com | TRUSTED | 9 | _"The only itinerary that survived contact with reality." — alice.eth_ |
| #f7-srp-1 | airbnb.com | BUYING | 7 | _"Booked it twice, would book again." — marie.eth_ |
| #f7-srp-2 | booking.com | BUYING | 5 | _"Real prices, no upsell carousel." — sam.eth_ |

Chaque card a sa rangée d'avatars (A/M/J + `+6`, M/S/N + `+4`, S/J/N) — les chiffres `+N` agrègent le reste du cercle pour vendre l'idée d'un fond plus profond.

**Intention narrative** : la même boîte Google que F1. Même requête. Mais maintenant, le SERP commence par _ton_ cercle, classé selon _tes_ verbs. Les résultats vanilla restent en dessous, dim — Sofia ne les remplace pas, elle les _reclasse_. Le verb pill BUYING (jamais montré dans F5) apparaît ici : il signale que d'autres curateurs ont posé un verbe différent — Sofia agrège, ne dictate pas.

---

## F8 — Closing (0:32 → 0:35)

**Scène** : fond sombre (`f8-bg`), Sofia mark + wordmark serif au centre, tagline _Browse with trust._, CTA `sofia.intuition.box`.

**Animation**

- `t=32.1` : `#f8-mark` (logo SVG) pop `scale: 0.6 → 1, back.out(1.5)`.
- `t=32.4` : `#f8-wordmark` slide-in depuis la gauche (`x: -32 → 0`).
- `t=33.0` : `#f8-tagline` slide-up + letter-spacing `-0.01em → -0.02em`.
- `t=33.6` : `#f8-cta` slide-up.

**Intention narrative** : la promesse de la marque, en quatre mots. Pas de slogan produit. _Browse with trust_ — verbe (browse) + valeur (trust). Et l'URL où on continue.

---

## Détails techniques

- **Canvas** : 1776×890 (16:9 légèrement coupé pour banner-style).
- **Durée totale** : 35.0s.
- **Renderer** : HyperFrames + GSAP 3.14.2. Timeline registrée sur `window.__timelines["main"]`.
- **Determinisme** : aucun `Math.random`, aucun `Date.now`, aucun fetch. Le `stagger: { from: 'random' }` GSAP est seedable (F4 wall) — si le seed varie, ne pas l'utiliser pour des frames critiques.
- **Sound** : aucune piste audio dans le source — mix en post.

---

## Réglages courants

| Tuning                   | Où                          | Note                                                                 |
| ------------------------ | --------------------------- | -------------------------------------------------------------------- |
| Vitesse du typewriter F1 | `F1_TYPE_DUR`               | actuellement 1.55s — passer à 1.20s pour intensifier l'urgence       |
| Densité du chaos F2      | `CW_TARGETS.length`         | 18 fenêtres ; baisse à 12 si trop écrasant                           |
| Stagger des votes F6     | `VOTE_SEQUENCE` `t` deltas  | ~0.65s — serrer à 0.45s pour plus d'intensité sociale                |
| Couleur curateur         | `CURATOR_DATA`              | les 5 couleurs servent aussi pour les `+1` floats                    |
| Identité SRP gagnant F7  | `#f7-srp-0` head            | Tripadvisor par défaut — change favicon, host, snippet, mav initials |
| Vanilla dim F7           | `#f7-vanilla` final opacity | 0.55 — descendre à 0.40 pour vraiment écraser les concurrents        |

---

## À garder en tête pour les itérations futures

- **Pas d'écran complet d'application Sofia.** L'Explorer n'apparaît jamais en vrai screencast. La marque vit à travers le mark, la wordmark Fraunces, les verb pills (TRUSTED / DISTRUSTED / BUYING), et le langage de cards.
- **Pas de jargon Intuition.** Aucune mention de triple, vault, atom, stake, $TRUST, predicate. Le mot _endorsement_ sert d'agrégat.
- **Les curateurs ont des couleurs cohérentes** entre F6 (votes), F7 (avatars du SRP), et tout réemploi futur. Si on étend la vidéo, garder les 5 couleurs comme palette identitaire.
- **Le geste TRUSTED est verbal, pas quantitatif.** F5 ne montre pas de score — l'utilisateur appose un verbe. Le quantitatif (endorsement counts, +N) n'arrive qu'en F7 quand on agrège du cercle.
- **F7 atterrit en SERP directement.** Pas de répétition de la search F1 (le commentaire dans `timeline.js` est explicite). Toute tentation de typewriter F7 doit être refusée — la magie c'est de _sauter_ l'effort.
