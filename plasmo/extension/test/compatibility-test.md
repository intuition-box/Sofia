# Test de compatibilité SOFIA Extension

## Tests à effectuer après installation

### 1. Test du bouton Wallet (MetaMask)
- [ ] Le bouton "Connect to Metamask" s'affiche correctement
- [ ] Le bouton se connecte à MetaMask sans erreur
- [ ] L'adresse du compte s'affiche après connexion
- [ ] Le bouton de déconnexion (PowerOff) fonctionne
- [ ] L'état de connexion persiste après fermeture/ouverture du popup

### 2. Test du système de tracking
- [ ] Le content script s'injecte sur toutes les pages
- [ ] Les données DOM sont capturées (title, keywords, description, h1)
- [ ] Les données s'affichent dans la console du background script
- [ ] Le tracking des durées fonctionne (scroll, changement de page)
- [ ] Les statistiques se mettent à jour dans le popup

### 3. Test de l'interface utilisateur
- [ ] Le popup s'ouvre correctement (350px largeur)
- [ ] Les onglets Wallet/Tracking fonctionnent
- [ ] Le statut de tracking s'affiche correctement
- [ ] Les statistiques globales s'affichent
- [ ] La liste des visites récentes se charge
- [ ] Les actions (export, clear, console) fonctionnent

### 4. Test des fonctionnalités avancées
- [ ] Export des données en JSON
- [ ] Nettoyage des données (avec confirmation)
- [ ] Consultation console via l'action dédiée
- [ ] Toggle on/off du tracking
- [ ] Nettoyage automatique (30 jours)

## Erreurs potentielles à surveiller

### Permissions manquantes
- `history` - Accès à l'historique Chrome
- `tabs` - Gestion des onglets
- `activeTab` - Accès à l'onglet actif
- `alarms` - Nettoyage périodique

### Problèmes de compatibilité
- Conflit entre MetaMask et le tracking
- Messages entre content script et background
- Storage concurrent entre wallet et tracking
- Performance sur sites lourds

## Instructions de test

1. **Installation**
   ```bash
   cd plasmo/extension
   npm run build
   # Charger build/chrome-mv3-prod dans Chrome Extensions
   ```

2. **Test rapide**
   - Ouvrir le popup
   - Tester la connexion MetaMask
   - Naviguer sur quelques sites
   - Vérifier les données dans l'onglet Tracking

3. **Test complet**
   - Laisser tourner 10-15 minutes
   - Naviguer sur 5-10 sites différents
   - Vérifier les statistiques
   - Tester l'export/import
   - Vérifier la console du background

## Checklist de validation

- [ ] ✅ Build réussi sans erreurs
- [ ] ✅ Manifest contient toutes les permissions
- [ ] ✅ Content script s'injecte correctement
- [ ] ✅ Background script démarre sans erreur
- [ ] ✅ Popup se charge rapidement
- [ ] ✅ Wallet fonctionne comme avant
- [ ] ✅ Tracking capture les données
- [ ] ✅ Aucun conflit entre les fonctionnalités
- [ ] ✅ Performance acceptable
- [ ] ✅ Pas d'erreurs dans la console