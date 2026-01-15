# Plan: Système de Découverte avec Intentions pour Sofia

## Résumé

Étendre le composant trust/distrust de `PageBlockchainCard` avec:
1. **Sélecteur d'intention** : "I am here for..." (work, learning, fun, inspiration, buying) - **séparé du trust/distrust**
2. **Statut de découverte** : Pioneer / Explorer / Contributor selon l'ordre d'arrivée
3. **Discovery Score** : Affiché en **compact dans PageBlockchainCard + détails dans une page profil**

---

## Garanties d'Engagement (Skin in the Game)

Pour que les intentions aient une **valeur réelle** et soient crédibles :

### 1. Stake Minimum Obligatoire
- **Montant minimum** pour certifier une intention (ex: 1 TRUST ou équivalent)
- L'utilisateur met de l'argent en jeu → réflexion avant de cliquer
- Le WeightModal force un minimum, pas de certification gratuite

### 2. Proof of Attention (temps sur la page)
- L'utilisateur doit passer **minimum X secondes** sur la page avant de pouvoir certifier
- Détection via `PageDataService` existant (scroll, temps, interactions)
- Si temps insuffisant → boutons d'intention désactivés avec message "Explore the page first"

### 3. Combinaison des deux
```
┌─────────────────────────────────────────────────────────┐
│  AVANT de pouvoir certifier :                           │
│                                                         │
│  ✓ Temps minimum sur page : 30 secondes                │
│  ✓ Interactions détectées : scroll, clics              │
│  ✓ Stake minimum : 1 TRUST                             │
│                                                         │
│  → Intention = engagement réel, données de qualité     │
└─────────────────────────────────────────────────────────┘
```

**Pas de contestation pour l'instant** - on garde le système simple.

---

## Architecture

```
PageBlockchainCard.tsx (existant)
├── Trust/Distrust buttons (inchangé)
├── [NEW] Discovery Section
│   ├── DiscoveryStatusBadge (Pioneer/Explorer/Contributor)
│   └── IntentionSelector (5 pills cliquables)
└── Extended metrics (inchangé)

Nouveaux fichiers:
├── types/discovery.ts           # Types TypeScript
├── hooks/usePageDiscovery.ts    # Statut Pioneer/Explorer/Contributor
├── hooks/useIntentionCertify.ts # Créer triples d'intention
├── hooks/useDiscoveryScore.ts   # Calcul du score
├── components/ui/IntentionSelector.tsx
└── components/ui/DiscoveryStatusBadge.tsx
```

---

## Fichiers à Modifier/Créer

### 1. Types - `extension/types/discovery.ts` (NOUVEAU)

```typescript
export type IntentionPurpose = 'for_work' | 'for_learning' | 'for_fun' | 'for_inspiration' | 'for_buying'
export type DiscoveryStatus = 'Pioneer' | 'Explorer' | 'Contributor' | null

export interface PageDiscoveryRecord {
  pageUrl: string
  certificationCount: number
  userStatus: DiscoveryStatus
  intentionPurposes: Record<IntentionPurpose, number>
}
```

### 2. Config - `lib/config/chainConfig.dev.ts` (MODIFIER)

Ajouter les nouveaux prédicats:
- `DISCOVERED` - pour certification de page
- `VISITS_FOR_WORK`, `VISITS_FOR_LEARNING`, `VISITS_FOR_FUN`, `VISITS_FOR_INSPIRATION`, `VISITS_FOR_BUYING`

### 3. Hook Discovery - `hooks/usePageDiscovery.ts` (NOUVEAU)

- Query GraphQL pour compter les certifications existantes
- Calcul du statut: Pioneer (1er), Explorer (2-10), Contributor (11+)
- Retourne: `discoveryStatus`, `certificationCount`, `isPioneer`

### 4. Hook Intention - `hooks/useIntentionCertify.ts` (NOUVEAU)

