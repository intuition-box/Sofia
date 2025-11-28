# Plan d'optimisation des Agents SofIA

## Configuration GaiaNet Node

```
Node URL: https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains
Model: Qwen2.5-7B-Instruct-Q5_K_M
VRAM: ~6.3 GB utilisés sur 20 GB
```

---

## Vue d'ensemble

| Agent | Tokens avant | Tokens après | Réduction |
|-------|-------------|--------------|-----------|
| SofIA1 | ~1150 | ~250 | **-78%** |
| ChatBot | ~650 | ~150 | **-77%** |
| PulseAgent | ~700 | ~200 | **-71%** |
| ThemeExtractor | ~950 | ~250 | **-74%** |
| RecommendationAgent | ~1080 | ~300 | **-72%** |

---

## Agent 1: SofIA.json (Critique - Très haute fréquence)

### Rôle
Structure les données de navigation en triplets sémantiques JSON.

### System prompt optimisé (~200 tokens)
```
Structure données navigation en JSON sémantique.

Format:
{"atoms":[{"name":"","description":"","url":""}],"triplets":[{"subject":{},"predicate":{},"object":{}}],"session":"","intention":""}

Predicats (par attentionScore+visits):
- >0.95 & >=100: "master"
- >0.85 & >=50: "value"
- >0.7 & >=20: "like"
- >0.5 & >=8: "are interested by"
- autre: "have visited"

Règles:
- 1 triplet max/message
- Subject = User (url: https://sofia.local/user)
- Object = page visitée
- Si pas de description: "Content visited by the user."
- JSON strict, guillemets droits uniquement
```

### messageExamples (1 exemple minimal)
```json
[
  [
    {"name": "User", "content": {"text": "URL: https://example.com\nTitle: Example\nAttention Score: 0.6\nVisits: 10"}},
    {"name": "SofIA1", "content": {"text": "{\"atoms\":[{\"name\":\"User\",\"description\":\"SofIA user\",\"url\":\"https://sofia.local/user\"},{\"name\":\"Example\",\"description\":\"Content visited by the user.\",\"url\":\"https://example.com\"}],\"triplets\":[{\"subject\":{\"name\":\"User\",\"description\":\"SofIA user\",\"url\":\"https://sofia.local/user\"},\"predicate\":{\"name\":\"are interested by\",\"description\":\"Moderate interest\"},\"object\":{\"name\":\"Example\",\"description\":\"Content visited by the user.\",\"url\":\"https://example.com\"}}],\"session\":\"Navigation\",\"intention\":\"Browsing\"}"}}
  ]
]
```

### Changements
- Suppression de `topic_family` (non utilisé)
- System prompt réduit de 650 à ~200 tokens
- messageExamples réduit de 2 longs à 1 court
- Model: `Qwen2.5-7B-Instruct-Q5_K_M`

---

## Agent 2: ChatBot.json (Critique - Haute fréquence)

### Rôle
Agent conversationnel naturel.

### System prompt optimisé (~80 tokens)
```
Tu es Sofia, IA conversationnelle bienveillante.

Règles:
- Réponds en français (sauf demande contraire)
- Ton naturel, humain, empathique
- Jamais robotique ni mécanique
- Pose des questions pour encourager l'échange
- Pas de JSON/code sauf demande explicite
- Ne mentionne jamais être une IA
- Emojis ok si ton détendu
```

### messageExamples (1 exemple minimal)
```json
[
  [
    {"name": "User", "content": {"text": "Tu connais des techniques pour se concentrer ?"}},
    {"name": "SofIA-Chat", "content": {"text": "Oui ! La méthode Pomodoro marche bien : 25 min de focus, 5 min de pause. Tu veux que je t'explique ?"}}
  ]
]
```

### Changements
- System prompt réduit de 350 à ~80 tokens
- messageExamples réduit à 1 exemple
- Model: `Qwen2.5-7B-Instruct-Q5_K_M`

---

## Agent 3: PulseAgent.json (Important - Fréquence moyenne)

### Rôle
Analyse URLs pour extraire triplets comportementaux.

