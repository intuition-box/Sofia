# Brief Onboarding Sofia — pour le designer

> Objectif de ce document : donner le contexte produit nécessaire pour **refondre entièrement
> l'onboarding** de l'extension Sofia, en passant d'un combo *texte + screenshots statiques* à un
> **parcours guidé avec highlights/coachmarks sur de vrais boutons** (style product tour à la
> Intercom / Appcues / driver.js), où l'utilisateur **fait une action concrète à chaque étape**.

---

## 0. Le problème actuel (à corriger)

L'onboarding actuel = **texte + screenshots statiques** :
- 5 slides carousel dans `apps/extension/components/pages/OnboardingTutorialPage.tsx`
- + un claim modal séparé `apps/extension/components/modals/OnboardingClaimModal.tsx`

Les screenshots sont des placeholders, déconnectés de l'UI réelle. C'est **passif** : l'utilisateur
lit, il n'agit pas.

**Cible** : remplacer par un parcours où texte court + spotlight sur un élément réel + l'utilisateur
clique pour avancer. **Une action concrète à chaque étape.**

---

## 1. Ce qu'est Sofia (pitch pour quelqu'un qui ne connaît NI Intuition NI Sofia)

> ⚠️ **Ne jamais commencer par « blockchain », « Intuition », « atom », « triple », « vault ».**
> Ces mots font fuir. On les introduit plus tard, quand l'utilisateur a déjà fait l'action.

**Le pitch en une phrase :**
> *« Sofia transforme ta navigation web en une réputation qui t'appartient. Tu marques les pages
> qui comptent pour toi, et tu construis une carte vérifiable de ce en quoi tu as confiance. »*

**L'angle émotionnel à vendre :**
- Aujourd'hui, ce que tu lis/regardes/aimes est capté par les plateformes. **Sofia te le rend** :
  tes signaux t'appartiennent, sont portables et publics.
- Tu ne « notes » pas pour un algorithme — tu **certifies** : « cette page mérite confiance »,
  « ça c'est pour le travail », « ça m'a inspiré ».
- Tes signaux ont du **poids réel** (tu mises une petite somme dessus → ça les rend crédibles, pas
  du clic gratuit).
- D'autres font pareil → un **graphe de confiance collectif** émerge, où on peut savoir ce qui est
  fiable selon des gens réels, pas selon une pub.

### Vocabulaire à utiliser face à l'utilisateur (mapping)

| Terme technique (à éviter) | Terme produit (à utiliser) |
|---|---|
| Créer un triple on-chain | **Marquer** une page / faire un **Mark** |
| Certification | **Mark** / signal |
| Atom / vault | (ne pas mentionner) |
| Déposer du TRUST | **Miser**, donner du **poids** à ton signal |
| Trust circle | ton **Cercle** |
| Echoes | tes **Echoes** (tes pages regroupées par site) |

---

## 2. La boucle produit centrale (ce que l'utilisateur fait vraiment)

C'est LE cœur à faire vivre dans l'onboarding. Boucle réelle (vérifiée dans le code) :

```
Naviguer → Marquer une page → Panier (cart) → Miser & confirmer on-chain → Voir ses Echoes
```

**Étape par étape, boutons réels :**

1. **Sur une page** (`apps/extension/components/ui/PageBlockchainCard.tsx`) : l'utilisateur choisit
   une **intention** parmi 6 → bouton qui ajoute au panier :
   - **Trust** / **Distrust** (signal de confiance simple)
   - **Work** / **Learning** / **Fun** / **Inspiration** (pour quoi cette page compte)
   - + optionnel : tagger des **contextes d'intérêt** (Tech, Web3, Gaming… 14 domaines)

2. **Panier** (`apps/extension/lib/services/CartService.ts`,
   `apps/extension/components/ui/CartDrawer.tsx`) : les Marks s'accumulent. Un **FAB flottant**
   (icône Sofia) montre le compteur. Rien ne part on-chain tout de suite — c'est du **batch**.

3. **Confirmer** : modal de poids → l'utilisateur choisit combien de **TRUST** miser (pills :
   0.01 / 0.5 / 1 / 5 / 10 ou custom), peut allouer un % au **Beta Season Pool**, voit le coût
   total, puis bouton **« Mark »** → transaction(s) on-chain.

4. **Récompenses** : après la TX, il gagne du **Gold** (monnaie privée pour level-up) et voit ses
   récompenses. Option « Share on X ».

5. **Echoes** (`apps/extension/components/pages/MyProfilePage.tsx`) : ses Marks sont regroupés par
   domaine. Chaque **Echo** = un site (github.com, youtube.com) avec toutes ses pages marquées.
   Plus il marque, plus son niveau monte.

---

## 3. Le « First Claim » (à conserver — c'est bien pensé)

`apps/extension/components/modals/OnboardingClaimModal.tsx` est déjà une **machine à étapes
progressives** (5 steps avec révélation section par section + highlight).
**C'est exactement le pattern à généraliser à tout l'onboarding.**

Son intention pré-câblée : **`I trust Sofia`** (l'utilisateur fait confiance à Sofia comme tout
premier signal). Les 5 steps :
1. Voir la carte du signal (`Sofia · Trusted`)
2. Choisir le poids (combien de TRUST)
3. Allouer au Beta Season Pool (slider)
4. Vérifier le coût total
5. Confirmer → on-chain

> **Recommandation** : le first claim est la **première action concrète idéale**. À faible enjeu
> (0.01 TRUST mini), il apprend toute la mécanique (intention → poids → confirmer) en une fois.
> Garde-le comme **climax de l'onboarding**, pas comme une étape isolée.

---

