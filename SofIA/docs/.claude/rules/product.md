# 🧠 Sofia Extension — Cursor Product Brief

Sofia est une extension Chrome centrée sur la navigation augmentée par l’IA, l'organisation personnelle et le suivi intelligent des données, avec une interface fluide répartie sur sept pages fonctionnelles. L’application est conçue pour fonctionner dans un **side panel**, avec intégration de MetaMask pour la connexion utilisateur.

---

## 🏠 1. Page d'accueil

- Contient un seul bouton : `Connect Wallet`
- Au clic, déclenche l’ouverture de MetaMask
- Une fois la connexion approuvée → redirection automatique vers la page `Settings`

---

## ⚙️ 2. Page Settings

- Permet de choisir ses préférences
- Boutton Edit pour modifier sa bio et sa photo de profil 
- **Option principale : activer/désactiver le tracking des données**
- Langue
- Data Sharing pour partager ses données avec l'équipe de développeurs SofIA
- Disconnect Wallet
- Bouton `Retour` en haut à gauche pour revenir à la page d’accueil

---

## 💬 3. Page d'accueil (après connexion)

- Barre d’input : interaction directe avec l’agent 1 IA ("Talk with Sophia")
**Affiche en dessous** :
  - Liste des favoris sauvegardés
**Affiche sur le coté** : 
  - Bouton `Recommendations` pour accéder à la page de recommandations IA
  - Interrupteur pour (dés)activer le data tracking
- **Menu bas avec 5 boutons** :
  - `My Graph` — visualisation des données suivies
  - `Saved` — accès aux pages ou contenus favoris
  - `Search` — recherche contextuelle
  - `Settings` — préférences utilisateur
  - `Home` — retour à la page principale

---

## 🧭 4. My Graph

Deux onglets disponibles :
- **My Data** : affichage de toutes les données suivies via tracking. Deux boutons sont visiblement sous chaque page (add, remove)
- **My Triples** : affichage les data sauvegardé. Trois boutons sont visiblement sous chaque triplets (vote, remove, send)

---

## 🤖 5. Recommendations

- Génère des recommandations intelligentes via l’IA
- Les recommandations sont basées sur :
  - Les éléments sauvegardés dans `Triples`
- Une description de la recommandation est visiblement sous chaque élèments suggèrés. 

---

## 📁 6. Saved

- Liste de favoris incluant :
  - Recommandations
  - Autres éléments sauvegardés par l'utilisateur 
- Fonctionnalités par élément :
  - `Add` — ajouter un élément
  - `View` — voir la liste ou l’élément
  - `Send` — partager avec un contact
  - `Remove` — supprimer
- Option pour **inviter des personnes par email** à voir la liste

---

## 🔍 7. Search

- Input de recherche contextuelle
- Affiche :
  - Historique de recherches
  - Résultats pertinents en temps réel (au fur et à mesure de la saisie)
- L’interface rappelle **Google Maps** avec un affichage dynamique et interactif

---

## 💡 Navigation contextuelle

- Le chat peut être ouvert directement via le bouton `Talk with Sophia` sur la home page
- Les résultats de recherche peuvent pointer vers une page détaillée avec éléments liés
- Tous les contenus sont interconnectés entre eux : favoris, triplets, recommandations, etc.
- Un bouton "retour à la page d'accueil" est disponible sur chaque page 

---

## 🔐 Authentification

- Via MetaMask (`Connect Wallet`)
- Une fois connecté, l’utilisateur accède à toutes les pages et fonctionnalités

---

## 🧩 Technologies / Contraintes clés

- Fonctionne en **side panel d’extension Chrome**
- Doit respecter les contraintes CSP strictes de Chrome
- Background : Spline (déjà en place)


## Couleur et font & Logo 

**Couleur**
 950 : #372118
 700 : #945941
 500 : #C7866C
 200 : #F2DED6
 50 : #FBF7F5

 **boutton** : 
 texte : 50
 à toi de choisir la couleur à utiliser dans la liste
 effet : liquid glass

**Font** : 
 titre section : Gotu 
 Texte : Montserrat
 Welcome to Sofia (Page d'accueil) : Fraunces

**Logo** : 
../../assets/iconcolored.png
---
