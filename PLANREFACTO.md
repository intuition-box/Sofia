# Plan: Groupes d'Intention Évolutifs (Style Google History)

## Résumé du Nouveau Concept

**Inspiration**: Mode "Groupes" de l'historique Google Chrome

**Principe**:
1. Les URLs sont groupées par **domaine** et **persistent** entre sessions
2. Le **titre du groupe = domaine** (twitch.tv, zircuit.com) - PAS d'IA pour les titres
3. L'utilisateur **certifie** chaque URL (work/learning/fun/inspiration/buying) → **gagne +10 XP**
4. L'utilisateur **dépense XP** pour "LVL UP" un groupe (coût progressif: 30 → 50 → 75 → 100 plafonné)
5. Au LVL UP, l'IA génère un **nouveau predicate** (2-4 mots) basé sur les certifications
6. Au clic sur **"Amplify"**, le triple est publié on-chain

**Structure Triple OBLIGATOIRE**:
```
Subject: "I"                         ← Toujours "I" (identité user)
Predicate: "look for"                ← Généré par IA (2-4 mots MAXIMUM)
Object: "Anime Twitch channel"       ← Titre du groupe (= domaine ou titre édité)
```

**Exemple complet**: `I look for Anime Twitch channels`

**Système XP UNIFIÉ** (réutilise `useQuestSystem.ts` et `useDiscoveryScore.ts`):

**Sources de XP existantes** (déjà implémentées):
1. **Quest XP** → `claimed_quests` dans `chrome.storage.local`
2. **Discovery XP** → `claimed_discovery_xp` dans `chrome.storage.local`
   - Pioneer (1er): +50 XP
   - Explorer (2-10ème): +20 XP
   - Contributor (11+): +5 XP

**Nouvelles sources depuis Echoes Tab**:
3. **Group Certification XP** → `group_certification_xp` dans `chrome.storage.local`
   - +10 XP par certification d'URL dans un groupe

**Dépenser XP** (NOUVEAU - depuis Echoes Tab):
- `spent_xp` dans `chrome.storage.local`
- LVL UP avec coût progressif:
  - Level 1 → 2: 30 XP
  - Level 2 → 3: 50 XP
  - Level 3 → 4: 75 XP
  - Level 4 → 5: 100 XP
  - Level 5+: 100 XP (plafonné)

**Calcul Total XP** (modifier `useQuestSystem.ts`):
```typescript
const totalXP = useMemo(() => {
  const questXP = quests
    .filter(quest => claimedQuestIds.has(quest.id))
    .reduce((sum, quest) => sum + quest.xpReward, 0)
  // AJOUTER: groupCertificationXP - spentXP
  return questXP + claimedDiscoveryXP + groupCertificationXP - spentXP
}, [quests, claimedQuestIds, claimedDiscoveryXP, groupCertificationXP, spentXP])
```

**Philosophie**: L'utilisateur doit pouvoir dépenser régulièrement, pas se retrouver bloqué.
Avec 10 XP par certification dans un groupe, il faut 3 certifications pour le premier LVL UP, ce qui est atteignable.

**Différence avec l'ancien système**:
- AVANT: Groupes temporaires, reset après flush, predicate fixe
- MAINTENANT: Groupes persistants, accumulation continue, predicate évolutif via IA

---