- Créer triple `[I] [visits_for_X] [page]` on-chain
- Gérer loading/success/error states

### 4b. Hook Proof of Attention - `hooks/useProofOfAttention.ts` (NOUVEAU)

Vérifie que l'utilisateur a vraiment exploré la page avant de certifier :

```typescript
interface ProofOfAttention {
  isEligible: boolean        // true si conditions remplies
  timeSpent: number          // secondes passées sur la page
  hasScrolled: boolean       // a scrollé ?
  hasInteracted: boolean     // clics, sélections ?
}

const MINIMUM_TIME = 30      // 30 secondes minimum
const MINIMUM_SCROLL = 0.3   // 30% de la page scrollée
```

**Utilise les données de `PageDataService` existant** (déjà tracké dans le background)

**UI si pas éligible:**
```
┌─────────────────────────────────────────────┐
│  I visit      [     ?     ]      this page  │
│                                             │
│  (work)  (learning)  (fun)  (inspiration)  (buying) │
│     ↑ grisés, non cliquables                │
│                                             │
│  Explore the page first                     │
└─────────────────────────────────────────────┘
```

### 5. Hook Score - `hooks/useDiscoveryScore.ts` (NOUVEAU)

**Scores séparés par type de découverte** (affichés dans le profil):
- **Pioneer Score** : Nombre de pages où l'utilisateur est le 1er à certifier
- **Explorer Score** : Nombre de pages où l'utilisateur est parmi les premiers (2-10)
- **Contributor Score** : Nombre de pages certifiées après les 10 premiers

**Conversion en XP** (utilise le système existant):
- +50 XP par Pioneer discovery (1er sur une page)
- +20 XP par Explorer discovery (2-10ème)
- +5 XP par Contributor discovery (11+)

### 6. Composant IntentionSelector - `components/ui/IntentionBubbleSelector.tsx` (NOUVEAU)

**Design minimaliste avec phrase à compléter + bulles texte:**

```
┌─────────────────────────────────────────────┐
│  I visit      [     ?     ]      this page  │
│                    ↑                        │
│           placeholder animé                 │
│                                             │
│  (work)  (learning)  (fun)  (inspiration)  (buying) │
│                                             │
│   ↑ bulles texte cliquables alignées        │
└─────────────────────────────────────────────┘
```

**Comportement:**
- Placeholder vide avec "?" ou animation subtile
- Clic sur bulle → **ouvre le WeightModal** (comme trust/distrust) avec le triple pré-rempli
- Triple affiché dans le modal: `[I] [visits for work] [page URL]`

**Bulles (texte uniquement, pas d'emoji):**
- `for work`
- `for learning`
- `for fun`
- `for inspiration`
- `for buying`

**Flow identique à trust/distrust:**
1. User clique sur une bulle (ex: "for learning")
2. Modal s'ouvre avec le triple: `I → visits for learning → [page]`
3. User choisit le weight et confirme
4. Transaction on-chain créée

### 7. Affichage Discovery Scores - Dans le profil (pas de badge séparé)

**Dans DiscoveryProfilePage, afficher 3 compteurs:**
```
┌─────────────────────────────────────┐
│  Pioneer         │  12 pages       │
│  Explorer        │  45 pages       │
│  Contributor     │  128 pages      │
└─────────────────────────────────────┘
```

**Dans PageBlockchainCard (compact + cliquable):**
- Afficher le statut actuel pour cette page: "You are Pioneer on this page!" ou "Explorer #7"
- **Cliquable** → redirige vers `DiscoveryProfilePage` avec toutes les stats

### 8. PageBlockchainCard.tsx (MODIFIER)

Ajouter section entre trust buttons et metrics:

```tsx
{/* Trust & Distrust Buttons - existant, INCHANGÉ */}

{/* NEW: Discovery Section (séparé du trust) */}
<div className="discovery-section">
  {/* Statut compact pour cette page - CLIQUABLE */}
  {discoveryStatus && (
    <div
      className="discovery-status-line clickable"
      onClick={() => navigateTo('DiscoveryProfile')}
    >
      {discoveryStatus === 'Pioneer' && "You are Pioneer on this page!"}
      {discoveryStatus === 'Explorer' && `Explorer #${certificationRank}`}
      {discoveryStatus === 'Contributor' && `Contributor #${certificationRank}`}
      <span className="view-stats-hint">View all stats →</span>
    </div>
  )}

  {/* Intention Bubble Selector - ouvre le WeightModal au clic */}
  <IntentionBubbleSelector
    onBubbleClick={handleIntentionClick}  // Ouvre WeightModal avec le triple
    pageUrl={currentUrl}
    pageLabel={pageLabel}
  />
