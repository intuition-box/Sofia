# 📊 Guide Step-by-Step: Test de Workload SofIA (24h)

Ce guide vous explique comment mesurer le workload de votre agent SofIA pour 1 utilisateur sur 24h, puis calculer les besoins pour 20/50/100 utilisateurs.

---

## 🎯 Objectif

Collecter des données réelles pour créer un rapport technique à envoyer à Gaianet (votre provider LLM) afin qu'ils débloquent la puissance nécessaire.

---

## 📋 Prérequis

- [ ] Compte Dash0 créé (https://app.dash0.com)
- [ ] Token Dash0 récupéré
- [ ] Agent SofIA installé avec OpenTelemetry
- [ ] Extension Chrome installée

---

## 📅 PHASE 1: PRÉPARATION (15 minutes)

### Étape 1.1: Configurer Dash0

1. **Créez un compte sur Dash0**:
   - Allez sur https://app.dash0.com
   - Créez un compte gratuit

2. **Récupérez votre token**:
   - Une fois connecté, allez dans **Settings** → **API Tokens**
   - Cliquez sur **Create Token**
   - Nom: `sofia-agent-monitoring`
   - Permissions: Cochez `Ingestion` (pour envoyer des données)
   - Cliquez **Create**
   - **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après!)

### Étape 1.2: Configurer l'agent

1. **Créez le fichier `.env`** dans `agent-sofia/`:

```bash
cd agent-sofia
cp .env.example .env
```

2. **Éditez `.env`** et ajoutez votre token Dash0:

```bash
# Gaianet (vos configs existantes)
GAIANET_API_KEY=votre-key-gaianet
GAIANET_NODE_URL=https://votre-node.gaia.domains
GAIANET_TEXT_MODEL_SMALL=llama
GAIANET_TEXT_MODEL_LARGE=llama
GAIANET_EMBEDDINGS_MODEL=nomic-embed-text-v1.5

# Dash0 (nouvelles configs)
DASH0_AUTH_TOKEN=votre-token-dash0-ici  # ← COLLEZ VOTRE TOKEN ICI
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingress.dash0.com
OTEL_SERVICE_NAME=sofia-agent
OTEL_SERVICE_VERSION=0.1.0
NODE_ENV=production

# Pour debug (optionnel)
DASH0_DEBUG=true
OTEL_LOG_LEVEL=info
```

3. **Sauvegardez le fichier**

### Étape 1.3: Vérifier l'installation

```bash
# Dans agent-sofia/
bun run build
elizaos start
```

**Vous devriez voir dans les logs**:
```
[OpenTelemetry] SDK started with config: { serviceName: 'sofia-agent', ... }
```

Si vous voyez cette ligne, **OpenTelemetry est actif** ✅

---

## 🚀 PHASE 2: LANCER LE TEST (24 heures)

### Étape 2.1: Démarrer l'agent

```bash
cd agent-sofia
elizaos start
```

Laissez le terminal ouvert. L'agent va tourner pendant 24h.

### Étape 2.2: Utiliser l'extension normalement

**IMPORTANT**: Utilisez l'extension comme vous le feriez normalement pendant une journée complète.

**Activités recommandées**:
- ✅ Naviguez sur différents sites (tech, news, social media, etc.)
- ✅ Restez ~5-10 min sur des pages intéressantes
- ✅ Utilisez le chatbot pour poser des questions
- ✅ Créez des bookmarks
- ✅ Revenez plusieurs fois sur les mêmes sites

**Ce qui est mesuré automatiquement**:
- Nombre de messages WebSocket envoyés
- Requêtes LLM (Gaianet) effectuées
- Tokens utilisés (input + output)
- Temps de réponse des agents
- Erreurs éventuelles

### Étape 2.3: Vérifier que les données sont envoyées

**Après 5-10 minutes d'utilisation**:

1. Allez sur https://app.dash0.com
2. Cliquez sur **Services** dans le menu
3. Vous devriez voir apparaître: `sofia-agent`
4. Cliquez dessus

