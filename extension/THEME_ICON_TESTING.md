# Testing Theme-Aware Extension Icon

## Overview

L'extension SofIA change maintenant automatiquement son icône en fonction du thème du système (dark/light mode) de Chrome.

## Architecture

### Fichiers ajoutés

1. **Icon Assets** (`extension/assets/`)
   - `icon-light-{16,32,48,64,128}.png` - Icônes pour thème clair (logo noir)
   - `icon-dark-{16,32,48,64,128}.png` - Icônes pour thème sombre (logo blanc)

2. **Offscreen Document** (`extension/public/`)
   - `offscreen.html` - Document HTML minimal
   - `offscreen.js` - Détecte le thème système via `matchMedia('prefers-color-scheme: dark')`

3. **Theme Manager** (`extension/background/themeIconManager.ts`)
   - Crée et gère l'offscreen document
   - Écoute les messages de changement de thème
   - Met à jour l'icône via `chrome.action.setIcon()`

4. **Scripts** (`extension/scripts/`)
   - `generate-icons.js` - Génère les icônes de différentes tailles
   - `post-build.js` - Copie les fichiers offscreen après le build

### Modifications

- **`extension/background/index.ts`** - Initialise le système au démarrage
- **`extension/package.json`** - Ajout de la permission `offscreen` et du script post-build

## Comment ça marche ?

1. **Au démarrage de l'extension** :
   - Le service worker crée un offscreen document
   - L'offscreen document détecte le thème actuel
   - Il envoie un message `THEME_DETECTED` au service worker
   - Le service worker change l'icône en conséquence

2. **Lors d'un changement de thème** :
   - L'offscreen document détecte le changement via `matchMedia`
   - Il envoie un message `THEME_CHANGED` au service worker
   - Le service worker met à jour l'icône

## Guide de test

### Prérequis

1. Builder l'extension :
   ```bash
   cd extension/
   pnpm build
   ```

2. Charger l'extension dans Chrome :
   - Ouvrir `chrome://extensions/`
   - Activer "Mode développeur"
   - Cliquer "Charger l'extension non empaquetée"
   - Sélectionner `extension/build/chrome-mv3-prod/`

### Test 1 : Vérifier le thème initial

1. **Ouvrir les DevTools du service worker** :
   - Aller à `chrome://extensions/`
   - Trouver "SofIA"
   - Cliquer sur "Inspecter les vues" → "service worker"

2. **Vérifier les logs** :
   ```
   🎨 [index.ts] Initializing theme-aware icon system...
   🎨 [themeIconManager] Initializing theme-aware icon system...
   ✅ [themeIconManager] Offscreen document created
   🎨 [themeIconManager] Theme detected: light (ou dark)
   ✅ [themeIconManager] Icon updated successfully for light theme
   ```

3. **Vérifier l'icône** :
   - L'icône dans la barre d'extensions doit correspondre au thème actuel :
     - **Thème clair** → Icône noire (icon-light)
     - **Thème sombre** → Icône blanche (icon-dark)

### Test 2 : Tester le changement de thème

1. **Changer le thème Chrome** :
   - Ouvrir `chrome://settings/appearance`
   - Changer "Thème" de "Clair" à "Sombre" (ou vice versa)

2. **Observer l'icône** :
   - L'icône doit changer automatiquement après 1-2 secondes
   - Vérifier les logs du service worker :
     ```
     🎨 [offscreen.js] Theme changed to: dark
     🎨 [themeIconManager] Theme changed: dark
     ✅ [themeIconManager] Icon updated successfully for dark theme
     ```

### Test 3 : Vérifier les fichiers offscreen

1. **Vérifier que l'offscreen document existe** :
   - Dans les DevTools du service worker, exécuter :
     ```javascript
     chrome.runtime.getContexts({
       contextTypes: ['OFFSCREEN_DOCUMENT']
     }).then(console.log)
     ```
   - Doit retourner un contexte avec `documentUrl: "chrome-extension://[id]/offscreen.html"`

### Test 4 : Tester avec le mode automatique

1. **Définir Chrome sur "Auto"** :
   - `chrome://settings/appearance` → Thème → "Auto"

2. **Changer le thème système** :
   - **Windows** : Paramètres → Personnalisation → Couleurs
   - **macOS** : Préférences système → Général → Apparence
   - **Linux** : Dépend du DE (GNOME, KDE, etc.)

3. **Vérifier** que l'icône change automatiquement

## Résolution de problèmes

### L'icône ne change pas

1. **Vérifier que la permission `offscreen` est présente** :
   ```bash
   grep -i offscreen extension/build/chrome-mv3-prod/manifest.json
   ```

2. **Vérifier que les fichiers existent** :
   ```bash
   ls extension/build/chrome-mv3-prod/offscreen.*
   ls extension/build/chrome-mv3-prod/assets/icon-*.png
   ```

3. **Vérifier les logs du service worker** :
   - Rechercher des erreurs en rouge
   - Vérifier que l'offscreen document se crée bien

### Messages d'erreur

- **"Failed to create offscreen document"** :
  - Vérifier que `offscreen.html` existe dans le build
  - Vérifier la permission `offscreen` dans le manifest

- **"Failed to update icon"** :
  - Vérifier que les fichiers `icon-{light|dark}-*.png` existent dans `assets/`
  - Vérifier les chemins dans `themeIconManager.ts`

## Rebuild après modifications

Si tu modifies les fichiers source :

```bash
cd extension/

# Regénérer les icônes (si icon.png ou iconwhite.png ont changé)
pnpm generate-icons

# Rebuild l'extension (copie automatiquement les fichiers offscreen)
pnpm build
```

## Notes techniques

- **Offscreen Document API** : Requis car `window.matchMedia` n'est pas disponible dans les service workers MV3
- **Chrome uniquement** : Firefox supporte `theme_icons` nativement dans le manifest
- **Pas de support natif** : C'est un workaround car Chrome ne supporte pas encore les icônes adaptatives

## Références

- [Chrome Offscreen API](https://developer.chrome.com/docs/extensions/reference/offscreen/)
- [Chrome Action API - setIcon](https://developer.chrome.com/docs/extensions/reference/action/#method-setIcon)
- [W3C WebExtensions Issue #229](https://github.com/w3c/webextensions/issues/229)
