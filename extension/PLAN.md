# Plan: Atom name = title, matching by URL

## Objective

Change atom `name` from normalized URL to actual page title, and match certifications by URL field instead of label. Fix normalization inconsistencies across the codebase.

**Key principle**: `name` = human-readable title (e.g., "Sinthetix", video title), `url` = the actual URL.

**Impact on IPFS/on-chain**: Changing `name` changes the IPFS URI → creates NEW atoms for future certifications. Old atoms (with URL as name) remain on-chain and will still be found via URL matching.

---

## Step 1: Create `normalizeUrl` utility

**New file**: `extension/lib/utils/normalizeUrl.ts`

```typescript
export function normalizeUrl(url: string): { label: string; isRootDomain: boolean } {
  const urlObj = new URL(url)
  let hostname = urlObj.hostname.toLowerCase()
  const pathname = urlObj.pathname
  if (hostname.startsWith('www.')) hostname = hostname.slice(4)
  const hasPath = pathname && pathname !== '/'
  const label = hasPath
    ? `${hostname}${pathname.replace(/\/$/, '')}`.toLowerCase()
    : hostname
  return { label, isRootDomain: !hasPath }
}
```

Rules: lowercase, no www, no trailing slash, pathname only (NO query params), no protocol.

---

## Step 2: Update `useIntentionCertify.ts` — accept `title` param, use as atom name

### `certifyWithIntention` (line 54)

**Change signature**: add `title?: string` parameter.

```typescript
certifyWithIntention: (
  url: string,
  intention: IntentionPurpose,
  title?: string,        // NEW: page title for atom name
  customWeight?: bigint
) => Promise<void>
```

**Change atom creation** (lines 91-131): use `normalizeUrl()` for label, use `title || pageLabel` as atom name.

```typescript
import { normalizeUrl } from '../lib/utils/normalizeUrl'

const { label: pageLabel } = normalizeUrl(url)
const atomName = title || pageLabel  // Use title if provided, fallback to URL
const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`

const result = await createTripleOnChain(
  predicateName,
  {
    name: atomName,              // "Sinthetix" or "youtube.com/watch"
    description: `Page: ${pageLabel}`,
    url: url,
    image: faviconUrl
  },
  weight
)
```

### `certifyWithCustomPredicate` (line 186)

Same change: add `title?: string` param, use `title || normalizedLabel` as atom name.

Update `IntentionCertifyResult` interface to include new signature.

---

## Step 3: Update `useCreateAtom.ts` — key results by URL

**Critical change**: `results[atomData.name]` → `results[atomData.url || atomData.name]`

This affects 7 lines: 123, 186, 231, 241, 496, 549, 565.

**Why this is safe**: The URL is always unique per atom. For predicate atoms (no URL), we fallback to `atomData.name`. The key is only used internally to retrieve vaultIds after creation.

---

## Step 4: Update `useCreateTripleOnChain.ts` — lookup by URL key

**Line 150**: `createdAtoms[objectData.name]` → `createdAtoms[objectData.url || objectData.name]`
**Line 153**: same change.

**Batch function** (line 385-393): update `uniqueObjects` Map key from `objectName` to `objData.url || objectName`, and update all lookups accordingly (lines 350, 385, 391, 392, 411, 448).

---

## Step 5: Update `GroupDetailView.tsx` — pass title through handlers

### `handleIntentionSelect` (line 360)

Add `title?: string` parameter. Use `normalizeUrl()` for pageLabel. Pass title to `certifyWithIntention`.

```typescript
const handleIntentionSelect = (url: string, intention: IntentionPurpose, title?: string) => {
  try {
    const { label: pageLabel } = normalizeUrl(url)
    const triplet = {
      id: `intention-${intention}`,
      triplet: { subject: 'I', predicate: INTENTION_PREDICATES[intention], object: title || pageLabel },
      description: `I ${INTENTION_PREDICATES[intention]} ${title || pageLabel}`,
      url, intention
    }
    // ...
  }
}
```

### Caller sites in JSX

Update `onIntentionSelect` calls to pass `urlRecord.title`:
```typescript
onClick={() => { onIntentionSelect(key, urlRecord.title); setIsExpanded(false) }}
```

### `handleModalSubmit`

Pass `title` from `pendingCertification` through to `certifyWithIntention`.
Store title in `pendingCertification`: `setPendingCertification({ url, intention, title })`.

---

## Step 6: Update `useUserCertifications.ts` — match by URL field

### GraphQL query (line 124-145)

Add `value { thing { url } }` to the object fragment:

```graphql
object {
  label
  value {
    thing {
      url
    }
  }
}
```

### Cache building (lines 169-207)

**Primary key**: use the URL from `object.value.thing.url` when available, normalized via `normalizeUrl()`.
**Fallback**: use `objectLabel` (for backward compat with old atoms that have URL as name).

```typescript
const objectUrl = triple.object?.value?.thing?.url
const objectLabel = triple.object?.label || ''