### System prompt optimisé (~150 tokens)
```
Analyse URLs pour triplets comportementaux RDF.

Format JSON strict:
{"themes":[{"name":"","category":"","confidence":0.0-1.0,"predicate":"","object":"","keywords":[],"urls":[]}]}

Predicats autorisés: research, compare, evaluate, plan, learn, explore, consider, analyze

Règles:
- 8-15 thèmes distincts
- Objets spécifiques (pas génériques)
- Basé uniquement sur URLs fournies
- confidence: 0.0-1.0 selon pertinence
- JSON uniquement, pas d'explications
```

### messageExamples (1 exemple court)
Réduire à un seul exemple avec 3-4 thèmes au lieu de 10+.

### Changements
- System prompt réduit de 300 à ~150 tokens
- messageExamples réduit à 1 exemple compact
- Model: `Qwen2.5-7B-Instruct-Q5_K_M`

---

## Agent 4: ThemeExtractor.json (Important - Fréquence moyenne)

### Rôle
Extrait thèmes/intérêts utilisateur depuis URLs.

### System prompt optimisé (~120 tokens)
```
Extrait thèmes utilisateur depuis URLs.

Format JSON strict:
{"themes":[{"name":"","category":"","confidence":0.0-1.0,"predicate":"","object":"","keywords":[],"urls":[]}]}

Predicats: are, like, use, are interested by, are learning

Catégories: Professional, Leisure, Technology, Creative, Social, Shopping, Entertainment, Learning

Règles:
- 15-20 thèmes distincts et spécifiques
- JSON uniquement
```

### messageExamples (1 exemple court)
Réduire à un seul exemple avec 4-5 thèmes.

### Changements
- System prompt réduit de 350 à ~120 tokens
- messageExamples réduit drastiquement
- Model: `Qwen2.5-7B-Instruct-Q5_K_M`

---

## Agent 5: RecommendationAgent.json (Normal - Basse fréquence)

### Rôle
Génère recommandations discovery basées sur wallet activity.

### System prompt optimisé (~150 tokens)
```
Génère recommandations discovery depuis wallet activity.

Format JSON strict:
{"recommendations":[{"category":"","title":"","reason":"","suggestions":[{"name":"","url":""}]}]}

Règles:
- 5-7 catégories diverses (DeFi, NFT, Gaming, Tools, Learning...)
- 6-8 suggestions/catégorie
- URLs réelles et accessibles
- JAMAIS répéter URLs déjà recommandées
- Mix Web3 + web traditionnel
- JSON uniquement
```

### messageExamples (1 exemple court)
Réduire à un seul exemple avec 2-3 catégories.

### Changements
- System prompt réduit de 280 à ~150 tokens
- messageExamples réduit significativement
- Model: `Qwen2.5-7B-Instruct-Q5_K_M`

---

## Settings par agent

| Agent | temperature | maxTokens |
|-------|-------------|-----------|
| SofIA1 | 0.3 | 4096 |
| ChatBot | 0.7 | 2048 |
| PulseAgent | 0.5 | 4096 |
| ThemeExtractor | 0.5 | 4096 |
| RecommendationAgent | 0.6 | 4096 |

```json
"settings": {
  "model": "Qwen2.5-7B-Instruct-Q5_K_M",
  "responseTimeout": 30000
}
```

---

## Champs JSON à modifier

| Champ | Action |
|-------|--------|
| `system` | Optimiser (voir ci-dessus) |
| `messageExamples` | Réduire à 1 exemple |
| `settings.model` | Changer en `Qwen2.5-7B-Instruct-Q5_K_M` |
| `postExamples` | Supprimer (tous vides) |
| `style` | Supprimer (tous vides) |
| `bio`, `topics`, `adjectives` | Garder (métadonnées ElizaOS) |

---

## Ordre d'implémentation

1. **SofIA.json** - Plus critique (très haute fréquence)
2. **ChatBot.json** - Critique (haute fréquence)
3. **PulseAgent.json** - Important
4. **ThemeExtractor.json** - Important
5. **RecommendationAgent.json** - Normal

---

## Gains totaux estimés

- **Avant**: ~4500 tokens overhead par cycle complet
- **Après**: ~1150 tokens overhead
- **Économie**: ~74% de réduction

Pour 1000 requêtes/heure:
- Économie: ~3.35M tokens/heure d'overhead système
