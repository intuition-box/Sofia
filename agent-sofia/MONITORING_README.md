# 🎯 Quick Start: Monitoring SofIA

## En 3 étapes rapides

### 1️⃣ Configurez Dash0 (5 min)

```bash
# Créez .env à partir de l'exemple
cp .env.example .env

# Éditez .env et ajoutez votre token Dash0
nano .env
```

Récupérez votre token sur: https://app.dash0.com → Settings → API Tokens

### 2️⃣ Lancez l'agent (1 min)

```bash
bun run build
elizaos start
```

Vérifiez dans les logs: `[OpenTelemetry] SDK started` ✅

### 3️⃣ Utilisez normalement pendant 24h

L'extension track automatiquement tout. Après 24h, suivez le guide complet.

---

## 📚 Fichiers importants

| Fichier | Description |
|---------|-------------|
| `WORKLOAD_TESTING_GUIDE.md` | **Guide complet step-by-step** (lire en premier!) |
| `scripts/calculate-workload.ts` | Script pour calculer les projections 20/50/100 users |
| `src/otel.ts` | Configuration OpenTelemetry |
| `src/metrics.ts` | Métriques custom (tokens, latence, etc.) |
| `.env.example` | Template de configuration |

---

## 🚀 Après vos tests de 24h

1. Allez sur https://app.dash0.com
2. Relevez les 5 chiffres clés (voir guide)
3. Exécutez: `bun run scripts/calculate-workload.ts`
4. Envoyez le rapport à Gaianet

---

## 🆘 Problème?

Consultez la section **FAQ / TROUBLESHOOTING** du guide complet.

---

**🎯 Objectif**: Obtenir les données pour que Gaianet vous débloque la puissance nécessaire!