let cacheKey: string
if (objectUrl) {
  // New atoms: URL in the url field → normalize it
  const { label } = normalizeUrl(objectUrl)
  cacheKey = label
} else {
  // Old atoms: label IS the normalized URL
  cacheKey = objectLabel.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
}
```

### `getCertificationForUrl` (lines 296-331)

Replace with `normalizeUrl()` — NO query params:

```typescript
export function getCertificationForUrl(certifications, url) {
  try {
    const { label } = normalizeUrl(url)
    return certifications.get(label) || null
  } catch { return null }
}
```

---

## Step 7: Update `useGroupOnChainCertifications.ts` — fix matching

### `normalizeUrlToLabel` (lines 70-98)

Replace with `normalizeUrl()`:

```typescript
import { normalizeUrl } from '../lib/utils/normalizeUrl'

function normalizeUrlToLabel(url: string) {
  try {
    return normalizeUrl(url)
  } catch { return null }
}
```

---

## Step 8: Update `PageBlockchainCard.tsx` — normalize labels

**3 places** (~lines 141-148, 171-178, 572-577): replace manual `pageLabel` construction with `normalizeUrl()`.

```typescript
import { normalizeUrl } from '../../lib/utils/normalizeUrl'
const { label: pageLabel } = normalizeUrl(currentUrl)
```

---

## Files modified (summary)

| File | Change |
|------|--------|
| `extension/lib/utils/normalizeUrl.ts` | **NEW** — single source of truth |
| `extension/hooks/useIntentionCertify.ts` | Accept `title` param, use as atom name, use `normalizeUrl()` |
| `extension/hooks/useCreateAtom.ts` | Key results by `url \|\| name` instead of `name` |
| `extension/hooks/useCreateTripleOnChain.ts` | Lookup atoms by `url \|\| name` key |
| `extension/components/ui/GroupDetailView.tsx` | Pass `title` through handlers, use `normalizeUrl()` |
| `extension/hooks/useUserCertifications.ts` | Fetch URL field from GraphQL, match by URL, fix query params bug |
| `extension/hooks/useGroupOnChainCertifications.ts` | Use `normalizeUrl()` (no query params) |
| `extension/components/ui/PageBlockchainCard.tsx` | Normalize labels with `normalizeUrl()` |

## What does NOT change

- IPFS pinning format (still: `{ name, description, url, image }`)
- On-chain deduplication (IPFS URI → atom hash)
- Old atoms with URL-as-name remain valid and findable via URL matching

## Backward compatibility

Old atoms have `name = normalizedUrl` and `url = originalUrl`. The updated cache building in useUserCertifications reads the `url` field first (via `value.thing.url`), and falls back to `label` for old atoms. Both old and new certifications will be found.

## Verification

- Certify a YouTube video → atom created with `name: "Video Title"`, `url: "https://youtube.com/watch?v=abc"`
- Find that certification in cache → matched by `normalizeUrl("https://youtube.com/watch?v=abc")` = `youtube.com/watch` (no query params)
- WeightModal displays: "Video Title" (not the URL)
- Old certifications (URL as name) → still found via fallback matching