## 4. Relation Extension ↔ Explorer ↔ Circles ↔ Votes

Crucial pour que l'utilisateur comprenne *pourquoi* il marque.

### Extension = le point d'entrée (où on PRODUIT les signaux)
C'est là que l'utilisateur marque, mise, gère ses Echoes, son Cercle.

### Explorer = la vitrine publique (où on VOIT les signaux de tous)
App web séparée (`sofia.intuition.box`, code dans `apps/explorer/`). Dashboard de réputation : feed
temps réel de toutes les certifications, profils de réputation multi-domaines, scores de confiance
(Trust Engine). L'extension y renvoie via des liens (voir un triple, un profil).
**À présenter comme : « ton travail dans l'extension devient visible et vérifiable par tous sur
l'Explorer ».**

### Circles = ton réseau de confiance (`apps/extension/components/pages/CirclesPage.tsx`)
- Un **Cercle** = l'ensemble des comptes que tu **trustes** (stocké on-chain comme triples `trusts`).
- Tu découvres des comptes actifs (l'ExplorerPanel montre le top 10 des plus actifs sur 7 jours)
  → bouton **« + add »** pour les ajouter à ton cercle.
- Tu vois leurs Marks dans un **feed filtré** (Circle Feed).

### Votes = ton influence sur les Marks des autres
- Dans le Circle Feed, sur le Mark de quelqu'un : **👍 Support** ou **👎 Oppose**.
- Ça ajoute un vote au panier → à la confirmation, tu mises du TRUST sur le **vault de support** ou
  le **counter-vault** du triple.
- Le ratio support/oppose = le **consensus / crédibilité** d'un Mark.
- Voter rapporte aussi du Gold (plafonné par jour).

**La phrase qui relie tout (pour l'utilisateur) :**
> *« Tu marques les pages (Echoes), tu suis des gens de confiance (Cercle), tu pèses sur ce qui est
> crédible (Votes) — et tout ça construit une réputation publique et vérifiable, visible sur
> l'Explorer. »*

---

## 5. Recommandations concrètes pour le nouveau parcours guidé

**Format** : coachmarks/spotlight (overlay sombre + halo sur l'élément réel + bulle de texte courte
+ CTA « fais ceci »). L'utilisateur **agit pour avancer**, il ne clique pas juste « Next ».

### Séquence recommandée (du plus simple au plus engageant)

| # | Action concrète demandée | Élément à highlighter | Concept appris |
|---|---|---|---|
| 1 | « Voici ta page actuelle. Choisis pourquoi elle compte » → cliquer une intention | boutons d'intention sur PageBlockchainCard | **Marquer** |
| 2 | « Ton Mark est dans ton panier » → ouvrir le panier | CartFAB (compteur) | **Batch / panier** |
| 3 | « Donne du poids à ton signal » → choisir un montant | weight pills | **Miser = crédibilité** |
| 4 | « Confirme ton premier signal » → bouton Mark (le First Claim `I trust Sofia`) | bouton Mark | **On-chain / signal vérifiable** |
| 5 | « Bravo, voici ta réputation qui démarre » → voir ses Echoes | EchoesTab | **Echoes / niveau** |
| 6 | « Trouve des gens de confiance » → ajouter 1 compte à son cercle | ExplorerPanel « + add » | **Cercle** |
| 7 | « Pèse sur leurs signaux » → un vote 👍 | Circle Feed | **Votes / consensus** |

### Principes de design à respecter
- **Une action = une étape.** Jamais 2 concepts à la fois.
- **Concept APRÈS l'action**, pas avant : on agit, *puis* on nomme (« ce que tu viens de faire
  s'appelle un Mark »).
- **Skippable** à tout moment, mais l'action minimale (le first claim) reste fortement incitée.
- Introduire « Intuition / blockchain / on-chain » **seulement à l'étape 4**, en valorisation
  (« c'est vérifiable, ça t'appartient »), jamais en friction.
- Réutiliser le pattern de **révélation progressive + section `highlighted`** déjà présent dans
  OnboardingClaimModal et son CSS (`apps/extension/components/styles/OnboardingClaimModal.css`).

### Détails techniques utiles au designer
- Pré-requis avant de marquer : être sur une **page HTTPS** (les pages sensibles banque/auth/checkout
  sont exclues — voir `apps/extension/background/constants.ts`).
- Le tracking de navigation demande un **consentement** (déjà dans OnboardingImportPage) — à garder
  tôt mais léger.
- L'import de bookmarks existe (`apps/extension/components/pages/OnboardingBookmarkSelectPage.tsx`) :
  peut servir à **pré-remplir** des pages à marquer pour que l'étape 1 ne soit pas sur une page vide.

---

## Annexe — Glossaire interne (NE PAS exposer tel quel à l'utilisateur)

| Concept | Définition technique |
|---|---|
| **Atom** | Entité on-chain (URL, compte, concept). |
| **Triple** | Relation sujet-prédicat-objet entre atoms. Ex : `I | trust | Sofia`. |
| **Vault** | Coffre de staking sur chaque atom/triple ; on y dépose du TRUST. |
| **Mark** | Nom produit d'une certification = créer un triple on-chain. |
| **Echo** | Groupe d'intentions par domaine (toutes tes pages marquées sur un même site). |
| **Cart** | Accumulateur client-side (certifs + votes) avant soumission batch. |
| **Support / Oppose** | Vote = ajouter du poids au vault de support ou au counter-vault d'un triple. |
| **Gold** | Monnaie privée (discovery + votes − dépensé), sert aux level-ups. |
| **XP** | Monnaie publique d'affichage, issue des quêtes/badges. |