**Si vous voyez des données** → ✅ Tout fonctionne!
**Si vous ne voyez rien** → Vérifiez votre token dans `.env`

### Étape 2.4: Profil d'utilisation sur 24h

Pour un test réaliste, voici un exemple de profil d'utilisation:

| Heure | Activité | Durée |
|-------|----------|-------|
| 9h-12h | Navigation active (travail/études) | 3h |
| 12h-14h | Pause (peu d'activité) | 2h |
| 14h-18h | Navigation active | 4h |
| 18h-22h | Navigation légère (loisirs) | 4h |
| 22h-9h | Inactif | 11h |

**Total actif**: ~11-13h d'utilisation sur 24h

---

## 📊 PHASE 3: COLLECTER LES MÉTRIQUES (10 minutes)

### Étape 3.1: Accéder à Dash0

Après 24h de test, allez sur https://app.dash0.com

### Étape 3.2: Naviguer vers les métriques

1. Cliquez sur **Metrics** dans le menu de gauche
2. En haut à droite, sélectionnez la période: **Last 24 hours**
3. Vous verrez des graphiques avec toutes les métriques

### Étape 3.3: Relever les chiffres

Vous devez noter **5 chiffres clés**:

#### 1. **Total Messages** (`sofia.messages.received`)
- Dans Metrics, cherchez: `sofia.messages.received`
- Regardez la valeur **total** (pas par seconde)
- Notez ce chiffre: `_______`

#### 2. **Total Requêtes LLM** (`sofia.llm.requests`)
- Cherchez: `sofia.llm.requests`
- Valeur total sur 24h
- Notez: `_______`

#### 3. **Total Input Tokens** (`sofia.llm.tokens.input`)
- Cherchez: `sofia.llm.tokens.input`
- Valeur total
- Notez: `_______`

#### 4. **Total Output Tokens** (`sofia.llm.tokens.output`)
- Cherchez: `sofia.llm.tokens.output`
- Valeur total
- Notez: `_______`

#### 5. **Temps de réponse moyen** (`sofia.message.processing.duration`)
- Cherchez: `sofia.message.processing.duration`
- Regardez la valeur **moyenne** (avg)
- Notez (en ms): `_______`

### Étape 3.4: Screenshot (optionnel mais recommandé)

Prenez des screenshots des graphiques Dash0 pour votre dossier Gaianet.

---

## 🧮 PHASE 4: CALCULER LES PROJECTIONS (5 minutes)

### Étape 4.1: Ouvrir le script

```bash
cd agent-sofia
code scripts/calculate-workload.ts
# ou
nano scripts/calculate-workload.ts
```

### Étape 4.2: Remplir vos données

Cherchez la section `MY_METRICS` (ligne ~20) et remplacez les `0` par vos chiffres:

```typescript
const MY_METRICS = {
  totalMessages: 0,        // ← Mettez votre chiffre Dash0
  totalLLMRequests: 0,     // ← Mettez votre chiffre Dash0
  totalInputTokens: 0,     // ← Mettez votre chiffre Dash0
  totalOutputTokens: 0,    // ← Mettez votre chiffre Dash0
  avgResponseTime: 0,      // ← Mettez votre chiffre Dash0
};
```

**Exemple avec des données réelles**:
```typescript
const MY_METRICS = {
  totalMessages: 450,
  totalLLMRequests: 380,
  totalInputTokens: 38000,
  totalOutputTokens: 57000,
  avgResponseTime: 850,
};
```

### Étape 4.3: Exécuter le script

```bash
bun run scripts/calculate-workload.ts
```

### Étape 4.4: Lire les résultats

Le script affiche:
- ✅ Vos données de base (1 user)
- ✅ Projections pour **20 utilisateurs**
- ✅ Projections pour **50 utilisateurs**
- ✅ Projections pour **100 utilisateurs**
- ✅ Nombre de GPUs nécessaires
- ✅ RAM/VRAM nécessaire

**Un fichier JSON est aussi créé**: `reports/workload-calculation.json`

---

## 📧 PHASE 5: PRÉPARER LE RAPPORT POUR GAIANET (10 minutes)

### Étape 5.1: Copier les résultats

Le script a affiché toutes les infos. Copiez les sections importantes:

```
📊 20 UTILISATEURS
   GPUs nécessaires:              X GPU(s)
   RAM estimée:                   Y GB
   Tokens/seconde:                Z

📊 50 UTILISATEURS
   ...

📊 100 UTILISATEURS
   ...
```

### Étape 5.2: Créer votre email/document pour Gaianet

**Template de message**:

```
Bonjour [Contact Gaianet],

Nous utilisons votre service Gaianet pour notre projet SofIA, un système
d'agents IA multi-agents pour l'analyse sémantique de données de navigation.

Nous avons réalisé des tests de charge sur 24h et souhaitons discuter
de nos besoins en infrastructure pour scaler à 20-100 utilisateurs.

DONNÉES DE BASE (1 utilisateur, 24h):
- Messages traités: XXX
- Requêtes LLM: XXX
- Tokens total: XXX (input: XXX, output: XXX)
- Temps de réponse moyen: XXX ms

PROJECTIONS:
[Coller les résultats du script]

BESOINS IMMÉDIATS (20 users):
- X GPU(s)
- Y GB RAM
- Z tokens/seconde
- Latence cible P95: <2000ms

Pouvez-vous nous confirmer:
1. La disponibilité de cette capacité
2. Les délais de mise en place
3. Les options de scaling (50-100 users)
4. Les tarifs associés

Merci,
[Votre nom]

PJ: workload-calculation.json (données complètes)
```

### Étape 5.3: Joindre le JSON

Attachez le fichier `reports/workload-calculation.json` à votre email.

---

## ✅ CHECKLIST FINALE

- [ ] Token Dash0 configuré dans `.env`
- [ ] Agent lancé avec OpenTelemetry actif
- [ ] Test de 24h effectué avec utilisation normale
- [ ] Métriques relevées depuis Dash0 dashboard
- [ ] Script calculate-workload.ts exécuté avec vos données
- [ ] Rapport JSON généré
- [ ] Email préparé pour Gaianet

---

## ❓ FAQ / TROUBLESHOOTING

### Q: Je ne vois pas de données dans Dash0 après 10 min

**A**: Vérifiez:
1. Votre token est correct dans `.env`
2. L'agent affiche `[OpenTelemetry] SDK started` au démarrage
3. Vous utilisez bien l'extension (pas juste l'agent qui tourne)

### Q: Les métriques custom (sofia.llm.tokens) n'apparaissent pas

**A**: Ces métriques nécessitent que vous instrumentiez le code du plugin Gaianet.
Pour l'instant, utilisez les métriques HTTP par défaut. Dash0 track automatiquement:
- `http.server.request.duration` (temps de réponse)
- `http.server.active_requests` (requêtes actives)

### Q: Le script affiche "0" partout

**A**: Vous avez oublié de remplir `MY_METRICS` avec vos données Dash0 réelles!

### Q: Dash0 est payant?

**A**: Dash0 a un plan gratuit suffisant pour vos tests (14 jours). Après les tests,
vous pouvez downgrade ou exporter vos données.

### Q: Puis-je tester sur moins de 24h?

**A**: Oui, mais changez `TEST_DURATION_HOURS` dans le script.
Minimum recommandé: 2-4h pour des données représentatives.

---

## 📞 SUPPORT

- Guide OpenTelemetry: `src/otel.ts`
- Métriques custom: `src/metrics.ts`
- Script de calcul: `scripts/calculate-workload.ts`
- Documentation Dash0: https://www.dash0.com/documentation

---

**Bonne chance avec vos tests! 🚀**
