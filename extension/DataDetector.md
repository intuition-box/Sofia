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