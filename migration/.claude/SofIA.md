# 📘 Parcours Utilisateur - Application SofIA

---

## 🔁 1. Onboarding & Authentification

### 🧩 Étape 1 - Installation
- **Action** : L'utilisateur télécharge et installe l'extension depuis le Chrome Web Store.
- **État requis** : Extension compatible navigateur chrome, injection active en fond.
- **Objectif utilisateur** : Commencer à utiliser l'outil.
  
### 🔐 Étape 2 - Connexion
- **Action** : L'utilisateur ouvre l’extension → Page d’accueil
- **Composants** :
  - Bouton de connexion avec **wallet Metamask**
  - Case à cocher **CGU + consentement RGPD tracking global**
- **Consentement RGPD (Opt-in)** :
  - Tracking global de la navigation web (cookies, navigation DOM, requêtes web)

---

## 🌐 2. Importation de données

### ⭐ Étape 3 - Import des favoris
- **Action** : Importation des favoris Chrome existants
- **Traitement** :
  - Les favoris sont envoyés à **Agent 1** via API vers Eliza OS
  - Format attendu : JSON structuré (titre, URL, dossier, timestamp)

### 🤖 Étape 4 - Analyse initiale
- **Intervenant** : `Agent 1` (Eliza OS)
  - Rôle : Analyse les favoris et la navigation web de l'utilisateur en temps réel pour inférer des **triplets RDF**
  - Exemples de sortie :
    - `(utilisateur) → est → développeur`
    - `(utilisateur) → aime → chaussures`
    - `(utilisateur) → suit → diète végétarienne`
- **Interaction** :
  - Agent 1 demande confirmation utilisateur pour inscrire les triplets sur son **Knowledge Graph (on-chain)**
- Agent 1 challenge l'utilisateur quotidiennement afin de d'alimenter le **Knowledge Graph (on-chain)** avec des questions comme "Qu'as tu fait cette semaine ?"

---

## 🧠 3. Interface Utilisateur (Accueil)

### 🏠 Étape 5 - Accueil post-onboarding
- **Vue principale** :
  - Affichage en onglet :
    - Knowledge Graph (vue liste des triplets RDF)
- Vu des données traqués en temps réél
    - Favoris importés ou créer & classés par categories
    - Recommandations de **Agent 2** (Eliza OS)
    - Zone de recherche
    - Chat libre avec SofIA
    - Paramètres
    - Bouton `Ajouter Atom ou Triplet`
    - Bouton `Tracking : ON/OFF`
- **Recommandations** : contextuelles via Agent 2 (cf. ci-dessous)

---

## 📁 4. Gestion des favoris

### 🗂️ Étape 6 - Interaction avec listes de favoris
- **Action** : Clic sur une liste
- **Fonctionnalités** :
  - Voir avec qui la liste est partagée
  - Consulter les liens
  - Envoyer la liste à un contact (email)
  - Supprimer la liste

---

## 🔍 5. Moteur de recherche personnel

### 🧠 Étape 7 - Recherche
- **Affichage** :
  - Historique des recherches précédentes
  - Résultats enrichis (cf. Étape 8)

### 📊 Étape 8 - Résultat enrichi
- Pour chaque résultat :
  - **Triplets associés** à la page
  - **Informations supplémentaires** :
    - URL
    - Nombre de votes/validations communautaires
    - Description

---

## 🎯 6. Recommandations personnalisées

### 🔎 Étape 9 - Page de recommandations
- **Intervenant** : `Agent 2`
- **Type de contenus recommandés** :
  - Liens web (ex : articles, outils)
  - Événements (**API Facebook**)
  - Lieux (**API Google Maps**)
- **Basé sur** : le Knowledge Graph on-chain de l’utilisateur

---

## 🧬 7. Knowledge Graph

### 🧠 Étape 10 - Vue du graph
- **Affichage** : liste des triplets RDF créés
- **Données visibles** :
  - Triplets créés manuellement ou suggérés
  - Triplets issus du tracking
- Données issue du tracking au format : 
🌍 Page Details
📄 Title: Context7 MCP Server – Up-to-date code documentation for LLMs and AI code editors
🔗 URL: https://github.com/upstash/context7

📊 User Navigation Stats
🗓️ Last Visited: July 14, 2025 – 14:21:21
🔢 Total Visits: 2
⏰ Event Timestamp: July 14, 2025 – 14:21:21
⏱️ Session Duration: 2 min 
- **Évolution prévue** : Vue 3D WebGL (Three.js)

---

## ⚙️ 8. Paramètres & vie privée

### 🛠️ Étape 11 - Settings
- **Fonctionnalités** :
  - Connecter / déconnecter wallet
  - Supprimer compte
  - Activer/désactiver le tracking
  - Activer le partage des données à l’éditeur
  - Choisir la langue

---

## 💬 9. Interaction spontanée avec Eliza OS

### 🧠 Étape 12 - Questions proactives
- **Déclenchement** : Connexion spontanée de l’utilisateur ou clique sur le boutton **Talk With SofIA**
- **Intervenant** : `Agent 1`
- **Questions types** :
  - “Qu’as-tu fait cette semaine ?”
  - “Qu’as-tu mangé récemment ?”
  - “Est-ce que ça va aujourd’hui ?”
- **But** : enrichir le **graph de connaissance subjectif** de l’utilisateur

- **Intervenant** : `Agent 2`
- **Suggestions types** :
  - “As-tu vu ce nouveau restaurant ?”
  - “John Doe à ajouté cette musique à sa liste de favoris ?”
- **But** : Données des suggestions à l'utilisateur

---

### 🧠 Étape 13 - Analyse des données de navigation par l'agent 1
- **Déclenchement** : Toutes les minutes après l'onboarding
- **Intervenant** : `Agent 1`
- **Données envoyés à l'agent 1** : Les données du service worker
- **Type de données** : Les données du service worker sont fetch en direct à l'agent 1
- **But** : Propose des triplets pertinents issue de son analyse de l'historique de navigation de l'utilisateur. 


## 🧱 Structure des données

### 📐 Triplet RDF
- Forme : `(Sujet) → (Prédicat) → (Objet)`
- Stockage : sur la **blockchain** (Intuition Systems)

### ⚛️ Atom
- Définition : Composant minimal d’un triplet
- Exemple :
  - Atom : `développeur`, `végétarien`, `chaussures`
  - Triplet dérivé : `(moi) → est → développeur`

---

## 🔒 Considérations RGPD

- **Consentement explicite (Opt-in)** via Metamask + CGU
- **Tracking global activé** par défaut après consentement
- **Données collectées** : historique navigation web, usage extension, interactions agents
- **Suppression**
