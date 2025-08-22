# Configuration OAuth pour Sofia Extension - PRODUCTION

## 🎯 Vue d'ensemble

L'extension Sofia utilise maintenant une authentification OAuth complète avec Discord et X/Twitter. Cette configuration nécessite :
1. Un serveur backend pour sécuriser les secrets OAuth
2. Des applications OAuth configurées sur Discord et X
3. La configuration des bonnes URLs de redirection

## 🚀 Installation Rapide

### 1. Démarrer le Serveur OAuth

```bash
cd oauth-server
npm install
cp .env.example .env
# Éditez .env avec vos clés OAuth (voir section Configuration)
npm run dev
```

### 2. Trouver l'Extension ID

1. Ouvrez Chrome → Extensions → Mode développeur
2. Notez l'ID de votre extension (ex: `abcdefghijklmnopqrstuvwxyzabcdef`)
3. Votre URL de redirection sera : `https://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/`

### 3. Configurer les Applications OAuth

## 🔧 Configuration Discord

1. **Créer l'application :**
   - Allez sur https://discord.com/developers/applications
   - Cliquez "New Application"
   - Nommez votre application (ex: "Sofia Extension")

2. **Configuration OAuth2 :**
   - Dans "OAuth2" → "General"
   - **Client ID** : Copiez cette valeur
   - **Client Secret** : Copiez cette valeur
   - **Redirects** : Ajoutez `https://[VOTRE-EXTENSION-ID].chromiumapp.org/`
   - **Scopes** : `identify`

3. **Mettre à jour .env :**
   ```env
   DISCORD_CLIENT_ID=votre_client_id_discord
   DISCORD_CLIENT_SECRET=votre_client_secret_discord
   ```

4. **Mettre à jour ProfilePage.tsx ligne 49 :**
   ```javascript
   const DISCORD_CLIENT_ID = "votre_client_id_discord"
   ```

## 🔧 Configuration X/Twitter

1. **Créer l'application :**
   - Allez sur https://developer.x.com/portal/projects-and-apps
   - Créez un nouveau projet puis une nouvelle app
   - Configurez OAuth 2.0

2. **Configuration OAuth2 :**
   - **App permissions** : "Read"
   - **Type of App** : "Web App, Automated App or Bot"
   - **Callback URLs** : `https://[VOTRE-EXTENSION-ID].chromiumapp.org/`
   - **Website URL** : `https://votre-site.com` (requis)
   - **Client ID** : Copiez cette valeur
   - **Client Secret** : Copiez cette valeur

3. **Mettre à jour .env :**
   ```env
   X_CLIENT_ID=votre_client_id_x
   X_CLIENT_SECRET=votre_client_secret_x
   ```

4. **Mettre à jour ProfilePage.tsx ligne 107 :**
   ```javascript
   const X_CLIENT_ID = "votre_client_id_x"
   ```

## 📁 Structure du Projet

```
extension/
├── components/pages/ProfilePage.tsx  # Frontend OAuth
├── oauth-server/                    # Serveur backend
│   ├── server.js                   # Logique OAuth
│   ├── package.json
│   ├── .env                        # Secrets OAuth
│   └── README.md
└── OAUTH_SETUP.md                  # Ce guide
```

## 🧪 Test de l'Authentification

1. **Démarrez le serveur :**
   ```bash
   cd oauth-server && npm run dev
   ```

2. **Construisez l'extension :**
   ```bash
   cd .. && npm run build
   ```

3. **Testez :**
   - Ouvrez l'extension
   - Cliquez "Connecter Discord" → Autorisez l'app → Vérifiez le profil connecté
   - Cliquez "Connecter X" → Autorisez l'app → Vérifiez le profil connecté
   - Le badge ✓ "Profil certifié" doit apparaître

## 🔒 Sécurité

- ✅ **Client Secrets** stockés sur le serveur uniquement
- ✅ **CORS** configuré pour les extensions Chrome seulement  
- ✅ **PKCE** implémenté pour X/Twitter (protection supplémentaire)
- ✅ **Validation** des codes et tokens côté serveur

## 🚨 Dépannage

**"The user did not approve access"** → Vérifiez que l'URL de redirection correspond exactement
**"Invalid client"** → Vérifiez les Client ID/Secret dans .env
**"Fetch failed"** → Vérifiez que le serveur OAuth tourne sur le port 3001
**"CORS error"** → Redémarrez le serveur OAuth