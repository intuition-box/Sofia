# ✅ Checklist Rapide - Test de Workload SofIA

## Avant de commencer

- [ ] J'ai lu `WORKLOAD_TESTING_GUIDE.md`
- [ ] J'ai compris ce que je vais mesurer
- [ ] Je suis prêt à utiliser l'extension pendant 24h

---

## Configuration (15 min)

- [ ] Compte Dash0 créé sur https://app.dash0.com
- [ ] Token Dash0 récupéré (Settings → API Tokens)
- [ ] Fichier `.env` créé: `cp .env.example .env`
- [ ] Token ajouté dans `.env`: `DASH0_AUTH_TOKEN=...`
- [ ] Agent buildé: `bun run build`

---

## Vérification avant le test

- [ ] Agent lancé: `elizaos start`
- [ ] Logs montrent: `[OpenTelemetry] SDK started` ✅
- [ ] Extension Chrome installée et active
- [ ] Connexion WebSocket établie (vérifier dans extension)
- [ ] Première donnée visible sur Dash0 (après 5-10 min)

---

## Pendant le test (24h)

- [ ] Agent tourne en continu (vérifier toutes les 4-6h)
- [ ] Utilisation normale de l'extension (~10-12h actif sur 24h)
- [ ] Navigation variée (différents sites, sujets)
- [ ] Interactions avec le chatbot
- [ ] Aucune erreur critique dans les logs

---

## Après le test (30 min)

### Collecter les métriques depuis Dash0

- [ ] Connecté sur https://app.dash0.com
- [ ] Période sélectionnée: "Last 24 hours"
- [ ] Métrique `sofia.messages.received` notée: _______
- [ ] Métrique `sofia.llm.requests` notée: _______
- [ ] Métrique `sofia.llm.tokens.input` notée: _______
- [ ] Métrique `sofia.llm.tokens.output` notée: _______
- [ ] Métrique `sofia.message.processing.duration` (avg) notée: _______
- [ ] Screenshots pris (optionnel)

### Calculer les projections

- [ ] Fichier `scripts/calculate-workload.ts` ouvert
- [ ] Section `MY_METRICS` remplie avec mes chiffres réels
- [ ] Script exécuté: `bun run scripts/calculate-workload.ts`
- [ ] Résultats vérifiés (pas de NaN, chiffres cohérents)
- [ ] Rapport JSON généré: `reports/workload-calculation.json`

---

## Rapport pour Gaianet

- [ ] Résultats du script copiés
- [ ] Email/document préparé (voir template dans guide)
- [ ] Fichier JSON attaché
- [ ] Screenshots Dash0 joints (optionnel)
- [ ] Rapport envoyé à Gaianet
- [ ] Suivi planifié

---

## Points clés à communiquer à Gaianet

- [ ] Nombre de users cibles: 20 / 50 / 100
- [ ] Tokens par mois calculés: _______
- [ ] GPUs nécessaires: _______
- [ ] Latence cible: <2000ms (P95)
- [ ] Questions pricing préparées
- [ ] Questions SLA préparées

---

## Si quelque chose ne va pas

### Pas de données dans Dash0 après 10 min?
- [ ] Token vérifié dans `.env`
- [ ] Agent relancé
- [ ] Extension utilisée activement
- [ ] Logs vérifiés (erreurs OTLP?)

### Script affiche des NaN?
- [ ] `MY_METRICS` rempli avec des vraies valeurs (pas des 0)
- [ ] `totalLLMRequests` > 0
- [ ] Calculs vérifiés manuellement

### Agent crash pendant le test?
- [ ] Logs vérifiés
- [ ] Agent relancé
- [ ] Durée totale du test ajustée dans le script

---

**Temps total estimé:**
- Configuration: 15 min
- Test: 24h (automatique)
- Collecte + calcul: 30 min
- Préparation rapport: 15 min

**Total travail actif: ~1h**

---

Bon test! 🚀
