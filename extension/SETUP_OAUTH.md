# 🚀 Configuration OAuth pour les boutons Discord et X

## ✅ Problèmes résolus

- **Architecture corrigée**: OAuth géré dans le background script au lieu du composant React
- **Types TypeScript ajoutés**: Support des messages `CONNECT_DISCORD` et `CONNECT_X`
- **Gestion d'erreurs améliorée**: Meilleure gestion des callbacks et timeouts
- **Code nettoyé**: Suppression du code obsolète dans AccountTab.tsx

## 🛠️ Pour que les boutons fonctionnent

### 1. Installer et démarrer le serveur OAuth

```bash
cd extension/oauth-server
npm install
cp .env.example .env
# Configurez votre .env avec vos clés OAuth
npm run dev
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier extension avec :

```env
PLASMO_PUBLIC_DISCORD_CLIENT_ID="votre_discord_client_id"
PLASMO_PUBLIC_X_CLIENT_ID="votre_x_client_id"  
PLASMO_PUBLIC_OAUTH_SERVER_URL="http://localhost:3001"
```

### 3. Configurer les applications OAuth

**Discord :**
- Aller sur https://discord.com/developers/applications
- Créer une nouvelle application
- Dans OAuth2 → Redirects, ajouter : `https://[EXTENSION-ID].chromiumapp.org/`
- Copier le Client ID

**X/Twitter :**
- Aller sur https://developer.x.com/portal/projects-and-apps  
- Créer une nouvelle app avec OAuth 2.0
- Dans Callback URLs, ajouter : `https://[EXTENSION-ID].chromiumapp.org/`
- Copier le Client ID

## 🔧 Architecture mise à jour

### Frontend (`AccountTab.tsx`)
```tsx
// Simple appel au background script
chrome.runtime.sendMessage({
  type: 'CONNECT_DISCORD',
  clientId: DISCORD_CLIENT_ID
}, (response) => {
  if (response.success) {
    setDiscordUser(response.user)
  }
})
```

### Background Script (`oauth.ts`)
- Gestion des tabs OAuth
- Échange code → token via serveur OAuth
- Stockage sécurisé des données utilisateur

### Serveur OAuth (`oauth-server/server.js`)
- Échange sécurisé des codes d'autorisation
- Protection des Client Secrets
- Récupération des données utilisateur

## 🎯 État actuel

- ✅ Code OAuth réorganisé et corrigé
- ✅ Types TypeScript mis à jour
- ✅ Background handlers ajoutés
- ⚠️ **Il faut maintenant :**
  1. Installer les dépendances du serveur OAuth
  2. Configurer les Client IDs dans .env
  3. Démarrer le serveur OAuth (port 3001)
  4. Tester les boutons dans l'extension

Les boutons devraient maintenant fonctionner correctement une fois le serveur OAuth configuré et démarré !