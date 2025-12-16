# Déploiement Sofia-Mastra sur Phala Cloud TEE

## Prérequis

- Compte Phala Cloud avec accès TEE
- Docker installé localement
- Image Docker buildée

## Étape 1 : Build et Push de l'image Docker

### 1.1 Build l'image
```bash
cd sofia-mastra
docker build -f phala-deploy/Dockerfile -t sofia-mastra .
```

### 1.2 Tag l'image pour ton registry
```bash
# Si tu utilises Docker Hub
docker tag sofia-mastra:latest <ton-username>/sofia-mastra:latest

# Si tu utilises un autre registry (ex: GitHub Container Registry)
docker tag sofia-mastra:latest ghcr.io/<ton-username>/sofia-mastra:latest
```

### 1.3 Push l'image
```bash
# Docker Hub
docker login
docker push <ton-username>/sofia-mastra:latest

# GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u <ton-username> --password-stdin
docker push ghcr.io/<ton-username>/sofia-mastra:latest
```

## Étape 2 : Déploiement sur Phala Cloud

### 2.1 Accède à Phala Cloud Dashboard
- Va sur https://cloud.phala.network
- Connecte-toi à ton compte

### 2.2 Crée un nouveau déploiement CVM

1. Clique sur **"Deploy"** ou **"New Deployment"**
2. Sélectionne **"Docker Image"**
3. Entre l'URL de ton image :
   ```
   <ton-username>/sofia-mastra:latest
   ```
   ou
   ```
   ghcr.io/<ton-username>/sofia-mastra:latest
   ```

### 2.3 Configure les ports
| Port Container | Port Public | Description |
|----------------|-------------|-------------|
| 4111           | 4111        | Mastra API  |

### 2.4 Configure les volumes (IMPORTANT pour la persistance)
| Mount Path   | Description              |
|--------------|--------------------------|
| /app/data    | Base de données LibSQL   |

### 2.5 Configure les variables d'environnement

| Variable          | Valeur                          | Description                    |
|-------------------|---------------------------------|--------------------------------|
| NODE_ENV          | production                      | Mode production                |
| GAIANET_BASE_URL  | https://ton-node.gaianet.ai/v1  | URL de ton noeud GaiaNet       |
| GAIANET_API_KEY   | (ta clé si nécessaire)          | Clé API GaiaNet (optionnel)    |
| DATABASE_URL      | file:/app/data/mastra.db        | Chemin de la base LibSQL       |

### 2.6 Lance le déploiement
- Clique sur **"Deploy"**
- Attends que le status passe à **"Running"**

## Étape 3 : Vérification

### 3.1 Test de santé
```bash
curl https://<ton-url-phala>/api/health
```

### 3.2 Test d'un agent
```bash
curl -X POST https://<ton-url-phala>/api/agents/chatbotAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## Endpoints disponibles

Une fois déployé, tu auras accès à :

| Endpoint                              | Description                    |
|---------------------------------------|--------------------------------|
| GET  /api/health                      | Health check                   |
| POST /api/agents/{agentId}/generate   | Générer une réponse            |
| POST /api/agents/{agentId}/stream     | Streaming de réponse           |
| POST /api/workflows/{workflowId}/run  | Exécuter un workflow           |

### Agents disponibles
- `sofiaAgent`
- `themeExtractorAgent`
- `pulseAgent`
- `recommendationAgent`
- `chatbotAgent`

### Workflows disponibles
- `sofiaWorkflow`
- `chatbotWorkflow`

## Troubleshooting

### Voir les logs
Dans le dashboard Phala Cloud, clique sur ton déploiement puis sur **"Logs"**.

### La base de données n'est pas persistée
Vérifie que le volume `/app/data` est bien monté. Sans volume, les données seront perdues à chaque redémarrage.

### Erreur de connexion GaiaNet
Vérifie que :
1. `GAIANET_BASE_URL` est correctement défini
2. L'URL se termine par `/v1`
3. Le noeud GaiaNet est accessible depuis l'environnement TEE

### Container qui redémarre en boucle
Regarde les logs pour identifier l'erreur. Causes communes :
- Variables d'environnement manquantes
- Erreur de build dans l'image
- Port déjà utilisé

## Test local avant déploiement

```bash
cd sofia-mastra/phala-deploy
docker-compose up
```

Accède à http://localhost:4111/api/health pour vérifier.
