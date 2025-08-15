# 🔄 SofIA Extension - Information Flow Architecture

> **Document technique** décrivant le flux d'information dans l'extension SofIA, de la capture des messages à la publication on-chain.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des données](#architecture-des-données)
3. [Flux principal](#flux-principal)
4. [Composants clés](#composants-clés)
5. [Hooks et services](#hooks-et-services)
6. [États des triplets](#états-des-triplets)
7. [Persistance et synchronisation](#persistance-et-synchronisation)
8. [Intégrations blockchain](#intégrations-blockchain)

---

## 🎯 Vue d'ensemble

L'extension SofIA suit un flux d'information **unidirectionnel** avec plusieurs étapes de traitement :

```
WebSocket → IndexedDB → Parsing → Blockchain Verification → Publication
     ↓          ↓         ↓              ↓                    ↓
   Messages   Storage  Triplets    Atom Creation        On-Chain Storage
```

### **Principe de base :**
- **Source unique de vérité** : IndexedDB
- **Séparation des responsabilités** : Chaque composant a un rôle précis
- **État persistant** : Les triplets survivent aux changements de tabs
- **Intégration blockchain** : Hooks spécialisés pour chaque opération

---

## 🏗️ Architecture des données

### **Types de données principaux :**

```typescript
// Message brut d'Eliza
interface Message {
  id: string
  content: { text: string }
  created_at: number
  // ... autres propriétés
}

// Triplet après parsing SofIA
interface EchoTriplet {
  id: string
  triplet: { subject: string, predicate: string, object: string }
  url: string
  description: string
  timestamp: number
  status: 'available' | 'checking' | 'ready' | 'published' | 'exists_on_chain'
  // Données blockchain (optionnelles)
  subjectVaultId?: string
  predicateVaultId?: string
  objectVaultId?: string
  tripleVaultId?: string
  txHash?: string
}
```

### **Structure de stockage IndexedDB :**

```
ELIZA_DATA Store:
├── message (type: 'message') - Messages bruts d'Eliza
├── parsed_message (type: 'parsed_message') - Messages parsés avec triplets
└── triplet (type: 'triplet') - États des triplets EchoesTab
```

---

## 🔄 Flux principal

### **1. CAPTURE** - WebSocket → IndexedDB
```
background/websocket.ts
         ↓
elizaDataService.storeMessage()
         ↓
IndexedDB ELIZA_DATA store
```

**Détail :**
- **Origine :** Agent Eliza via WebSocket
- **Action :** `elizaDataService.storeMessage(newMessage, messageId)`
- **Résultat :** Message stocké avec type `'message'`

---

### **2. CHARGEMENT** - IndexedDB → useElizaData
```
useElizaData hook (autoRefresh: true, interval: 5s)
         ↓
elizaDataService.getAllMessages()
         ↓
messages[], parsedMessages[], allMessages[]
```

**Détail :**
- **Trigger :** Auto-refresh toutes les 5 secondes
- **Hook :** `useElizaData({ autoRefresh: true, refreshInterval: 5000 })`
- **Résultat :** État React mis à jour avec nouveaux messages

---

### **3. PARSING** - EchoesTab traitement
```
EchoesTab.processRawMessages()
         ↓
parseSofiaMessage(message.content.text)
         ↓
EchoTriplet[] avec status: 'available'
```

**Détail :**
- **Parser :** `parseSofiaMessage()` extrait les triplets du texte
- **Création :** Nouveaux `EchoTriplet` en statut `'available'`
- **Préservation :** Triplets existants avec statuts avancés conservés

---

### **4. VÉRIFICATION** - Blockchain checks
```
EchoesTab.checkAndPrepareAllTriplets()
         ↓
useCheckExistingAtom.checkAndCreateAtom()
         ↓
EchoTriplet status: 'available' → 'checking' → 'ready'
```

**Détail :**
- **Trigger :** Bouton "Listen" sur triplets disponibles
- **Processus :** Créer/vérifier atoms Object nécessaires
- **Résultat :** Triplets prêts pour publication (`status: 'ready'`)

---

### **5. PUBLICATION** - On-chain creation
```
EchoesTab.publishTriplet()
         ↓
useCreateTripleOnChain.createTripleOnChain()
         ↓
EchoTriplet status: 'ready' → 'published'
```

**Détail :**
- **Trigger :** Bouton "Amplify" sur triplets ready
- **Processus :** Création complète User → Predicate → Object → Triple
- **Résultat :** Triplet publié avec données blockchain complètes

---

### **6. PERSISTANCE** - État sauvegardé
```
EchoesTab useEffect (debounce 500ms)
         ↓
elizaDataService.storeTripletStates()
         ↓
IndexedDB avec messageId: 'echoesTab_triplet_states'
```

**Détail :**
- **Trigger :** Changement d'état des triplets (debounced)
- **Sauvegarde :** États complets des triplets avec leurs status
- **Restauration :** Au rechargement de tab via `loadTripletStates()`

---

## 🧩 Composants clés

### **EchoesTab.tsx** - Orchestrateur principal
```typescript
// Responsabilités :
- ✅ Traitement des messages bruts → triplets
- ✅ Gestion des états de triplets (available → ready → published)
- ✅ Orchestration des hooks blockchain
- ✅ Persistance des états
- ✅ Interface utilisateur (Listen/Amplify)
```

### **SignalsTab.tsx** - Vue read-only (futur)
```typescript
// Responsabilités :
- ✅ Affichage des triplets Intuition API (quand disponible)
- ✅ Interface de consultation des données blockchain
- ⏳ Attente API Intuition pour données réelles
```

### **background/websocket.ts** - Point d'entrée
```typescript
// Responsabilités :
- ✅ Réception messages Eliza via WebSocket
- ✅ Stockage direct dans IndexedDB
- ✅ Pas de traitement métier (juste transit)
```

---

## 🔧 Hooks et services

### **Hooks de données :**

#### **useElizaData** - Gestionnaire principal IndexedDB
```typescript
// Fonctionnalités :
- ✅ CRUD messages Eliza
- ✅ Auto-refresh configurable
- ✅ Filtres par type de message
- ✅ Recherche dans le contenu
- ✅ Nettoyage des anciens messages
```

#### **useIntuitionTriplets** - Interface API future
```typescript
// État actuel : Minimal (attente API Intuition)
- ✅ Interface TypeScript complète
- ✅ Hook vide prêt pour intégration
- ⏳ Implémentation API Intuition à venir
```

---

### **Hooks blockchain :**

#### **useCheckExistingAtom** - Vérification/Création atoms
```typescript
// Processus :
1. Pin métadonnées IPFS (usePinThingMutation)
2. Hash IPFS URI → vérification contract
3. Si existe : retourner vaultId existant
4. Si n'existe pas : créer nouvel atom
```

#### **useCreateTripleOnChain** - Publication triplets complets
```typescript
// Processus :
1. Récupérer/créer User atom
2. Récupérer/créer Predicate atom  
3. Créer/vérifier Object atom (via useCheckExistingAtom)
4. Vérifier existence triplet (useCheckExistingTriple)
5. Si n'existe pas : créer triplet complet
```

#### **useCheckExistingTriple** - Vérification triplets existants
```typescript
// Processus :
1. Calculer hash du triplet (keccak256)
2. Vérifier dans contract Multivault
3. Retourner vaultId si existant
```

#### **useGetExistingAtoms** - Récupération atoms par IPFS
```typescript
// Processus :
1. Query Intuition GraphQL par IPFS URI
2. Récupérer vaultId depuis réponse API
3. Mapping User/Predicate atoms constants
```

---

### **Services de données :**

#### **elizaDataService** - API IndexedDB haut niveau
```typescript
// Méthodes principales :
- storeMessage() - Stockage messages bruts
- storeParsedMessage() - Messages avec triplets
- getAllMessages() - Récupération tous messages
- storeTripletStates() - Persistance états EchoesTab
- loadTripletStates() - Restauration états
- deleteOldMessages() - Nettoyage automatique
```

---

## 📊 États des triplets

### **Cycle de vie complet :**

```
available → checking → ready → published
    ↓         ↓         ↓        ↓
 Parsé    Vérifie   Prêt    Publié
```

#### **1. `available`** - Triplet extrait du message
- **Source :** Parsing réussi de message Eliza
- **Action utilisateur :** Bouton "Listen" disponible
- **Données :** Triplet basic + metadata

#### **2. `checking`** - Vérification en cours
- **Déclencheur :** Clic "Listen" → `checkAndPrepareAllTriplets()`
- **Processus :** Création atoms Object via blockchain
- **Interface :** Spinner + message de progression

#### **3. `ready`** - Prêt pour publication
- **Condition :** Atom Object créé/vérifié avec succès
- **Action utilisateur :** Bouton "Amplify" disponible  
- **Données :** + `objectVaultId`, `onChainStatus`

#### **4. `published`** - Publié on-chain
- **Déclencheur :** Clic "Amplify" → `publishTriplet()`
- **Processus :** Création triplet complet sur blockchain
- **Données :** + toutes les données blockchain (`txHash`, `tripleVaultId`, etc.)

#### **5. `exists_on_chain`** - Existait déjà (rare)
- **Condition :** Triplet identique trouvé lors de vérification
- **Comportement :** Même interface que `published`

---

## 💾 Persistance et synchronisation

### **Stratégie de persistance :**

#### **IndexedDB comme source de vérité**
```typescript
// Stores principaux :
ELIZA_DATA: {
  messages,          // Messages bruts Eliza
  parsed_messages,   // Messages avec triplets extraits
  triplet_states     // États EchoesTab (key: 'echoesTab_triplet_states')
}
```

#### **Synchronisation multi-niveaux :**

1. **WebSocket → IndexedDB** (temps réel)
   - Nouveaux messages stockés immédiatement
   - Pas de perte de données même si UI fermée

2. **IndexedDB → useElizaData** (auto-refresh 5s)
   - Polling léger pour nouveaux messages
   - État React synchronisé automatiquement

3. **EchoesTab states → IndexedDB** (debounced 500ms)
   - États triplets sauvegardés à chaque changement
   - Évite sauvegardes trop fréquentes

4. **Restauration états** (au montage composant)
   - `loadSavedStatesAndProcess()` au démarrage EchoesTab
   - Triplets retrouvent leur état exact (ready, published, etc.)

---

## ⛓️ Intégrations blockchain

### **Stack technique :**

```
Frontend (Extension)
         ↓
Hooks React (useCreate*, useCheck*)
         ↓  
Multivault SDK (@0xintuition/protocol)
         ↓
Viem Client (walletClient, publicClient)
         ↓
Base Sepolia Network
         ↓
Intuition Smart Contracts
```

### **Flux blockchain détaillé :**

#### **Création d'un triplet complet :**

1. **User Atom** (Subject)
   ```typescript
   // Constante prédéfinie ou création automatique
   USER_ATOM_IPFS_URI = "ipfs://bafkreiglob..."
   userAtom = await getUserAtom(USER_ATOM_IPFS_URI)
   ```

2. **Predicate Atom**
   ```typescript
   // Mapping prédéfini ou création automatique
   predicateIpfsUri = getPredicateIpfsUri("has visited")
   predicateAtom = await getPredicateAtom(predicateIpfsUri)
   ```

3. **Object Atom**
   ```typescript
   // Toujours créé/vérifié dynamiquement
   objectAtom = await checkAndCreateAtom({
     name: triplet.object,
     description: description,
     url: url
   })
   ```

4. **Triple Creation**
   ```typescript
   // Vérification existence puis création si nécessaire
   tripleExists = await checkTripleExists(user, predicate, object)
   if (!tripleExists) {
     triple = await multivault.createTriple({...})
   }
   ```

### **Gestion d'erreurs blockchain :**

- **Network issues** : Retry automatique (Viem)
- **Insufficient funds** : Erreur claire à l'utilisateur
- **Contract errors** : Log détaillé + fallback graceful
- **IPFS timeouts** : Retry avec exponential backoff

---

## 🔍 Points d'observation et debug

### **Console logs structurés :**

```typescript
// Format standardisé pour debug :
console.log('🔍 EchoesTab: Processing 5 raw messages')
console.log('✅ EchoesTab: Extracted 3 triplets from message msg_123')
console.log('💾 EchoesTab triplet states persisted: 8')
console.log('🔗 Starting triple creation on-chain...')
console.log('👤 User atom found, VaultID: 42')
console.log('❌ EchoesTab: Failed to parse message msg_456')
```

### **Métriques importantes à surveiller :**

- **Messages/sec** : Débit WebSocket
- **Parse success rate** : % messages Eliza parsés avec succès  
- **Blockchain success rate** : % triplets publiés sans erreur
- **Storage usage** : Taille IndexedDB
- **Response times** : Latence opérations blockchain

---

## 🚀 Évolutions futures

### **Intégrations prévues :**

1. **API Intuition** - SignalsTab fonctionnel
   ```typescript
   // useIntuitionTriplets sera connecté à l'API réelle
   const triplets = await fetchIntuitionTriplets(userAddress)
   ```

2. **Optimizations blockchain**
   - Batch creation pour économiser gas
   - Cache intelligent des atoms fréquents
   - Precomputed signatures pour UX rapide

3. **Analytics avancés**
   - Dashboard métriques temps réel
   - Historique d'activité détaillé
   - Insights sur patterns d'usage

---

## 🎯 Utilisation des hooks par composant

### **EchoesTab.tsx** - Orchestrateur principal

#### **Hooks utilisés :**

```typescript
// 1. DONNÉES - Lecture messages Eliza
const { 
  messages: rawMessages, 
  isLoading: isLoadingEliza, 
  refreshMessages 
} = useElizaData({ 
  autoRefresh: true, 
  refreshInterval: 5000 
})

// 2. BLOCKCHAIN - Publication triplets complets
const { 
  createTripleOnChain, 
  isCreating, 
  currentStep 
} = useCreateTripleOnChain()

// 3. BLOCKCHAIN - Vérification triplets existants  
const { 
  checkTripleExists 
} = useCheckExistingTriple()

// 4. BLOCKCHAIN - Création/vérification atoms
const { 
  checkAndCreateAtom 
} = useCheckExistingAtom()

// 5. BLOCKCHAIN - Récupération atoms par IPFS
const { 
  getAtomByIpfsUri 
} = useGetExistingAtoms()
```

#### **Flux d'utilisation dans EchoesTab :**

```typescript
// 1. CHARGEMENT INITIAL
useEffect(() => {
  loadSavedStatesAndProcess() // Utilise useElizaData en interne
}, [rawMessages])

// 2. TRAITEMENT MESSAGES → TRIPLETS
const processRawMessages = async (savedStates?) => {
  // Parse messages avec parseSofiaMessage()
  // Crée EchoTriplet[] avec status 'available'
}

// 3. VÉRIFICATION BLOCKCHAIN (Bouton "Listen")
const checkAndPrepareAllTriplets = async () => {
  for (triplet of availableTriplets) {
    // Utilise useCheckExistingAtom pour Object
    const objectAtom = await checkAndCreateAtom({
      name: triplet.object,
      description: triplet.description,
      url: triplet.url
    })
    // Status: 'available' → 'checking' → 'ready'
  }
}

// 4. PUBLICATION ON-CHAIN (Bouton "Amplify")  
const publishTriplet = async (tripletId) => {
  // Utilise useCreateTripleOnChain pour workflow complet
  const result = await createTripleOnChain(
    predicateName,
    objectData
  )
  // Status: 'ready' → 'published'
}
```

---

### **SignalsTab.tsx** - Vue consultation

#### **Hooks utilisés :**

```typescript
// 1. DONNÉES - Triplets Intuition (vide pour l'instant)
const { 
  triplets,      // [] - attente API Intuition 
  isLoading      // false
} = useIntuitionTriplets()
```

#### **Flux d'utilisation dans SignalsTab :**

```typescript
// 1. AFFICHAGE ÉTAT VIDE
// Comme triplets = [], affiche message d'attente API Intuition

// 2. FUTUR - AFFICHAGE TRIPLETS INTUITION
const publishedTriplets = triplets.sort((a, b) => b.timestamp - a.timestamp)

// 3. ACTIONS - Consultation seulement
const handleViewOnExplorer = (txHash, vaultId) => {
  // Ouverture explorer blockchain
  window.open(`https://sepolia.basescan.org/tx/${txHash}`)
}
```

---

### **AtomCreationModal.tsx** - Modal création atoms

#### **Hooks utilisés :**

```typescript
// 1. BLOCKCHAIN - Création/vérification atoms
const { 
  checkAndCreateAtom, 
  isChecking, 
  error 
} = useCheckExistingAtom()
```

#### **Flux d'utilisation dans AtomCreationModal :**

```typescript
// 1. SOUMISSION FORMULAIRE
const handleCreateAtom = async () => {
  setIsCreating(true)
  setCurrentStep('checking')
  
  // Utilise le hook pour workflow complet
  const result = await checkAndCreateAtom({
    name: name.trim(),
    description: description.trim(),
    url: url.trim()
  })
  
  // Affichage résultat (created/existing)
  setReceipt({
    vaultId: result.vaultId,
    txHash: result.txHash,
    source: result.source,
    ipfsUri: result.ipfsUri
  })
}
```

---

### **background/websocket.ts** - Point d'entrée messages

#### **Services utilisés :**

```typescript
// Pas de hooks React (contexte background)
// Utilise directement les services

import { elizaDataService } from '../lib/indexedDB-methods'

// STOCKAGE DIRECT MESSAGES
const handleNewMessage = async (message) => {
  await elizaDataService.storeMessage(newMessage, newMessage.id)
  console.log('💬 Message stored in IndexedDB')
}
```

---

## 🗂️ Hooks par catégorie d'usage

### **📊 HOOKS DE DONNÉES**

#### **useElizaData** - Gestionnaire principal IndexedDB
```typescript
// Pages utilisatrices : EchoesTab
// Responsabilité : CRUD messages + auto-refresh
// Pattern : Single source of truth pour données Eliza

const useElizaData = (options = {}) => {
  const {
    autoRefresh = false,      // Auto-polling nouveaux messages
    refreshInterval = 30000,  // Intervalle en ms  
    maxRecentMessages = 50,   // Limite messages récents
    enableSearch = true       // Recherche dans contenu
  } = options

  return {
    // État données
    messages,           // Messages bruts type='message'
    parsedMessages,     // Messages parsés type='parsed_message'  
    allMessages,        // Tous messages confondus
    recentMessages,     // N derniers messages
    
    // État chargement
    isLoading,          // Chargement initial
    isStoring,          // Sauvegarde en cours
    error,              // Erreur éventuelle
    
    // Actions CRUD
    storeMessage,       // Sauver message brut
    storeParsedMessage, // Sauver message parsé avec triplets
    refreshMessages,    // Recharger depuis IndexedDB
    clearAllMessages,   // Vider tous messages
    deleteOldMessages,  // Nettoyage automatique
    
    // Requêtes
    getMessagesByType,  // Filtrer par type
    searchMessages,     // Recherche textuelle
    getMessagesInRange  // Filtrer par date
  }
}
```

#### **useIntuitionTriplets** - Interface API future Intuition
```typescript
// Pages utilisatrices : SignalsTab
// Responsabilité : Données blockchain Intuition (en attente)
// Pattern : Hook minimal prêt pour intégration

const useIntuitionTriplets = () => {
  // État actuel : Vide en attente API
  const triplets = []
  const isLoading = false
  const error = null
  
  // Méthodes futures (stubbed)
  const refreshFromAPI = async () => {
    console.log('🔄 Intuition API not yet available')
  }
  
  const searchTriplets = (query) => []
  
  return {
    triplets,         // IntuitionTriplet[] - vide pour l'instant
    isLoading,        // Pas de chargement actuel
    error,            // Pas d'erreur
    refreshFromAPI,   // Future implémentation
    searchTriplets    // Future recherche
  }
}
```

---

### **⛓️ HOOKS BLOCKCHAIN**

#### **useCheckExistingAtom** - Vérification/Création atoms
```typescript
// Pages utilisatrices : EchoesTab, AtomCreationModal
// Responsabilité : Workflow atom IPFS + blockchain
// Pattern : Check-then-create avec cache

const useCheckExistingAtom = () => {
  const checkAndCreateAtom = async (atomData) => {
    // 1. Pin métadonnées sur IPFS
    const { uri } = await pinThing({
      name: atomData.name,
      description: atomData.description,
      image: atomData.image || "",
      url: atomData.url
    })
    
    // 2. Hash URI et vérification contract
    const uriHash = keccak256(stringToBytes(uri))
    const existingAtomId = await publicClient.readContract({
      address: multivault.address,
      functionName: 'atomsByHash',
      args: [uriHash]
    })
    
    // 3. Retour existing OU création nouveau
    if (existingAtomId > 0n) {
      return { exists: true, vaultId: existingAtomId.toString(), source: 'existing' }
    } else {
      const { vaultId, txHash } = await createAtomWithMultivault(atomData)
      return { exists: false, vaultId, txHash, source: 'created' }
    }
  }
  
  return { checkAndCreateAtom, isChecking, error }
}
```

#### **useCreateTripleOnChain** - Publication triplets complets  
```typescript
// Pages utilisatrices : EchoesTab
// Responsabilité : Workflow triplet User→Predicate→Object→Triple
// Pattern : Orchestrateur avec dépendances hooks

const useCreateTripleOnChain = () => {
  // Dépendances autres hooks
  const { getUserAtom, getPredicateAtom } = useGetExistingAtoms()
  const { checkAndCreateAtom } = useCheckExistingAtom()
  const { checkTripleExists } = useCheckExistingTriple()
  
  const createTripleOnChain = async (predicateName, objectData) => {
    // 1. User atom (constante ou création auto)
    const userAtom = await getUserAtom(USER_ATOM_IPFS_URI)
    
    // 2. Predicate atom (mapping ou création auto)
    const predicateAtom = await getPredicateAtom(predicateIpfsUri, predicateName)
    
    // 3. Object atom (toujours dynamique)
    const objectAtom = await checkAndCreateAtom(objectData)
    
    // 4. Vérification existence triplet
    const tripleCheck = await checkTripleExists(
      userAtom.vaultId, 
      predicateAtom.vaultId, 
      objectAtom.vaultId
    )
    
    // 5. Création triplet si n'existe pas
    if (!tripleCheck.exists) {
      const { vaultId, hash } = await multivault.createTriple({
        subjectId: BigInt(userAtom.vaultId),
        predicateId: BigInt(predicateAtom.vaultId),
        objectId: BigInt(objectAtom.vaultId),
        initialDeposit: tripleCost,
        wait: true
      })
      
      return {
        success: true,
        tripleVaultId: vaultId.toString(),
        txHash: hash,
        subjectVaultId: userAtom.vaultId,
        predicateVaultId: predicateAtom.vaultId,
        objectVaultId: objectAtom.vaultId,
        source: 'created'
      }
    }
  }
  
  return { createTripleOnChain, isCreating, currentStep, error }
}
```

#### **useCheckExistingTriple** - Vérification triplets existants
```typescript
// Pages utilisatrices : EchoesTab (via useCreateTripleOnChain)
// Responsabilité : Vérification existence triplet spécifique
// Pattern : Simple checker avec hash

const useCheckExistingTriple = () => {
  const checkTripleExists = async (subjectId, predicateId, objectId) => {
    // 1. Calcul hash triplet
    const tripleHash = keccak256(
      encodePacked(['uint256', 'uint256', 'uint256'], 
      [BigInt(subjectId), BigInt(predicateId), BigInt(objectId)])
    )
    
    // 2. Vérification dans contract
    const existingTripleId = await publicClient.readContract({
      address: multivault.address,
      functionName: 'triplesByHash',
      args: [tripleHash]
    })
    
    return {
      exists: existingTripleId > 0n,
      tripleVaultId: existingTripleId.toString(),
      tripleHash
    }
  }
  
  return { checkTripleExists }
}
```

#### **useGetExistingAtoms** - Récupération atoms par IPFS
```typescript
// Pages utilisatrices : EchoesTab (via useCreateTripleOnChain)
// Responsabilité : Récupération atoms prédéfinis (User, Predicates)
// Pattern : Query GraphQL + mapping constants

const useGetExistingAtoms = () => {
  // Récupération User atom (constante)
  const getUserAtom = async (ipfsUri) => {
    const { data } = await getExistingAtoms({
      where: { ipfsUri }
    })
    
    if (data?.atoms?.[0]) {
      return {
        vaultId: data.atoms[0].vaultId,
        ipfsUri: data.atoms[0].ipfsUri,
        name: 'User'
      }
    }
    throw new Error('User atom not found')
  }
  
  // Récupération Predicate atom (mapping)
  const getPredicateAtom = async (ipfsUri, predicateName) => {
    const { data } = await getExistingAtoms({
      where: { ipfsUri }
    })
    
    if (data?.atoms?.[0]) {
      return {
        vaultId: data.atoms[0].vaultId,
        ipfsUri: data.atoms[0].ipfsUri,
        name: predicateName
      }
    }
    throw new Error(`Predicate atom not found: ${predicateName}`)
  }
  
  return { getUserAtom, getPredicateAtom, getAtomByIpfsUri }
}
```

---

### **🛠️ HOOKS UTILITAIRES** 

#### **useUserSettings** - Configuration utilisateur
```typescript
// Pages utilisatrices : Settings, diverses
// Responsabilité : Gestion préférences utilisateur
// Pattern : CRUD settings avec IndexedDB

const useUserSettings = () => {
  const [settings, setSettings] = useState(defaultSettings)
  
  const updateSetting = async (key, value) => {
    await userSettingsService.updateSetting(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
  }
  
  return { settings, updateSetting, isLoading, error }
}
```

#### **useUserProfile** - Profil utilisateur
```typescript  
// Pages utilisatrices : Profile page
// Responsabilité : Gestion données profil
// Pattern : CRUD profil avec IndexedDB

const useUserProfile = () => {
  const [profile, setProfile] = useState(null)
  
  const updateBio = async (bio) => {
    await userProfileService.updateBio(bio)
    setProfile(prev => ({ ...prev, bio }))
  }
  
  return { profile, updateBio, updateProfilePhoto, isLoading }
}
```

---

## 🔄 Patterns d'interaction entre hooks

### **Pattern 1 : Composition dans EchoesTab**
```typescript
// EchoesTab orchestre plusieurs hooks blockchain
const EchoesTab = () => {
  // Hook principal données
  const { messages } = useElizaData({ autoRefresh: true })
  
  // Hooks blockchain utilisés dans workflow
  const { createTripleOnChain } = useCreateTripleOnChain()  // Utilise en interne :
  //   ↳ useGetExistingAtoms()
  //   ↳ useCheckExistingAtom()
  //   ↳ useCheckExistingTriple()
  
  // EchoesTab n'utilise que createTripleOnChain
  // La composition interne est transparente
}
```

### **Pattern 2 : Service direct dans Background**
```typescript
// background/websocket.ts utilise services directement
import { elizaDataService } from '../lib/indexedDB-methods'

// Pas de hooks React (contexte non-React)
const handleMessage = async (message) => {
  await elizaDataService.storeMessage(message)
}
```

### **Pattern 3 : Hook minimal d'attente**
```typescript
// SignalsTab utilise hook vide en attente API
const SignalsTab = () => {
  const { triplets } = useIntuitionTriplets() // Retourne []
  
  // Affiche message d'attente puisque triplets.length === 0
  return triplets.length === 0 ? <WaitingMessage /> : <TripletsList />
}
```

---

## 📚 Références techniques

### **Documentation liée :**
- [Multivault SDK](https://github.com/0xintuition/protocol)
- [Intuition Protocol](https://docs.intuition.systems/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Viem Documentation](https://viem.sh/)

### **Architecture files :**
- `extension/background/websocket.ts` - Point d'entrée messages
- `extension/lib/indexedDB-methods.ts` - Services données
- `extension/hooks/useElizaData.ts` - Hook principal données  
- `extension/components/pages/graph-tabs/EchoesTab.tsx` - Orchestrateur UI
- `extension/hooks/useCreateTripleOnChain.ts` - Publication blockchain

---

*Document maintenu à jour avec l'architecture actuelle de SofIA Extension v1.0*