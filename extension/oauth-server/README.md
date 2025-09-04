# Serveur OAuth pour Sofia Extension

## 🚀 Installation et Démarrage

1. **Installer les dépendances :**
   ```bash
   cd oauth-server
   npm install
   ```

2. **Configurer les variables d'environnement :**
   ```bash
   cp .env.example .env
   ```
   Puis éditez `.env` avec vos vraies clés OAuth.

3. **Démarrer le serveur :**
   ```bash
   npm run dev  # Mode développement avec auto-reload
   # ou
   npm start    # Mode production
   ```

## 🔧 Configuration OAuth

### Discord

1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application
3. Dans OAuth2 → General :
   - Copiez le **Client ID** et **Client Secret**
   - Ajoutez cette URL de redirection : `https://[EXTENSION-ID].chromiumapp.org/`
   - Scopes : `identify`

### X/Twitter

1. Allez sur https://developer.x.com/portal/projects-and-apps
2. Créez une nouvelle application
3. Dans OAuth 2.0 Settings :
   - Copiez le **Client ID** et **Client Secret**
   - Type : "Web App, Automated App or Bot"
   - Callback URL : `https://[EXTENSION-ID].chromiumapp.org/`
   - Scopes : `tweet.read`, `users.read`

## 📋 Trouver l'Extension ID

1. Ouvrez Chrome → Extensions → Mode développeur
2. L'ID est affiché sous votre extension (ex: `abcdefghijklmnopqrstuvwxyzabcdef`)
3. Utilisez `https://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/`

## 🔧 Mettre à jour l'Extension

Dans `ProfilePage.tsx`, modifiez les lignes :
- Ligne 49 : `const DISCORD_CLIENT_ID = "VOTRE_VRAI_CLIENT_ID"`
- Ligne 107 : `const X_CLIENT_ID = "VOTRE_VRAI_CLIENT_ID"`

## 🧪 Test

1. Démarrez le serveur : `npm run dev`
2. Ouvrez l'extension
3. Cliquez sur "Connecter Discord" ou "Connecter X"
4. Autorisez l'application
5. Vérifiez que le profil est connecté avec le badge ✓

## 🚨 Sécurité

- Les **Client Secrets** restent sur le serveur (sécurisé)
- Les tokens ne sont pas stockés côté client
- CORS configuré pour les extensions Chrome seulement