</div>

{/* WeightModal - réutilisé comme pour trust/distrust */}
<WeightModal
  isOpen={showIntentionModal}
  onClose={() => setShowIntentionModal(false)}
  triplets={intentionTriplets}
  modalType="intention"
  onSubmit={handleIntentionSubmit}
/>

{/* Extended Metrics - existant */}
```

**Réutilisation du WeightModal existant:**
- Même composant que pour trust/distrust
- Affiche le triple sélectionné: `I → visits for [intention] → [page]`
- Permet de choisir le weight avant confirmation

### 9. Page Profil Discovery - `components/pages/DiscoveryProfilePage.tsx` (NOUVEAU)

Page dédiée aux statistiques de découverte complètes :

**Section 1 - Compteurs de statut:**
```
┌─────────────────────────────────────┐
│  DISCOVERY STATS                    │
├─────────────────────────────────────┤
│  Pioneer       │  12 pages         │
│  Explorer      │  45 pages         │
│  Contributor   │  128 pages        │
│                                     │
│  Total pages certified: 185         │
└─────────────────────────────────────┘
```

**Section 2 - XP Discovery:**
```
┌─────────────────────────────────────┐
│  DISCOVERY XP                       │
├─────────────────────────────────────┤
│  From Pioneer discoveries: 600 XP   │
│  From Explorer discoveries: 900 XP  │
│  From Contributor discoveries: 640 XP│
│                                     │
│  Total Discovery XP: 2,140          │
└─────────────────────────────────────┘
```

**Section 3 - Répartition par intention:**
```
┌─────────────────────────────────────┐
│  INTENTIONS BREAKDOWN               │
├─────────────────────────────────────┤
│  for work         ████████░░  35    │
│  for learning     ██████████  82    │
│  for fun          █████░░░░░  28    │
│  for inspiration  ███░░░░░░░  15    │
│  for buying       █████░░░░░  25    │
└─────────────────────────────────────┘
```

**Section 4 - Historique récent:**
```
┌─────────────────────────────────────────────────┐
│  RECENT DISCOVERIES                             │
├─────────────────────────────────────────────────┤
│  github.com/...     │ Pioneer  │ for learning  │
│  docs.react.dev/... │ Explorer │ for work      │
│  medium.com/...     │ Pioneer  │ for inspiration│
│  ...                                            │
└─────────────────────────────────────────────────┘
```
(Liste scrollable des 10 dernières découvertes avec URL, statut, intention)

**Accès:** Clic sur le statut discovery dans PageBlockchainCard (ex: "You are Pioneer on this page!")

### 10. Styles - `components/styles/IntentionBubbleSelector.css` (NOUVEAU)

```css
/* Phrase avec placeholder */
.intention-phrase {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.intention-placeholder {
  min-width: 100px;
  padding: 6px 12px;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.intention-placeholder.filled {
  border: 2px solid #10B981;
  background: rgba(16, 185, 129, 0.1);
}

/* Bulles cliquables */
.intention-bubbles {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.intention-bubble {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
}

.intention-bubble:hover {
  transform: scale(1.1);
  background: rgba(255,255,255,0.1);
}

.intention-bubble.selected {
  transform: scale(1.15);
  border-color: #F59E0B;
  background: rgba(245, 158, 11, 0.2);
}
```

### 11. Quest System - `hooks/useQuestSystem.ts` (MODIFIER)

Ajouter nouvelles quêtes:
- `discovery-first`: "First Step" - 1ère page certifiée (50 XP)
- `discovery-pioneer`: "Pioneer" - Être le 1er sur une page (200 XP)
- `discovery-10/50/100`: "Pathfinder/Cartographer/Explorer" (100-500 XP)
- `intention-variety`: "Multi-Purpose" - Utiliser les 5 intentions (150 XP)
- `multi-domain`: "Multi-domain Explorer" - 10 domaines différents (200 XP)

---

## Ordre d'Implémentation par Phases

### PHASE 1 : Foundation (MVP minimal)
**Objectif:** Permettre de certifier une page avec une intention + garanties d'engagement

- [ ] 1.1 Créer `types/discovery.ts` - Types de base
- [ ] 1.2 Ajouter prédicats dans `chainConfig.dev.ts`
- [ ] 1.3 Créer `useIntentionCertify.ts` - Hook pour créer le triple
- [ ] 1.4 Créer `useProofOfAttention.ts` - Hook pour vérifier temps/scroll sur la page
- [ ] 1.5 Créer `IntentionBubbleSelector.tsx` - UI des bulles (désactivées si pas assez d'attention)
- [ ] 1.6 Intégrer dans `PageBlockchainCard.tsx` - Ajouter la section
- [ ] 1.7 Configurer stake minimum dans WeightModal pour les intentions

**Livrable Phase 1:** User doit explorer la page (30s+) → peut cliquer bulle → WeightModal avec minimum → Transaction

---

### PHASE 2 : Discovery Status
**Objectif:** Afficher Pioneer/Explorer/Contributor

- [ ] 2.1 Créer `usePageDiscovery.ts` - Query pour compter les certifications
- [ ] 2.2 Ajouter l'affichage du statut dans `PageBlockchainCard.tsx`
- [ ] 2.3 Ajouter les styles CSS

**Livrable Phase 2:** User voit "You are Pioneer!" après avoir certifié

---

### PHASE 3 : Profil Discovery
**Objectif:** Page avec toutes les stats

- [ ] 3.1 Créer `useDiscoveryScore.ts` - Calcul des scores globaux
- [ ] 3.2 Créer `DiscoveryProfilePage.tsx` - UI de la page
- [ ] 3.3 Ajouter la navigation (clic sur statut → profil)
- [ ] 3.4 Ajouter la route dans le router

**Livrable Phase 3:** User peut voir ses stats complètes

---

### PHASE 4 : Gamification (optionnel)
**Objectif:** Intégrer avec le système de quêtes existant

- [ ] 4.1 Ajouter les quêtes discovery dans `useQuestSystem.ts`
- [ ] 4.2 Connecter les XP discovery au système existant
- [ ] 4.3 Tester le flow complet

**Livrable Phase 4:** Quêtes de découverte fonctionnelles

---

## Vérification

1. Ouvrir l'extension sur une page non certifiée → pas de statut discovery affiché (ou "Be first!")
2. Trust/Distrust fonctionne toujours normalement (indépendant)
3. Cliquer sur une bulle d'intention (ex: "for learning") → WeightModal s'ouvre avec triple `I → visits for learning → [page]`
4. Confirmer dans le modal → transaction créée, statut "You are Pioneer on this page!" affiché
5. Cliquer sur le statut "You are Pioneer..." → navigation vers DiscoveryProfilePage
6. Dans DiscoveryProfilePage → voir Pioneer Score: 1, XP gagné
7. Ouvrir sur même page depuis autre compte → voir "Explorer #2" (si 2-10) ou "Contributor #X" (si 11+)
8. Vérifier nouvelles quêtes débloquées dans le système de quêtes
