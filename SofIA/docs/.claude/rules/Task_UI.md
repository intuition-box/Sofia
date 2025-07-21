# 🎯 Task List - Sofia Extension UI/UX Implementation

## 📋 Vue d'ensemble

Cette task list détaille l'implémentation de l'extension Sofia Chrome basée sur le product brief. L'extension fonctionne en side panel avec 7 pages principales.

**État actuel analysé :**
- ✅ Background Spline déjà présent (SplineBackground.tsx)
- ✅ Connect Wallet MetaMask fonctionnel (THP_WalletConnectionButton.tsx)
- ✅ Système de tracking implémenté (hooks/useTracking.ts + composants)
- ✅ Structure Plasmo en place

---

## 🔥 Priorité HAUTE - Refactoring & Navigation

### 1. Restructuration de l'interface principale
- [ ] Remplacer les tabs actuels (wallet/tracking) par la navigation product brief
- [ ] Créer le composant HomePage initial (Welcome to Sofia + Connect Wallet uniquement)
- [ ] Implémenter la redirection auto vers Settings après connexion MetaMask

### 2. Système de navigation
- [ ] Créer le router/state management pour les 7 pages :
  - [ ] Home (initial)
  - [ ] Settings
  - [ ] Home (après connexion) 
  - [ ] My Graph
  - [ ] Recommendations
  - [ ] Saved
  - [ ] Search
- [ ] Créer le menu bas avec 5 boutons de navigation (My graph, Recommandations, Saved, Search, Settings)

### 3. Page Settings (refactoring)
- [ ] Migrer le boutton toggle tracking des données vers cette page et l'adapter au design de l'extension
- [ ] Ajouter les nouvelles options :
  - [ ] Bouton Edit (bio + photo de profil)
  - [ ] Sélection de langue
  - [ ] Data Sharing toggle
  - [ ] Bouton Retour vers Home
- [ ] Intégrer le bouton Disconnect Wallet existant

### 4. Page d'accueil (après connexion)
- [ ] Créer l'interface post-connexion avec :
  - [ ] Barre d'input "Talk with Sophia" (agent IA)
  - [ ] Section favoris sauvegardés
  - [ ] Bouton Recommendations (côté)
  - [ ] Intégrer le toggle tracking existant

---

## 🎨 Priorité MOYENNE - Nouvelles Pages

### 5. Page My Graph
- [ ] Créer le système d'onglets (My Data / My Triplets)
- [ ] Réutiliser les composants tracking existants pour My Data
- [ ] Créer My Triplets avec boutons Vote/Remove/Send

### 6. Page Recommendations
- [ ] Créer l'interface de recommandations IA
- [ ] Connecter avec les données des Triplets
- [ ] Système de descriptions sous chaque recommandation

### 7. Page Saved
- [ ] Interface de gestion des favoris
- [ ] Fonctionnalités Add/View/Send/Remove
- [ ] Système d'invitation par email

### 8. Page Search
- [ ] Interface de recherche contextuelle
- [ ] Historique des recherches
- [ ] Résultats en temps réel
- [ ] Style "Google Maps" dynamique

---

## 🎨 Priorité MOYENNE - Design System

### 9. Implémentation des couleurs product brief
- [ ] Remplacer les couleurs actuelles par la palette Sofia :
  - [ ] 950: #372118, 700: #945941, 500: #C7866C, 200: #F2DED6, 50: #FBF7F5, noir: #0E0E0E
- [ ] Appliquer l'effet "liquid glass" aux boutons
- [ ] Texte des boutons en couleur 50
- [ ] Par dessus le background Spline, il y a aura un voile couleur "noir", opacité : 18% sur toutes les pages sauf la page d'accueil.  



### 10. Typographie
- [ ] Importer et appliquer les fonts :
  - [ ] Gotu (titres de section)
  - [ ] Montserrat (texte courant)
  - [ ] Fraunces (Welcome to Sofia)

### 11. Intégration logo
- [ ] Utiliser le logo existant (assets/iconcolored.png)
- [ ] Positionner correctement sur la page d'accueil

---

## 🔧 Priorité BASSE - Optimisations

### 12. Agent IA ("Talk with Sophia")
- [ ] Intégrer un système de chat IA
- [ ] Interface conversationnelle
- [ ] Connexion avec les données trackées

### 13. Interconnexions
- [ ] Liens entre favoris/triplets/recommandations
- [ ] Navigation contextuelle
- [ ] Boutons "retour page d'accueil" sur chaque page

### 14. Optimisations techniques
- [ ] Optimisation performances side panel
- [ ] Respect contraintes CSP Chrome
- [ ] Tests de compatibilité

---

## 📱 Architecture technique

### 15. Gestion d'état
- [ ] Étendre le système de storage existant pour les nouvelles pages
- [ ] Gestion des états de navigation
- [ ] Persistance des données utilisateur

### 16. Composants réutilisables
- [ ] Extraire et réutiliser les composants tracking existants
- [ ] Créer des composants UI cohérents
- [ ] Système de boutons avec effet liquid glass

---

**Notes importantes :**
- Le projet utilise déjà Plasmo, React, et a une structure solide
- Les composants MetaMask et tracking sont fonctionnels et peuvent être réutilisés
- Focus sur la restructuration de l'interface plutôt que sur l'infrastructure technique