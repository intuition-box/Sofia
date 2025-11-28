# Session GaiaNet - Déploiement Node LLM

## Configuration Node

```
Node ID: 0x0e879aa9df95a80d74ac625f2e7c738be24b7abe
Device ID: device-689882cfb30e8723153ad8a2
URL: https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains
Serveur: Hetzner GEX44 (168.119.111.42)
GPU: NVIDIA RTX 4000 SFF Ada (20GB VRAM)
Model: Qwen2.5-7B-Instruct-Q5_K_M
VRAM utilisée: ~6.3 GB
```

## Endpoints

```bash
# Chat completions
POST https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains/v1/chat/completions

# Embeddings
POST https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains/v1/embeddings
```

## Variables d'environnement ElizaOS

```env
GAIANET_API_KEY=gaia
GAIANET_SERVER_URL=https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains/v1
GAIANET_MODEL=Qwen2.5-7B-Instruct-Q5_K_M
GAIANET_EMBEDDING_MODEL=nomic-embed-text-v1.5
```

---

## Problèmes résolus

### 1. GPU non utilisée
- Symptôme: `nvidia-smi` montrait 2MiB usage
- Cause: GaiaNet installé sans support CUDA
- Fix: `curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash -s -- --ggmlcuda 12`

### 2. CUDA library not found
- Symptôme: `libcudart.so.12: cannot open shared object file`
- Fix:
```bash
apt install nvidia-cuda-toolkit
export LD_LIBRARY_PATH=/usr/local/cuda-12/lib64:$LD_LIBRARY_PATH
```

### 3. frpc.toml deviceId missing
- Symptôme: Node failed to start gaia-nexus
- Fix: Ajouter `metadatas.deviceId` dans `~/gaianet/gaia-frp/frpc.toml`

### 4. Context size trop petit
- Symptôme: Erreur "context too small" pour requêtes 6K+ tokens
- Fix: Modifier `ctx_size` dans `~/gaianet/config.json` (8192 ou 16384)
```bash
cd ~/gaianet
# Éditer config.json: "ctx_size": 16384
./bin/gaianet stop && ./bin/gaianet start
```

---

## Optimisations agents

### Agents optimisés
- [x] SofIA.json - System prompt réduit ~78%, topic_family supprimé
- [x] ChatBot.json - System prompt réduit ~77%, anglais

### Agents à optimiser
- [ ] PulseAgent.json
- [ ] ThemeExtractor.json
- [ ] RecommendationAgent.json

Voir [PLAN.md](../node_gaianet/PLAN.md) pour le plan détaillé.

---

## Commandes utiles (sur serveur Hetzner)

```bash
# Status node
~/gaianet/bin/gaianet info

# Restart node
~/gaianet/bin/gaianet stop && ~/gaianet/bin/gaianet start

# Logs
tail -f ~/gaianet/log/start-llamaedge.log

# VRAM usage
nvidia-smi

# Test endpoint
curl -X POST https://0x0e879aa9df95a80d74ac625f2e7c738be24b7abe.gaia.domains/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen2.5-7B-Instruct-Q5_K_M","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Prochaines étapes

1. Augmenter `ctx_size` à 16384 pour supporter les requêtes SofIA (6K+ tokens)
2. Optimiser les 3 agents restants
3. Tester avec 20 beta users
4. Considérer un 2ème node si load trop élevé
