Nouvelle couleur de l'extension :
- Couleur 1 : AAA292
- Couleur la plus claire : FFFCF5
- Couleur la plus foncé : 4E4938
- Couleur 4 : AAA290
- Couleur 5 : D7992E

- Nouveau background : background.png
Supprime tout ce qui concerne l'animation background
Verifie qu'il ne reste plus rien

- Supprime l'animation border sur la page pulse

- Changer toutes les couleurs de l'extension.
- Verifier qu'il ne reste aucune ancienne couleur
- Supprimer l'orb et vérifier qu'il ne reste rien dans le code qui concerne l'orb
- Toutes les polices doivent etre remplacé par : overpass mono
    sous titre / commentaire : overpass mono light
    Texte normal : overpass mono medium
    Titre / Texte important : overpass mono bold

- Verifie toujours ton travail après la tache d'après
- Verifie chaque fichier css.
- Applique des :root sur le global.css que tu réutilise ensuite. Il faut utiliser le plus de valeur root possible.
- Ne me mens pas
- N'hallucine pas

## QUESTIONS POUR CLARIFICATION :

1. Pour la nouvelle palette de couleurs, peux-tu me préciser le rôle de chaque couleur ?
   J'ai mis tout les details de comment doivent appliqué les couleurs dans @newUI.html et @newcss.md
   Remplace juste 9B8750 par D7992E et met le css dans un fichier css et non en dur comme sur le fichier html. Je dois pouvoir modifier simplement le CSS.
   De plus, il faut revoir le css global dans sa simplicité

2. Le fichier background.png existe-t-il déjà dans le projet ? Si oui, où se trouve-t-il ?
/home/samuel_chauche/THP/Sofia/newUI/background.png

3. Pour les polices Overpass Mono, dois-je les importer depuis Google Fonts ou sont-elles déjà disponibles dans le projet ? Importe les DEPUIS GOOGLE

4. Y a-t-il des éléments UI spécifiques que je ne dois PAS toucher pendant cette refonte ?
Pour l'instant, la disposition des élèments sur leurs pages, les logo

5. Après les modifications, dois-je tester l'extension ou juste faire les changements de code ? Juste les changements dans le code, je testerai moi meme

## TÂCHES DÉTAILLÉES POUR LA REFONTE UI :

### 1. ANALYSE ET PRÉPARATION
- [x] Analyser tous les fichiers CSS de l'extension (/extension/components/styles/)
- [x] Identifier toutes les couleurs actuelles utilisées dans le code
- [x] Identifier toutes les polices actuelles utilisées
- [x] Identifier toutes les animations de background et orb
- [x] Mapper les correspondances entre anciennes et nouvelles couleurs

### 2. CONFIGURATION CSS GLOBALE
- [x] Modifier /extension/components/styles/Global.css avec les nouvelles variables CSS root
- [x] Remplacer 9B8750 par D7992E dans la palette
- [x] Appliquer la palette complète : AAA292, FFFCF5, 4E4938, AAA290, D7992E
- [x] Créer les variables CSS pour toutes les couleurs de la palette
- [x] Importer Google Fonts Overpass Mono (light, medium, bold)
- [x] Définir les variables de polices dans :root

### 3. MODIFICATION DU BACKGROUND
- [x] Copier background.png de /newUI/ vers /extension/
- [x] Remplacer tous les backgrounds par background.png
- [x] Supprimer toutes les animations de background
- [x] Vérifier /extension/components/layout/background/Background.css
- [x] Nettoyer Background.css de toutes les animations

### 4. SUPPRESSION DES ANIMATIONS SPÉCIFIQUES
- [x] Supprimer l'animation border dans /extension/components/ui/PulseAnimation.css
- [x] Identifier et supprimer toutes les références à l'orb
- [x] Nettoyer le code des animations orb dans tous les fichiers

### 5. REMPLACEMENT DES COULEURS PAR FICHIER
**IMPORTANT : Remplacer toutes les couleurs hardcodées (hex, rgb, hsl) par les variables :root**
- [x] AppLayout.css - remplacer toutes les couleurs par var(--variable-name)
- [x] HomePage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] HomeConnectedPage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] SearchResultPage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] BottomNavigation.css - remplacer toutes les couleurs par var(--variable-name)
- [x] ProfilePage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] SettingsPage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] ChatPage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] CorePage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] CommonPage.css - remplacer toutes les couleurs par var(--variable-name)
- [x] TripleForm.css - remplacer toutes les couleurs par var(--variable-name)
- [x] AtomCreationModal.css - remplacer toutes les couleurs par var(--variable-name)
- [x] WeightModal.css - remplacer toutes les couleurs par var(--variable-name)
- [x] BookmarkStyles.css - remplacer toutes les couleurs par var(--variable-name)
- [x] LevelProgress.css - remplacer toutes les couleurs par var(--variable-name)
- [x] LiquidGlass.css - remplacer toutes les couleurs par var(--variable-name)
- [x] style.css (principal) - remplacer toutes les couleurs par var(--variable-name)

### 6. REMPLACEMENT DES POLICES
- [x] Remplacer toutes les font-family par Overpass Mono dans tous les CSS
- [x] Appliquer les poids corrects :
  - light : sous-titres/commentaires
  - medium : texte normal
  - bold : titres/texte important

### 7. REMPLACEMENT DES PROPRIÉTÉS DE DESIGN FLAT
**IMPORTANT : Standardiser borders, border-radius, box-shadow et supprimer gradients pour un design flat**
- [x] AppLayout.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] HomePage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] HomeConnectedPage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] SearchResultPage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] BottomNavigation.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] ProfilePage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] SettingsPage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] ChatPage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] CorePage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] CommonPage.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] TripleForm.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] AtomCreationModal.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] WeightModal.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] BookmarkStyles.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] LevelProgress.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] LiquidGlass.css - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)
- [x] style.css (principal) - standardiser borders, border-radius, box-shadow, supprimer gradients (flat design)

### 8. VÉRIFICATION ET NETTOYAGE FINAL
- [ ] Validation finale de la cohérence visuelle 
- [x] Rechercher toutes les anciennes couleurs hardcodées (hex, rgb, hsl)
- [x] Vérifier qu'aucune animation background ne reste
- [x] Vérifier qu'aucune référence orb ne reste
- [x] Vérifier que toutes les polices sont Overpass Mono
- [x] Tester que tous les variables CSS root sont utilisées
- [ ] Validation finale de la cohérence visuelle