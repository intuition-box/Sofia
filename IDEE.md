# 🎮 Gamification · Page Discovery (Sofia)

## 🎯 Objectif
Transformer la navigation web en **exploration active et certifiée**, afin de :
- encourager la découverte de nouvelles pages
- valoriser les premiers explorateurs
- certifier des pages utiles et pertinentes
- enrichir un knowledge graph public et vérifiable

---

## 🥇 Statuts de découverte (par page)

Chaque page certifiée reçoit un **statut temporel**, lié à l’ordre d’arrivée des utilisateurs.

- **Pioneer**  
  Premier utilisateur à certifier la page.

- **Explorer**  
  Parmi les premiers utilisateurs à découvrir et certifier la page.

- **Contributor**  
  Utilisateur qui contribue après adoption initiale.

Ces statuts créent une **preuve d’antériorité**, essentielle pour la valeur sémantique et historique du graphe.

### Triples associés
User → discovered → Page
User → discovery_role → Pioneer
Page → first_certified_by → User

yaml
Copier le code

---

## ⏱️ Proof of Attention (qualité > quantité)

Une page n’est certifiable que si une **attention réelle** est détectée :
- temps minimum passé sur la page
- scroll effectif
- interaction utilisateur (clic, sélection, etc.)

Objectif :
- éviter le spam et le farming
- privilégier les découvertes intentionnelles

### Signal
User → paid_attention_to → Page

markdown
Copier le code

---

## 🧭 Progression personnelle & Badges

La progression repose sur des **badges cumulés**, visibles et compréhensibles.

### Badges de volume
- **First Step** → première page certifiée  
- **Pathfinder** → 10 pages certifiées  
- **Cartographer** → 50 pages certifiées  
- **Explorer** → 100 pages certifiées  

### Badges de diversité (anti-bulles)
- **Multi-domain Explorer** → pages issues de plusieurs domaines distincts  
- **Cross-topic Explorer** → exploration de plusieurs topics  
- **Unusual Path** → pages hors du pattern habituel de l’utilisateur  

Objectif : encourager la **curiosité réelle**, pas la répétition mécanique.

---

## 💎 Rareté & Valeur des pages

Certaines pages ont une valeur intrinsèque plus élevée car elles sont :
- peu visitées
- non indexées ou hors SEO
- niches, techniques ou émergentes

### Labels de rareté
- **Hidden Gem**
- **Unindexed Page**
- **Niche Knowledge**
- **Early Signal**

### Triples associés
Page → has_rarity → HiddenGem
User → discovered → RarePage

yaml
Copier le code

---

## 🏆 Discovery Score (réputation douce)

Chaque utilisateur dispose d’un **Discovery Score**, calculé à partir de :
- son statut de découverte (Pioneer / Explorer)
- la rareté des pages découvertes
- la validation par attention + intention

Exemple de pondération :
+10 Pioneer discovery
+5 Early discovery
+3 Rare page
+2 Verified attention

yaml
Copier le code

Principes :
- pas de compétition agressive
- réputation cumulative
- valorisation de la qualité plutôt que du volume

---

## 🧠 Feedback UX immédiat

Chaque action de certification génère un retour clair et motivant :
- confirmation du statut (ex: premier à certifier)
- indication d’ajout au knowledge graph public
- mise en valeur de la trace créée

Objectif : **dopamine propre**, compréhension immédiate de l’impact.

---

## 🧩 Lien avec l’intention d’usage

Les découvertes sont renforcées lorsqu’elles sont associées à une intention explicite :
- apprendre (`for_learning`)
- travailler (`for_work`)
- s’inspirer (`for_inspiration`)
- se divertir (`for_fun`)
- acheter (`for_buying`)

Exemples :
- Pioneer + for_learning
- Rare page + for_work
- Hidden Gem + for_inspiration

👉 La **qualité de l’intention** compte autant que la découverte elle-même.

---

## 🧠 Leviers psychologiques activés

Ce qui fonctionne :
- progression visible
- reconnaissance explicite
- rareté et temporalité
- diversité valorisée
- feedback immédiat

Ce qui est volontairement évité :
- récompenses artificielles
- mécaniques financières prématurées
- features bloquées ou frustrations
- gouvernance ou complexité sociale inutile

---

## 🎯 Positionnement actuel

Ce système vise à :
- créer de l’engagement sans inflation artificielle
- construire un graphe de qualité avant toute monétisation
- laisser émerger la valeur par l’usage réel

Les mécaniques économiques ou fonctionnelles avancées sont **hors scope à ce stade**.