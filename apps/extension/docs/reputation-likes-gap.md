# Reputation: likes feed a user's reputation (likes-only)

**Status:** ✅ implemented on `feat/circle-redesign`. Verified: graphql codegen +
explorer typecheck (`tsc -b`) + 10/10 reputation unit tests + explorer build.

## What it does now

A user's reputation in a topic = the credibility (eigentrust composite score) of
the accounts that **liked** that topic of one of their Marks **after** them.

- A "like" (Circle support/oppose) stakes the `in context of` triple
  `(cert → topic)`. Reputation reads the stakers on that context triple, per
  topic.
- **Likes only** — a plain co-certification of the cert triple does **not**
  raise reputation. Rationale: the cert triple is topic-agnostic, so a second
  certifier may disagree (oppose) or tag a *different* topic; crediting them to
  all of the author's topics is noise. A like stakes the author's exact topic
  context → an unambiguous per-topic endorsement.
- Anti-Sybil: a liker with ~0 eigentrust score confers ~0 (a fresh account does
  not boost).
- Works in both apps unchanged — the extension already stakes the same context
  triples on a like.

## What changed (all explorer / graphql)

- `packages/graphql/src/queries/circle.graphql` → `GetUserContextAdditions` now
  returns the context triple's own `term_id` + `counter_term_id` (regen'd into
  `src/generated/index.ts`).
- `apps/explorer/src/services/userOnChainProfileService.ts` → `ContextAddition`
  exposes `contextTermId` / `contextCounterTermId`.
- `apps/explorer/src/hooks/useDerivedReputation.ts` and `useReputationBackers.ts`
  → build their claims from `profile.contextAdditions` (one context triple per
  topic, keyed by `contextTermId`, baselined at the author's `addedAt`) instead
  of `profile.certs`.
- `apps/explorer/src/services/derivedReputationService.ts` → unchanged logic
  (generic over the claim shape); only doc comments updated. The 10 unit tests
  still pass.

---

## ⚠️ Handoff to Maxim — "boost not always shown"

**Symptom:** on `/scores` (and profiles) the topic **boost** appears sometimes
and is 0 other times for the same profile.

**Cause:** it's NOT the likes-only calc — it's the remote **eigentrust trust
engine (MCP)** that supplies the credibility weights:

- Each address = a full server-side EigenTrust pass, throttled to 3 parallel
  (`eigentrustService.ts:24`). Slow under fan-out.
- On a transient MCP failure (timeout / rate-limit), that account contributes 0
  — the exact "sometimes it shows, sometimes not" case already documented at
  `apps/explorer/src/services/eigentrustService.ts:62-67`.
- `useEigentrustMap` has `staleTime: 30min` and `fetchEigentrustMap` resolves
  *successfully* even when some addresses timed out (they return 0, not throw).
  So a partial-timeout result is cached as "success" for 30 min → those likers
  stay at 0 until the cache goes stale. That's why a refresh later "fixes" it.

**This is your domain (the trust engine) — left untouched.** Suggested
directions when you pick it up:

1. **Don't cache partial failures as success.** `fetchEigentrustScore` already
   skips caching a per-address miss, but `useEigentrustMap`'s React Query entry
   caches the whole map (incl. the 0s) for 30 min. Consider shortening
   `staleTime` when any address resolved to 0, or marking the query for retry
   when the result is incomplete.
2. **Retry timed-out addresses** (small backoff) before settling them to 0.
3. **UI**: `ScoresPage.tsx` / `PublicProfilePage.tsx` read `derivedRep` but
   ignore `useDerivedReputation().loading`, so the boost renders as 0 during the
   async calc. Gating the boost on `loading` (a "calculating…" state instead of
   a 0) would remove the flicker regardless of the engine fix.

**Note for testing:** an account with no eigentrust score does not *give* a
boost (anti-Sybil), so you won't see a boost from your own likes — only from
credible accounts' likes on the viewed profile.

### Quick reference

| Concern | File |
|---|---|
| Reputation claims (now context triples) | `apps/explorer/src/hooks/useDerivedReputation.ts`, `useReputationBackers.ts` |
| Context-triple ids on profile | `apps/explorer/src/services/userOnChainProfileService.ts` (`ContextAddition`) |
| Pure calc (generic) | `apps/explorer/src/services/derivedReputationService.ts` |
| Credibility weights (the flaky step) | `apps/explorer/src/services/eigentrustService.ts`, `hooks/useEigentrustMap.ts` |
| Like target (both apps) | `apps/explorer/.../CircleFeedSection.tsx`, `apps/extension/.../CircleFeedTab.tsx` |