## Architecture Révisée

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUX PRINCIPAL                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Navigation                                                                 │
│       │                                                                      │
│       ▼                                                                      │
│   ┌─────────────────┐                                                        │
│   │ SessionTracker  │ ─── Buffer URLs (15 URLs ou 30 min)                   │
│   └────────┬────────┘                                                        │
│            │ flush                                                           │
│            ▼                                                                 │
│   ┌─────────────────┐                                                        │
│   │  GroupManager   │  Titre = domaine (PAS d'IA ici!)                      │
│   │  (PERSISTANT)   │                                                        │
│   └────────┬────────┘                                                        │
│            │                                                                 │
│            │ URLs assignées aux groupes existants ou nouveaux               │
│            ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │                    GROUPES PERSISTANTS                       │           │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │           │
│   │  │ twitch.tv       │  │ zircuit.com     │  │ youtube.com │  │           │
│   │  │ ├─ url1 [work]  │  │ ├─ url1 [learn] │  │ ├─ url1 [ ] │  │           │
│   │  │ ├─ url2 [fun]   │  │ ├─ url2 [work]  │  │ └─ url2 [ ] │  │           │
│   │  │ └─ url3 [ ]     │  │ └─ url3 [learn] │  │             │  │           │
│   │  │ Level: 2        │  │ Level: 1        │  │ Level: 1    │  │           │
│   │  │ pred: "love"    │  │ pred: (none)    │  │ pred: (none)│  │           │
│   │  └─────────────────┘  └─────────────────┘  └─────────────┘  │           │
│   └─────────────────────────────────────────────────────────────┘           │
│            │                                                                 │
│            │ User certifie URLs → gagne XP (+10 par certification)          │
│            │                                                                 │
│            │ User clique "LVL UP" (dépense XP: 30 → 50 → 75 → 100)          │
│            ▼                                                                 │
│   ┌─────────────────┐     ┌──────────────────┐                              │
│   │  LevelUpService │ ◄───│  PredicateAgent  │  IA génère predicate         │
│   └────────┬────────┘     │  (Mastra)        │  (2-4 mots seulement)        │
│            │              └──────────────────┘                              │
│            │                                                                 │
│            │ Nouveau predicate: "love", "dive into", "master"               │
│            ▼                                                                 │
│   ┌─────────────────┐                                                        │
│   │ Predicate évolue│  Groupe level up: 1 → 2                               │
│   │                 │  predicate: null → "love"                             │
│   └────────┬────────┘                                                        │
│            │                                                                 │
│            │ User clique "Amplify"                                          │
│            ▼                                                                 │
│   ┌─────────────────┐                                                        │
│   │ Publish Triple  │  Subject: "I"                                         │
│   │                 │  Predicate: "love"                                    │
│   │                 │  Object: "twitch.tv"                                  │
│   └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Structures de Données

### IntentionGroup (Persistant)

```typescript
interface IntentionGroup {
  id: string;                          // = domain (ex: "twitch.tv", "zircuit.com")
  domain: string;                      // Même valeur que id
  title: string;                       // = domain par défaut (user peut éditer)
  createdAt: number;
  updatedAt: number;

  // URLs du groupe
  urls: GroupUrl[];

  // Niveau et XP
  level: number;                       // Commence à 1, augmente avec LVL UP

  // Predicate actuel (null jusqu'au premier LVL UP)
  currentPredicate: string | null;     // "love" | "dive into" | "master" | etc.
  predicateHistory: PredicateChange[]; // Historique des évolutions

  // Stats agrégées
  totalAttentionTime: number;
  totalCertifications: number;
  dominantCertification: string | null; // "work" | "learning" | "fun" | etc.
}

interface GroupUrl {
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  addedAt: number;
  attentionTime: number;

  // Certification utilisateur (null = pas encore certifié)
  certification: 'work' | 'learning' | 'fun' | 'inspiration' | 'buying' | null;
  certifiedAt?: number;

  // Removed by user?
  removed: boolean;
}

interface PredicateChange {
  fromPredicate: string | null;
  toPredicate: string;
  fromLevel: number;
  toLevel: number;
  changedAt: number;
  xpSpent: number;
  reason: string;  // "User certified 4/5 URLs as learning"
}

// Système XP global user
interface UserXP {
  totalXP: number;           // XP actuel disponible
  totalEarned: number;       // Total XP gagné depuis le début
  totalSpent: number;        // Total XP dépensé
  lastUpdated: number;
}
```

### Calcul du coût XP pour LVL UP

```typescript
function getLevelUpCost(currentLevel: number): number {
  // Coûts progressifs mais accessibles, plafonnés à 100 XP
  const costs: Record<number, number> = {
    1: 30,   // Level 1 → 2: 30 XP (3 certifications)
    2: 50,   // Level 2 → 3: 50 XP (5 certifications)
    3: 75,   // Level 3 → 4: 75 XP (7-8 certifications)
    4: 100,  // Level 4 → 5: 100 XP (10 certifications)
  };
  // Plafonné à 100 XP pour tous les levels >= 4
  return costs[currentLevel] ?? 100;
}

// Exemples:
// getLevelUpCost(1) = 30    (pour passer de level 1 à 2)
// getLevelUpCost(2) = 50    (pour passer de level 2 à 3)
// getLevelUpCost(3) = 75    (pour passer de level 3 à 4)
// getLevelUpCost(4) = 100   (pour passer de level 4 à 5)
// getLevelUpCost(5) = 100   (plafonné)
// getLevelUpCost(10) = 100  (plafonné)
```

**Ratio XP gagné / dépensé**:
- Certification: +10 XP
- Premier LVL UP: 30 XP = 3 certifications → accessible rapidement
- Total pour atteindre level 5: 30 + 50 + 75 + 100 = 255 XP = 26 certifications

---

## Services à Créer

> **⚠️ CORRECTION ARCHITECTURE**: Les services doivent être dans `extension/lib/services/` (pas `background/services/`) pour être cohérent avec le projet existant (MessageBus, BadgeService, PageDataService, etc.). Il n'y a pas de problème de contexte car tous les services sont appelés depuis le background script via le système de messages Chrome Runtime.

### 1. GroupManager (NOUVEAU)
**Fichier**: `extension/lib/services/GroupManager.ts`

Responsabilité: Gérer les groupes persistants, assigner les nouvelles URLs.

```typescript
class GroupManager {
  // Stockage persistant IndexedDB
  private groups: Map<string, IntentionGroup> = new Map();

  // Charger groupes existants au démarrage
  async init(): Promise<void>;

  // Ajouter URLs d'un flush à des groupes (existants ou nouveaux)
  async processFlush(urls: TrackedUrl[]): Promise<void> {
    const domainGroups = this.groupByDomain(urls);

    for (const [domain, domainUrls] of domainGroups) {
      const existingGroup = this.groups.get(domain);

      if (existingGroup) {
        await this.addUrlsToGroup(domain, domainUrls);
      } else {
        await this.createNewGroup(domain, domainUrls);
      }
    }
  }

  // Créer groupe - TITRE = DOMAINE (pas d'IA!)
  private async createNewGroup(domain: string, urls: TrackedUrl[]): Promise<IntentionGroup> {
    const group: IntentionGroup = {
      id: domain,
      domain,
      title: domain,              // TITRE = DOMAINE (pas d'IA!)
      urls: urls.map(u => ({ ...u, certification: null, removed: false })),
      level: 1,                   // Commence à level 1
      currentPredicate: null,     // Pas de predicate avant LVL UP
      predicateHistory: [],
      totalAttentionTime: 0,
      totalCertifications: 0,
      dominantCertification: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.groups.set(domain, group);
    await this.persistGroup(group);
    return group;
  }

  // Certifier une URL (user gagne +10 XP)
  async certifyUrl(groupId: string, url: string, certification: string): Promise<{ xpGained: number }>;

  // Supprimer URL d'un groupe (bouton X)
  async removeUrl(groupId: string, url: string): Promise<void>;

  // Récupérer tous les groupes pour l'UI
  async getAllGroups(): Promise<IntentionGroup[]>;

  // Mettre à jour le level et predicate après LVL UP
  async updateAfterLevelUp(groupId: string, newLevel: number, newPredicate: string, reason: string, xpSpent: number): Promise<void>;
}
```

### 2. Intégration XP dans useQuestSystem (MODIFICATION)
**Fichier**: `extension/hooks/useQuestSystem.ts`

**IMPORTANT**: Il n'y a qu'UN SEUL POOL d'XP total. Le système existant calcule déjà:
- Quest XP (via `claimed_quests`)
- Discovery XP (via `claimed_discovery_xp`)

On doit AJOUTER deux nouvelles clés dans `chrome.storage.local`:
- `group_certification_xp`: XP gagné via certifications dans Echoes Tab (+10/cert)
- `spent_xp`: XP dépensé via LVL UP

**Modifications à useQuestSystem.ts**:

```typescript
// AJOUTER ces states (même pattern que claimedDiscoveryXP ligne ~205)
const [groupCertificationXP, setGroupCertificationXP] = useState(0);
const [spentXP, setSpentXP] = useState(0);

// AJOUTER dans useEffect de loadQuestStates (~line 208)
useEffect(() => {
  const loadEchoesXP = async () => {
    const result = await chrome.storage.local.get(['group_certification_xp', 'spent_xp']);
    setGroupCertificationXP(result.group_certification_xp || 0);
    setSpentXP(result.spent_xp || 0);
  };
  loadEchoesXP();

  // Écouter les changements
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes.group_certification_xp) {
      setGroupCertificationXP(changes.group_certification_xp.newValue || 0);
    }
    if (changes.spent_xp) {
      setSpentXP(changes.spent_xp.newValue || 0);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}, []);

// MODIFIER le calcul de totalXP (~line 992)
const totalXP = useMemo(() => {
  const questXP = quests
    .filter(quest => claimedQuestIds.has(quest.id))
    .reduce((sum, quest) => sum + quest.xpReward, 0);
  // UN SEUL POOL: tout additionné, moins ce qui est dépensé
  return questXP + claimedDiscoveryXP + groupCertificationXP - spentXP;
}, [quests, claimedQuestIds, claimedDiscoveryXP, groupCertificationXP, spentXP]);

// AJOUTER ces fonctions pour Echoes Tab
const addGroupCertificationXP = async (amount: number): Promise<number> => {
  const newTotal = groupCertificationXP + amount;
  await chrome.storage.local.set({ group_certification_xp: newTotal });
  return newTotal;
};

const spendXPForLevelUp = async (amount: number): Promise<{ success: boolean }> => {
  // Vérifier si on peut se le permettre (totalXP calculé ci-dessus)
  if (amount > totalXP) {
    return { success: false };
  }
  const newSpent = spentXP + amount;
  await chrome.storage.local.set({ spent_xp: newSpent });
  return { success: true };
};

// RETOURNER les nouvelles fonctions
return {
  // ... existing returns
  addGroupCertificationXP,
  spendXPForLevelUp,
  groupCertificationXP,
  spentXP,
};
```

**Formule finale du XP disponible**:
```
totalXP = questXP + claimedDiscoveryXP + groupCertificationXP - spentXP
```

Où:
- `questXP` = somme des xpReward des quêtes claimed
- `claimedDiscoveryXP` = XP de Pioneer/Explorer/Contributor
- `groupCertificationXP` = +10 par certification dans Echoes Tab
- `spentXP` = XP dépensé pour LVL UP

### 3. LevelUpService (NOUVEAU)
**Fichier**: `extension/lib/services/LevelUpService.ts`

Responsabilité: Gérer le LVL UP avec coût XP et génération de predicate.

```typescript
class LevelUpService {

  // Appelé quand user clique "LVL UP"
  async levelUp(groupId: string): Promise<LevelUpResult> {
    const group = await groupManager.getGroup(groupId);

    // 1. Calculer le coût
    const cost = getLevelUpCost(group.level);

    // 2. Vérifier si user a assez de XP
    if (!xpService.canAfford(cost)) {
      return { success: false, error: 'Not enough XP', required: cost };
    }

    // 3. Collecter certifications des URLs
    const certifications = group.urls
      .filter(u => !u.removed && u.certification)
      .map(u => u.certification);

    // 4. Appeler l'IA pour générer le predicate (2-4 mots)
    const newPredicate = await this.generatePredicate(group, certifications);

    // 5. Dépenser XP
    await xpService.spendXP(cost, `Level up ${group.domain} to level ${group.level + 1}`);

    // 6. Mettre à jour le groupe
    const newLevel = group.level + 1;
    await groupManager.updateAfterLevelUp(groupId, newLevel, newPredicate, reason, cost);

    return {
      success: true,
      previousLevel: group.level,
      newLevel,
      previousPredicate: group.currentPredicate,
      newPredicate,
      xpSpent: cost,
      newXPBalance: await xpService.getCurrentXP()
    };
  }

  // Générer predicate via PredicateAgent (Mastra)
  private async generatePredicate(
    group: IntentionGroup,
    certifications: string[]
  ): Promise<string>;
}

interface LevelUpResult {
  success: boolean;
  error?: string;
  required?: number;
  previousLevel?: number;
  newLevel?: number;
  previousPredicate?: string | null;
  newPredicate?: string;
  xpSpent?: number;
  newXPBalance?: UserXP;
}
```

### 4. PredicateAgent (Mastra) - AGENT DÉDIÉ
**Fichier**: `sofia-mastra/src/mastra/agents/predicate-agent.ts`

Responsabilité: UNIQUEMENT générer des predicates (2-4 mots).

```typescript
export const predicateAgent = new Agent({
  name: 'Predicate Agent',
  instructions: `
You generate SHORT predicates (2-4 words MAXIMUM) for user intention triples.

## CONTEXT
The user is building a semantic triple about their browsing intentions:
- Subject: Always "I"
- Predicate: What YOU generate (2-4 words)
- Object: The group title/domain

## INPUT
You receive:
- Domain (e.g., "twitch.tv", "zircuit.com")
- Group title (usually = domain)
- Current level (1, 2, 3...)
- Certifications breakdown: { learning: 3, work: 1, fun: 2 }
- Previous predicate (if any)

## OUTPUT
Return ONLY a JSON object:
{
  "predicate": "love",
  "reason": "Majority fun certifications, entertainment domain"
}

## RULES
1. Predicate MUST be 2-4 words MAXIMUM
2. Use simple, natural verbs
3. **COMBINE certification + domain + level** to generate unique predicates:

### MATRIX: Certification × Domain Context

| Certification | Entertainment (twitch, youtube) | Dev/Tech (github, stackoverflow) | Commerce (amazon, ebay) | Education (coursera, udemy) | Social (twitter, reddit) |
|---------------|--------------------------------|----------------------------------|-------------------------|-----------------------------|--------------------------|
| **learning**  | "discover", "explore"          | "learn to code"                  | "research products"     | "study", "master"           | "follow trends on"       |
| **fun**       | "enjoy watching"               | "play with", "hack on"           | "browse"                | "enjoy learning on"         | "vibe on", "scroll"      |
| **work**      | "use for work"                 | "build with"                     | "source from"           | "upskill on"                | "network on"             |
| **buying**    | "support creators on"          | "invest in tools on"             | "shop on"               | "invest in courses on"      | "find deals on"          |
| **inspiration** | "get inspired by"            | "admire projects on"             | "get ideas from"        | "aspire to learn"           | "follow creators on"     |

### MATRIX: Level × Certification Intensity (10 niveaux)

**Philosophie**: Les predicates doivent rester HONNÊTES et RAISONNABLES. Visiter des sites et certifier des URLs ne fait pas de quelqu'un un expert ou une autorité. Les predicates reflètent l'**engagement** et l'**intérêt**, pas la compétence réelle.

| Level | Learning | Fun | Work | Buying | Inspiration |
|-------|----------|-----|------|--------|-------------|
| **2** (curious) | "explore" | "like" | "try" | "browse" | "notice" |
| **3** (interested) | "discover" | "enjoy" | "use" | "consider" | "follow" |
| **4** (engaged) | "study" | "love" | "rely on" | "shop at" | "admire" |
| **5** (regular) | "often visit" | "regularly enjoy" | "work with" | "often buy from" | "appreciate" |
| **6** (frequent) | "keep learning from" | "really enjoy" | "depend on" | "frequently shop at" | "get inspired by" |
| **7** (dedicated) | "dive deep into" | "adore" | "heavily use" | "collect from" | "am drawn to" |
| **8** (passionate) | "am passionate about" | "am fan of" | "am devoted user of" | "am regular at" | "consistently follow" |
| **9** (committed) | "am committed to learning" | "am big fan of" | "am power user of" | "am loyal to" | "am advocate for" |
| **10** (devoted) | "am devoted to" | "am huge fan of" | "am heavy user of" | "am collector at" | "am enthusiast of" |

### SPECIAL COMBINATIONS (domain-specific)
- **Twitch + fun + high level**: "am devoted to", "stan"
- **GitHub + learning + high level**: "contribute to", "maintain projects on"
- **Amazon + buying + high level**: "curate collections from"
- **YouTube + fun + learning mix**: "learn and enjoy on"
- **Twitter + inspiration + work mix**: "network and get inspired by"

### BLENDED CERTIFICATIONS (when no clear majority)
- **learning + work**: "upskill with", "professionally develop on"
- **fun + learning**: "enjoy learning on", "edutain with"
- **fun + inspiration**: "vibe with", "find joy in"
- **buying + inspiration**: "discover and collect from"
- **work + buying**: "source tools from", "professionally invest in"

## EXAMPLES (cohérents avec la matrice)

Input: { domain: "twitch.tv", certifications: { fun: 4, work: 1 }, level: 2 }
Output: { "predicate": "like", "reason": "Fun majority on entertainment platform, level 2 = curious" }

Input: { domain: "twitch.tv", certifications: { fun: 4, work: 1 }, level: 4 }
Output: { "predicate": "love", "reason": "Fun majority on entertainment platform, level 4 = engaged" }

Input: { domain: "zircuit.com", certifications: { learning: 3, work: 2 }, level: 3 }
Output: { "predicate": "discover", "reason": "Learning focus, level 3 = interested" }

Input: { domain: "react.dev", certifications: { learning: 5 }, level: 4 }
Output: { "predicate": "study", "reason": "Pure learning, level 4 = engaged" }

Input: { domain: "react.dev", certifications: { learning: 5 }, level: 7 }
Output: { "predicate": "dive deep into", "reason": "Pure learning, level 7 = dedicated" }
`,
  model: gaianet.chatModel(GAIANET_DEFAULT_MODEL),
});
```

---

## Modification IndexedDB

### Nouveau Store: INTENTION_GROUPS

```typescript
// indexedDB.ts - Augmenter DB_VERSION
const DB_VERSION = 7  // Incrémenté pour ajouter INTENTION_GROUPS et USER_XP

export const STORES = {
  // ... existing stores
  INTENTION_GROUPS: 'intention_groups',
  USER_XP: 'user_xp',  // Store pour XP global
}

// Dans createObjectStores:
if (!db.objectStoreNames.contains(STORES.INTENTION_GROUPS)) {
  const store = db.createObjectStore(STORES.INTENTION_GROUPS, { keyPath: 'id' });
  store.createIndex('domain', 'domain', { unique: true });
  store.createIndex('level', 'level', { unique: false });
  store.createIndex('createdAt', 'createdAt', { unique: false });
  store.createIndex('updatedAt', 'updatedAt', { unique: false });
}

if (!db.objectStoreNames.contains(STORES.USER_XP)) {
  db.createObjectStore(STORES.USER_XP, { keyPath: 'id' });
}
```

---

## Flux Détaillé

### 1. Navigation → Flush → Assignation (par DOMAINE)

**RÈGLE SIMPLE: 1 Domaine = 1 Groupe, Titre = Domaine**

Pas besoin d'IA pour la création de groupe!

```
User visite 15 pages
        │
        ▼
SessionTracker.trackUrl() × 15
        │
        ▼ (15 URLs atteintes)
SessionTracker.flush()
        │
        ▼
GroupManager.processFlush([urls])
        │
        │ Grouper par domaine (simple string match)
        │
        ├─── twitch.tv/aminematue ──► Groupe "twitch.tv" existe?
        │    twitch.tv/xxx              ├─ OUI → Ajouter les 2 URLs
        │                               └─ NON → Créer groupe (title = "twitch.tv")
        │
        ├─── zircuit.com/grants ───► Groupe "zircuit.com" existe?
        │    zircuit.com/explorer       └─ OUI → Ajouter les 2 URLs
        │
        └─── youtube.com/watch?v=xxx ──► Groupe "youtube.com" existe?
                                         └─ NON → Créer groupe (title = "youtube.com")
```

**AUCUNE IA dans ce flux! Titre = domaine, c'est tout.**

### 2. Certification → Gain XP

```
User certifie une URL dans groupe "twitch.tv":
        │
        ├─► Certification: "fun"
        │
        ├─► GroupManager.certifyUrl("twitch.tv", url, "fun")
        │
        ├─► XPService.addXP(10, "Certified URL in twitch.tv")
        │
        └─► User XP: 50 → 60 (+10)
```

### 3. LVL UP → Dépense XP → IA génère Predicate

```
User clique "LVL UP" sur groupe "twitch.tv" (level 1)
        │
        ├─► 1. Calculer coût: getLevelUpCost(1) = 30 XP
        │
        ├─► 2. Vérifier XP: user a 50 XP? OUI
        │
        ├─► 3. Collecter certifications: {fun: 4, work: 1}
        │
        ├─► 4. Appeler PredicateAgent (Mastra):
        │      Input: { domain: "twitch.tv", certifications, level: 1 }
        │      Output: { predicate: "love", reason: "Fun majority" }
        │
        ├─► 5. Dépenser XP: 50 → 20 (-30)
        │
        └─► 6. Mettre à jour groupe:
               level: 1 → 2
               predicate: null → "love"
```

### 4. Amplify → Publish Triple

```
User clique "Amplify" sur groupe "twitch.tv"
        │
        ▼
Triple publié on-chain:
{
  subject: "I",              ← TOUJOURS "I"
  predicate: "love",         ← Généré par IA (2-4 mots)
  object: "twitch.tv"        ← Titre du groupe (= domaine)
}

Résultat lisible: "I love twitch.tv"
```

---

## MCP Intuition

**Emplacement**: `/home/max/Project/sofia-core/core/intuition-mcp-server`

Le MCP Intuition peut être utilisé par LevelUpService pour:
- Récupérer les triples existants de l'utilisateur
- Vérifier les attestations on-chain
- Enrichir l'analyse des certifications

Pour l'instant, on peut implémenter LevelUpService SANS MCP (Phase 5.1), puis l'intégrer plus tard.

---

## Fichiers à Créer/Modifier

### Nouveaux Fichiers

| Fichier | Responsabilité |
|---------|----------------|
| `extension/lib/services/GroupManager.ts` | Gestion groupes persistants |
| `extension/lib/services/XPService.ts` | Système XP (gain/dépense) |
| `extension/lib/services/LevelUpService.ts` | LVL UP avec coût XP + IA |
| `sofia-mastra/src/mastra/agents/predicate-agent.ts` | Génération predicates (2-4 mots) |

### Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `extension/lib/database/indexedDB.ts` | Ajouter stores `INTENTION_GROUPS` et `USER_XP`, incrementer DB_VERSION |
| `extension/lib/services/SessionTracker.ts` | Appeler `GroupManager.processFlush()` après flush |
| `extension/background/mastraClient.ts` | Ajouter `generatePredicate()` |
| `sofia-mastra/src/mastra/index.ts` | Enregistrer `predicateAgent` |

### UI Echoes Tab (REFONTE COMPLÈTE)

> **⚠️ NOUVEAU**: L'UI Echoes Tab doit être refaite avec des **Bento Cards** (style Resonance Page) pour afficher les groupes de domaines.

#### Architecture UI à 2 niveaux

**Niveau 1: Liste des Groupes (Bento Grid)**
- Chaque groupe = 1 Bento Card
- Affichage en grille 2 colonnes (comme Resonance)
- Taille uniforme pour tous les groupes
- Image = OG image de la première URL du groupe (ou favicon agrandi en fallback)

**Niveau 2: Vue Détaillée Groupe (au clic sur une card)**
- Affiche toutes les URLs du groupe
- Pour chaque URL: statut de certification actuel ou bouton pour certifier
- Boutons d'action: LVL UP, Amplify

#### Structures UI

```typescript
// Vue principale: Liste des groupes
interface GroupCardProps {
  group: IntentionGroup;
  ogImage: string | null;        // OG image de la 1ère URL
  onClick: () => void;           // Ouvre vue détaillée
}

// Vue détaillée: URLs d'un groupe
interface GroupDetailViewProps {
  group: IntentionGroup;
  onCertify: (url: string, certification: string) => void;
  onRemoveUrl: (url: string) => void;
  onLevelUp: () => void;
  onAmplify: () => void;
  onBack: () => void;            // Retour à la liste
}

// État URL avec certification
interface UrlCertificationState {
  url: string;
  title: string;
  favicon?: string;
  ogImage?: string;
  certification: 'work' | 'learning' | 'fun' | 'inspiration' | 'buying' | null;
  certifiedAt?: number;
  canCertify: boolean;           // true si pas encore certifié
}
```

#### Composants à créer

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `EchoesGroupsGrid` | `extension/components/echoes/EchoesGroupsGrid.tsx` | Grille Bento des groupes |
| `GroupBentoCard` | `extension/components/echoes/GroupBentoCard.tsx` | Card Bento pour un groupe |
| `GroupDetailView` | `extension/components/echoes/GroupDetailView.tsx` | Vue détaillée avec URLs |
| `UrlCertificationRow` | `extension/components/echoes/UrlCertificationRow.tsx` | Ligne URL avec boutons certification |
| `CertificationSelector` | `extension/components/echoes/CertificationSelector.tsx` | Dropdown/chips pour choisir certification |

#### Hooks à créer

| Hook | Fichier | Description |
|------|---------|-------------|
| `useIntentionGroups` | `extension/hooks/useIntentionGroups.ts` | Charge les groupes depuis GroupManager |
| `useGroupOgImages` | `extension/hooks/useGroupOgImages.ts` | Récupère OG images pour les groupes |
| `useGroupCertification` | `extension/hooks/useGroupCertification.ts` | Gère les certifications d'URLs |

#### Récupération OG Images pour les Groupes

**Réutiliser le système existant**:
- `StorageOgImage` pour le cache persistant
- `RecommendationService.getOgImage()` pour fetch les OG images
- Logique: prendre l'OG image de la **première URL non-removed** du groupe

```typescript
// Dans useGroupOgImages.ts
async function getGroupOgImage(group: IntentionGroup): Promise<string | null> {
  // Trouver la première URL valide
  const firstValidUrl = group.urls.find(u => !u.removed);
  if (!firstValidUrl) return null;

  // Vérifier le cache
  const cached = await StorageOgImage.load(firstValidUrl.url);
  if (cached) return cached;

  // Fetch et cache
  return await RecommendationService.getOgImage(firstValidUrl.url);
}
```

#### Flux UI

```
EchoesTab
    │
    ├─► [Vue: groupsGrid] ◄── État par défaut
    │       │
    │       │ Affiche grille Bento des groupes
    │       │ Chaque card montre:
    │       │   - OG image (ou favicon)
    │       │   - Domaine (titre)
    │       │   - Level badge
    │       │   - Nb URLs / Nb certifiées
    │       │
    │       │ Clic sur une card
    │       ▼
    │
    └─► [Vue: groupDetail]
            │
            │ Affiche:
            │   - Header: domaine, level, predicate actuel
            │   - Liste URLs avec statut certification
            │   - Pour chaque URL:
            │     └─ Si non certifiée: boutons [work] [learning] [fun] [inspiration] [buying]
            │     └─ Si certifiée: badge avec la certification + timestamp
            │   - Footer: boutons [LVL UP (coût XP)] [Amplify]
            │
            │ Actions:
            │   - Certifier URL → +10 XP
            │   - LVL UP → dépense XP, génère predicate
            │   - Amplify → publie triple on-chain
            │   - Bouton retour → revient à groupsGrid
```

#### Styles CSS (réutiliser/adapter de Resonance)

```css
/* Grille Bento pour les groupes - dans CommonPage.css ou nouveau fichier */
.echoes-bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 20px 0;
}

.group-bento-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  aspect-ratio: 1;  /* Cards carrées */
}

.group-bento-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.group-bento-card .card-image {
  width: 100%;
  height: 60%;
  object-fit: cover;
  background: rgba(0, 0, 0, 0.3);
}

.group-bento-card .card-content {
  padding: 12px;
  height: 40%;
}

.group-bento-card .domain-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.group-bento-card .level-badge {
  background: var(--color-primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.group-bento-card .stats {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
```

#### Connexion aux Services

| UI Action | Service Call | Effet |
|-----------|--------------|-------|
| Charger groupes | `GroupManager.getAllGroups()` | Affiche grille |
| Clic card | Navigation locale | Ouvre détail |
| Certifier URL | `GroupManager.certifyUrl()` | +10 XP via `chrome.storage.local` |
| Supprimer URL | `GroupManager.removeUrl()` | URL marquée removed |
| LVL UP | `LevelUpService.levelUp()` | Dépense XP + génère predicate |
| Amplify | Publication existante | Triple on-chain |

---

## Ordre d'Implémentation (Incrémental avec Tests)

### Phase 1: Fondations (sans IA, sans UI)
**Objectif**: Avoir le stockage et l'accumulation qui fonctionnent

#### Étape 1.1: IndexedDB Store
**Modifier**: `indexedDB.ts` - Ajouter stores `INTENTION_GROUPS` et `USER_XP`
**Test**:
```typescript
// Console du background script
await sofiaDB.put(STORES.INTENTION_GROUPS, {
  id: 'test.com',
  domain: 'test.com',
  title: 'test.com',
  level: 1,
  currentPredicate: null,
  urls: []
});
const result = await sofiaDB.get(STORES.INTENTION_GROUPS, 'test.com');
console.log(result); // Doit afficher le groupe
await sofiaDB.delete(STORES.INTENTION_GROUPS, 'test.com');

// Test USER_XP
await sofiaDB.put(STORES.USER_XP, { id: 'user', totalXP: 100, totalEarned: 100, totalSpent: 0 });
const xp = await sofiaDB.get(STORES.USER_XP, 'user');
console.log(xp); // Doit afficher XP
```
**Validation**: ✅ si CRUD fonctionne pour les deux stores

#### Étape 1.2: SessionTracker (simplifié)
**Créer**: `extension/lib/services/SessionTracker.ts`
**Test**:
```typescript
sessionTracker.trackUrl({ url: 'https://twitch.tv/test1', title: 'Test 1', duration: 5000 });
sessionTracker.trackUrl({ url: 'https://twitch.tv/test2', title: 'Test 2', duration: 3000 });
sessionTracker.trackUrl({ url: 'https://github.com/test', title: 'GitHub', duration: 2000 });

const clusters = await sessionTracker.flush();
console.log(clusters);
// Doit afficher 2 clusters: twitch.tv (2 urls) et github.com (1 url)
```
**Validation**: ✅ si buffer accumule et flush groupe par domaine

---

### Phase 2: GroupManager et XPService (sans IA)
**Objectif**: Groupes persistants + système XP fonctionnels

#### Étape 2.1: XPService
**Créer**: `extension/lib/services/XPService.ts`
**Test**:
```typescript
await xpService.init();
console.log(await xpService.getCurrentXP()); // { totalXP: 0, ... }

await xpService.addXP(10, 'Test certification');
console.log(await xpService.getCurrentXP()); // { totalXP: 10, totalEarned: 10 }

const result = await xpService.spendXP(5, 'Test spend');
console.log(result); // { success: true, newBalance: 5 }

const fail = await xpService.spendXP(100, 'Too much');
console.log(fail); // { success: false, ... }
```
**Validation**: ✅ si gain/dépense XP fonctionne

#### Étape 2.2: GroupManager basique
**Créer**: `extension/lib/services/GroupManager.ts`
**Test**:
```typescript
const clusters = [
  { domain: 'twitch.tv', urls: [{ url: 'https://twitch.tv/test', title: 'Test' }] }
];
await groupManager.processFlush(clusters);

const groups = await groupManager.getAllGroups();
console.log(groups); // 1 groupe créé
console.log(groups[0].title); // "twitch.tv" (pas d'IA!)
console.log(groups[0].level); // 1
console.log(groups[0].currentPredicate); // null
```
**Validation**: ✅ si groupes persistent avec titre = domaine

#### Étape 2.3: Certification avec gain XP
**Test**:
```typescript
const xpBefore = await xpService.getCurrentXP();
await groupManager.certifyUrl('twitch.tv', 'https://twitch.tv/test', 'fun');
const xpAfter = await xpService.getCurrentXP();

console.log(xpAfter.totalXP - xpBefore.totalXP); // 10 (gain XP)

const group = await groupManager.getGroup('twitch.tv');
console.log(group.urls[0].certification); // 'fun'
```
**Validation**: ✅ si certification ajoute XP

---

### Phase 3: Message Handlers (pour UI)
**Objectif**: L'UI peut lire les groupes et interagir

#### Étape 3.1: Handlers de lecture
**Ajouter** dans messageHandlers.ts:
- `GET_INTENTION_GROUPS` → retourne tous les groupes
- `GET_GROUP_DETAILS` → retourne un groupe par ID
- `GET_USER_XP` → retourne XP actuel

**Test**: Via la console de l'extension popup
```typescript
const groups = await chrome.runtime.sendMessage({ type: 'GET_INTENTION_GROUPS' });
console.log(groups);

const xp = await chrome.runtime.sendMessage({ type: 'GET_USER_XP' });
console.log(xp);
```
**Validation**: ✅ si l'UI peut lire les groupes et XP

#### Étape 3.2: Handlers d'action
**Ajouter**:
- `CERTIFY_URL` → certifie une URL (+ gain XP)
- `REMOVE_URL_FROM_GROUP` → supprime une URL

**Test**:
```typescript
const result = await chrome.runtime.sendMessage({
  type: 'CERTIFY_URL',
  groupId: 'twitch.tv',
  url: 'https://twitch.tv/test',
  certification: 'fun'
});
console.log(result.xpGained); // 10
```
**Validation**: ✅ si certifications persistent et XP augmente

---

### Phase 3.5: UI Echoes Tab (Bento Cards)
**Objectif**: Afficher les groupes en Bento Grid + vue détaillée

#### Étape 3.5.1: Composants de base
**Créer**:
- `extension/components/echoes/EchoesGroupsGrid.tsx`
- `extension/components/echoes/GroupBentoCard.tsx`

**Test**: Afficher une grille statique avec données mockées
```typescript
// Dans EchoesTab.tsx temporairement
const mockGroups = [
  { id: 'twitch.tv', domain: 'twitch.tv', level: 2, urls: [{...}], currentPredicate: 'love' },
  { id: 'github.com', domain: 'github.com', level: 1, urls: [{...}], currentPredicate: null }
];
return <EchoesGroupsGrid groups={mockGroups} />;
```
**Validation**: ✅ si grille 2 colonnes s'affiche correctement

#### Étape 3.5.2: Hook useIntentionGroups
**Créer**: `extension/hooks/useIntentionGroups.ts`
**Test**:
```typescript
const { groups, loading, error, refetch } = useIntentionGroups();
console.log(groups); // Groupes depuis GroupManager
```
**Validation**: ✅ si les vrais groupes s'affichent

#### Étape 3.5.3: OG Images pour groupes
**Créer**: `extension/hooks/useGroupOgImages.ts`
**Réutilise**: `StorageOgImage` et `RecommendationService.getOgImage()`
**Test**:
```typescript
const ogImages = useGroupOgImages(groups);
// ogImages = Map<groupId, ogImageUrl | null>
```
**Validation**: ✅ si les cards affichent les OG images

#### Étape 3.5.4: Vue détaillée groupe
**Créer**:
- `extension/components/echoes/GroupDetailView.tsx`
- `extension/components/echoes/UrlCertificationRow.tsx`
- `extension/components/echoes/CertificationSelector.tsx`

**Test**: Cliquer sur une card → vue détail s'affiche avec URLs
**Validation**: ✅ si navigation entre grille et détail fonctionne

#### Étape 3.5.5: Actions certification
**Connecter**: `onCertify` → `CERTIFY_URL` handler
**Test**:
```typescript
// Cliquer sur [fun] pour une URL non certifiée
// → URL passe en "certifiée: fun"
// → XP augmente de 10
// → Boutons disparaissent, badge "fun" s'affiche
```
**Validation**: ✅ si certification fonctionne end-to-end

---

### Phase 4: PredicateAgent (Mastra)
**Objectif**: Génération de predicates (2-4 mots)

#### Étape 4.1: predicate-agent
**Créer**: `sofia-mastra/src/mastra/agents/predicate-agent.ts`
**Enregistrer** dans `sofia-mastra/src/mastra/index.ts`
**Test**: Via curl sur l'API Mastra
```bash
curl -X POST http://localhost:4111/api/agents/predicateAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"{\"domain\":\"twitch.tv\",\"certifications\":{\"fun\":4,\"work\":1},\"level\":2}"}]}'
```
**Validation**: ✅ si l'agent retourne un predicate de 2-4 mots

#### Étape 4.2: generatePredicate() dans mastraClient
**Ajouter**: fonction `generatePredicate()` dans mastraClient.ts
**Test**:
```typescript
const predicate = await generatePredicate({
  domain: 'twitch.tv',
  certifications: { fun: 4, work: 1 },
  level: 2
});
console.log(predicate); // "love" ou similaire
```
**Validation**: ✅ si l'appel depuis extension fonctionne

---

### Phase 5: LevelUp Service
**Objectif**: LVL UP avec coût XP progressif + predicate IA

#### Étape 5.1: LevelUpService
**Créer**: `extension/lib/services/LevelUpService.ts`
**Test**:
```typescript
// Setup: certifier 3 URLs pour avoir 30 XP (minimum pour premier LVL UP)
await groupManager.certifyUrl('twitch.tv', 'url1', 'fun');  // +10 XP
await groupManager.certifyUrl('twitch.tv', 'url2', 'fun');  // +10 XP
await groupManager.certifyUrl('twitch.tv', 'url3', 'fun');  // +10 XP
// Total: 30 XP

// Level up (coût: 30 XP pour level 1 → 2)
const result = await levelUpService.levelUp('twitch.tv');
console.log(result);
// {
//   success: true,
//   previousLevel: 1,
//   newLevel: 2,
//   previousPredicate: null,
//   newPredicate: "love",
//   xpSpent: 30
// }

const group = await groupManager.getGroup('twitch.tv');
console.log(group.level); // 2
console.log(group.currentPredicate); // "love"

// Vérifier XP a été dépensé
const xp = await xpService.getCurrentXP();
console.log(xp.totalSpent); // 30
```
**Validation**: ✅ si LVL UP fonctionne avec coût progressif

#### Étape 5.2: Handler LEVEL_UP_GROUP
**Ajouter** dans messageHandlers.ts
**Test** via UI:
```typescript
const result = await chrome.runtime.sendMessage({ type: 'LEVEL_UP_GROUP', groupId: 'twitch.tv' });
console.log(result);
```
**Validation**: ✅ si le bouton LVL UP fonctionne depuis l'UI

---

### Phase 6: Amplify (Publication on-chain)
**Objectif**: Publier le triple final

#### Étape 6.1: Handler AMPLIFY_GROUP
**Réutiliser**: Logique de publication existante
**Structure triple**:
```typescript
{
  subject: "I",
  predicate: group.currentPredicate,  // "love"
  object: group.title                  // "twitch.tv"
}
```
**Test**: Cliquer Amplify sur un groupe
**Validation**: ✅ si triple publié on-chain avec la bonne structure

---

### Phase 7: Nettoyage Dead Code
**Seulement après que tout fonctionne**
- Supprimer intentionRanking.ts
- Supprimer sofia-agent.ts (remplacé par predicate-agent.ts)
- Supprimer buffer.ts
- Supprimer behavior.ts
- Nettoyer imports

---

## Vérification Finale

### Création de Groupe
1. Visiter 5 pages twitch.tv → flush → vérifier groupe créé avec titre = "twitch.tv"
2. Visiter 3 nouvelles pages twitch.tv → vérifier URLs ajoutées au groupe existant

### Certification et XP
3. Certifier 3 URLs → vérifier XP augmente de 30
4. Cliquer bouton X sur une URL → vérifier `removed: true`

### LVL UP
5. Vérifier coût LVL UP affiché (30 XP pour level 1)
6. Cliquer "LVL UP" → vérifier:
   - XP déduit (30)
   - Level augmenté (1 → 2)
   - Predicate généré par IA (2-4 mots)
7. Vérifier `predicateHistory` contient l'évolution

### Amplify
8. Cliquer "Amplify" → vérifier triple publié:
   - Subject: "I"
   - Predicate: le predicate généré
   - Object: le titre du groupe

---

## Ce qui Change vs Ancien Système

| Aspect | Ancien Système | Nouveau Système |
|--------|----------------|-----------------|
| Groupes | Temporaires (reset après flush) | Persistants |
| Titre | Généré par IA | = Domaine (pas d'IA) |
| Subject du Triple | "User (0x...)" | "I" |
| Predicate | Fixe ou long | 2-4 mots, généré par IA |
| Certification | Pas de système | work/learning/fun/inspiration/buying |
| XP | N'existe pas | Gagner: +10/certification, Dépenser: LVL UP |
| LVL UP | N'existe pas | Coût progressif accessible (30 → 50 → 75 → 100 plafonné) |
| Rôle IA | Titres + predicates | Predicates UNIQUEMENT |

---

## Analyse Dead Code: Fichiers à Supprimer/Modifier

### Fichiers à SUPPRIMER (Dead Code Complet)

| Fichier | Lignes | Raison |
|---------|--------|--------|
| `extension/background/intentionRanking.ts` | ~400 | Remplacé par GroupManager + LevelUpService |
| `sofia-mastra/src/mastra/agents/sofia-agent.ts` | ~33 | Remplacé par predicate-agent.ts |
| `extension/background/utils/buffer.ts` | ~20 | `sendToAgent()` obsolète |
| `extension/background/behavior.ts` | ~35 | Scroll tracking non utilisé |

### Fichiers à MODIFIER

| Fichier | Modifications |
|---------|---------------|
| `extension/lib/database/indexedDB.ts` | Ajouter stores `INTENTION_GROUPS` et `USER_XP`, DB_VERSION = 7 |
| `extension/lib/services/PageDataService.ts` | Remplacer `handlePageDataInline()` par appel à `sessionTracker.trackUrl()` |
| `extension/background/messageHandlers.ts` | Retirer handlers obsolètes, ajouter nouveaux handlers |
| `extension/background/index.ts` | Retirer `loadDomainIntentions()`, initialiser `GroupManager` et `XPService` |
| `extension/background/mastraClient.ts` | Retirer `sendSofiaToMastra()`, ajouter `generatePredicate()` |
| `sofia-mastra/src/mastra/index.ts` | Retirer `sofiaAgent`, ajouter `predicateAgent` |

### Nouveaux Message Handlers

| Message Type | Description |
|--------------|-------------|
| `GET_INTENTION_GROUPS` | Retourne tous les groupes |
| `GET_GROUP_DETAILS` | Retourne détails d'un groupe par ID |
| `GET_USER_XP` | Retourne XP actuel de l'utilisateur |
| `CERTIFY_URL` | Certifie une URL (+ gain XP) |
| `REMOVE_URL_FROM_GROUP` | Supprime URL d'un groupe |
| `LEVEL_UP_GROUP` | Déclenche LVL UP (coût XP + génération predicate) |
| `AMPLIFY_GROUP` | Publie le triple on-chain |

### Handlers à Supprimer

| Message Type | Raison |
|--------------|--------|
| `GET_INTENTION_RANKING` | Remplacé par `GET_INTENTION_GROUPS` |
| `GET_DOMAIN_INTENTIONS` | Obsolète |
| `RECORD_PREDICATE` | Remplacé par `CERTIFY_URL` |
| `GET_UPGRADE_SUGGESTIONS` | Obsolète |
| `GET_PAGE_ATTENTION` | Obsolète |