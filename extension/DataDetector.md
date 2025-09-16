# DataDetector - Automatic Triplet Generation

## Overview
Automatically detects auth tokens and API calls to create behavioral triplets from user actions.

## How it works

1. **Extracts auth tokens** from localStorage, sessionStorage, cookies
2. **Intercepts API calls** (fetch, XMLHttpRequest)
3. **Analyzes patterns** to detect user actions
4. **Creates triplets** in format: "You [action] [object]"
5. **Stores automatically** in IndexedDB

## Supported platforms

- **GitHub**: starred, followed, explored repositories
- **LinkedIn**: viewed profiles, browsed feed  
- **Twitter**: browsed timeline
- **Generic**: liked, followed, saved content (via API calls)

## Token detection

Searches for common tokens:
- `authToken`, `access_token`, `jwt`, `session`, `token`
- `github_token`, `_gh_sess` (GitHub)
- `JSESSIONID`, `li_at` (LinkedIn)
- `auth_token`, `ct0` (Twitter)
- `reddit_session` (Reddit)

## API call patterns

Detects:
- `/api/`, `/graphql`, `/rest/`, `/v1/`, `/v2/`, `/v3/`
- `/like`, `/favorite` → "You liked content"
- `/follow` → "You followed user/content"
- `/bookmark`, `/save` → "You saved content"

## Example triplets

```
You starred tensorflow/tensorflow
You viewed LinkedIn profile
You liked content
You followed user
You browsed Twitter timeline
```

## Architecture

```
Page loads → DataDetector activates → 
Extract tokens + Intercept APIs → 
Analyze patterns → Create triplets → 
Send to background → Store in IndexedDB
```

## Files

- `contents/dataDetector.ts` - Main detection script
- `background/messageHandlers.ts` - Storage handler (`STORE_DETECTED_TRIPLETS`)





  1. Analyser la structure DOM de Twitter

  - Examiner comment Twitter structure ses boutons follow
  - Identifier les attributs ou classes CSS qui indiquent le vrai état
  - Chercher des data-attributes ou states cachés

  2. Améliorer la détection d'état

  - Ne plus se fier uniquement au textContent
  - Utiliser les classes CSS du bouton (ex: .following, .not-following)
  - Chercher des attributs comme data-state, aria-pressed, etc.
  - Analyser les styles computed pour voir l'état réel

  3. Logique de détection robuste

  - Créer une hiérarchie de détection : attributs > classes > texte
  - Inverser la logique si nécessaire selon les patterns Twitter
  - Ajouter des fallbacks basés sur le contexte de la page

  4. Tests complets

  - Tester sur différents états de boutons Twitter
  - Vérifier la cohérence entre état visuel et détection
  - S'assurer que follow → "followed" et unfollow → "unfollowed"

  Le problème est donc que Twitter "ment" dans le DOM et on doit détecter l'état