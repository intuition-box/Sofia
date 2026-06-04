# Reputation gap — likes don't feed a user's reputation

**Status:** documented, not yet fixed. Waiting on the in-flight code-review
Claude to land its commit, then implement on top.

**TL;DR:** A "like" (support/oppose from the Circle feed) stakes the cert's
`in context of` **context triples**, but the reputation calc only reads stakers
on the **cert triple** (the `visits for X` / `trusts` vault). The two never
meet, so a like does **not** raise the liked user's reputation — in **either**
the explorer or the extension. This is a shared gap, not an extension↔explorer
drift.

---

## Intended behaviour (what we want)

A user who **invests/stakes on a cert (its claim + its category/topic context)
after the original author** is "backing" that author. That backing should raise
the **author's** reputation, **per topic/category**, weighted by the backer's
eigentrust credibility (anti-Sybil: unknown/new accounts contribute 0).

In other words: **a like = a backing position placed after the author, and it
must feed the author's reputation score** — from the explorer *and* the
extension.

---

## Current behaviour (verified in source)

### 1. The like stakes the `in context of` context triples

- **Explorer** — `apps/explorer/src/components/circles/CircleFeedSection.tsx`
  (`handleDeposit`, ~L97–120): the cart `termId` is
  `c.termId` / `c.counterTermId` of each `contextTriple` (the
  `(cert, in context of, topic)` triple), **not** the cert triple. A cert with
  no topic context has nothing to stake → thumbs disabled (no-op).
- **Extension** — `apps/extension/components/pages/circles-tabs/CircleFeedTab.tsx`
  (`addVotesToCart`): fans a vote out to each context's
  `supportTermId` / `opposeTermId` (the `in context of` triple vaults), with a
  **fallback to the cert triple** only when the card has no context at all.

So both apps deposit on the **context triples** for a normal (topic-tagged)
like. They are already aligned with each other.

### 2. Reputation reads stakers on the cert triple (not the context triple)

- `apps/explorer/src/hooks/useDerivedReputation.ts:39`
  `const claimIds = certs.map((c) => c.termId)` → these are the **cert triple**
  term_ids.
- `apps/explorer/src/services/userOnChainProfileService.ts` (~L194–235):
  `cert.termId = t.term_id` of the `GetUserCertsAlltime` triple (predicate
  `visits for X` / `trusts` / `distrust`). `topicSlugs` come from the
  `in context of` **links** (`GetCertTopicLinks`) and are used only to *bucket*
  the score by topic — the stakers themselves are read from the cert triple.
- `apps/explorer/src/services/claimSupportersService.ts:49–75`
  (`fetchClaimSupporters`): reads the time-ordered `positions` on the given
  term_ids (the cert triples).
- `apps/explorer/src/services/derivedReputationService.ts:57–100`
  (`followersAfter` + `computeDerivedReputation`): for each cert, keep stakers
  whose `createdAt > author's certifiedAt`, exclude the author, sum their
  `credibility`, and add that to every topic the cert is tagged with.

### 3. Why they don't meet

The like writes a position on the **context triple's** vault; reputation reads
positions on the **cert triple's** vault. Disjoint vaults → the like is never
counted. What *does* raise reputation today is someone **re-certifying the same
claim** (staking the cert triple) after the author — i.e. a co-certification,
not a like.

---

## Proposed fix (Option A — recommended)

Make the reputation calc read stakers on the **`in context of` context triples,
per topic/category**, so a like maps 1:1 to a backing position on the exact
topic it was placed on. Keep the existing cert-triple path too if we still want
co-certifications to count (see "Open question" below).

Implementation sketch (all in the explorer; the extension already stakes the
right triples, so the fix propagates to both automatically):

1. **Expose the context triple's own term_id + counter_term_id.**
   `packages/graphql/src/queries/circle.graphql` → `GetCertTopicLinks` currently
   selects only `subject_id` (cert) and `object_id` (topic atom). Add `term_id`
   and `counter_term_id` (the context triple's own vault ids).

2. **Thread them through the profile layer.**
   `userOnChainProfileService.ts`: build a per-`(cert, topic)` record carrying
   `{ topicSlug, contextTermId, contextCounterTermId, addedAt }` (addedAt =
   when the author created/staked the context triple — the ordering baseline).
   Today it only keeps `topicAtomIds` / `topicSlugs`.

3. **Use context triples as the reputation claims.**
   `useDerivedReputation.ts` / `derivedReputationService.ts`: instead of
   `claimIds = certs.map(c => c.termId)`, collect the **context triple** term_ids
   and run `useClaimSupporters` on them. In `computeDerivedReputation`, attribute
   each context triple's qualifying stakers (after the author, credible) to **its
   own topic** (not to all of the cert's topics). This also makes the per-topic
   score more precise than the current "credit every topic on the cert" model.

4. **Ordering baseline.** Use the author's position timestamp on the context
   triple (or the cert's `certifiedAt`) as the `> userTs` cutoff in
   `followersAfter`, so only backers who came *after* the author count.

Net result: a like (explorer or extension) = a position on a context triple
placed after the author → counted as backing → raises the author's reputation
for that topic, weighted by the liker's credibility.

## Alternative (Option B — not recommended)

Make the like stake the **cert triple** instead of the context triples. Simpler
on the reputation side (no calc change), but a single like would credit **all**
of the cert's topics (loses per-topic granularity) and changes the like's
on-chain semantics in both apps. Rejected unless we deliberately want
non-topic-scoped likes.

---

## Open question for the fix PR

Should reputation count **both** (a) context-triple backers (likes) **and**
(b) cert-triple backers (co-certifications), or **only** likes? Per the product
intent ("someone who invests on the cert + category after the first user backs
them"), likes (a) are the priority; whether co-certifications (b) should also
count is a product call to confirm before implementing.

---

## File reference index

| Concern | File | Notes |
|---|---|---|
| Explorer like target | `apps/explorer/src/components/circles/CircleFeedSection.tsx` (~L97–120) | stakes context triple `termId`/`counterTermId` |
| Extension like target | `apps/extension/components/pages/circles-tabs/CircleFeedTab.tsx` (`addVotesToCart`) | context triples, fallback cert triple |
| Reputation claim ids | `apps/explorer/src/hooks/useDerivedReputation.ts:39` | `certs.map(c => c.termId)` = cert triples |
| Cert termId source | `apps/explorer/src/services/userOnChainProfileService.ts` (~L194–235) | cert triple term_id; topicSlugs from `GetCertTopicLinks` |
| Supporters fetch | `apps/explorer/src/services/claimSupportersService.ts:49–75` | positions on the given term_ids |
| Reputation calc | `apps/explorer/src/services/derivedReputationService.ts:57–100` | `followersAfter` + `computeDerivedReputation` |
| Topic-links query | `packages/graphql/src/queries/circle.graphql` → `GetCertTopicLinks` | needs `term_id` + `counter_term_id` added |
