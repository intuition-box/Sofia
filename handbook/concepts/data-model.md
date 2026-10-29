# Data model: what Sofia writes on Intuition

Code: `packages/taxonomy/src` (`pageClaims.ts`, `intentionTags.ts`, `canonicalAtoms.ts`, `atomIds.ts`, `contextNodes.ts`) · explorer `services/pageMarketCartService.ts`, `contextCartService.ts`, `redeemService.ts`, `legacyMigrationService.ts` · extension `lib/config/predicateConstants.ts`, `lib/services/TripleService.ts` · relayer `src/policy.ts`. Terms: [glossary.md](glossary.md).

## One market per page

```
I ──recommends──▶ <page atom>          curve 2 (progressive)
│        └── counter vault = Oppose     curve 2
└── tags: <claim> ──in context of──▶ <tag atom>   curve 1
```

- **Subject**: Sofia's `I` atom `SOFIA_I_ATOM_ID` (`0x7ab197b3…cd016b`, the most used `I` on mainnet). Readers also accept the canonical `I` (`CANONICAL_I_ATOM_ID`) through `I_ATOM_IDS`; Sofia never writes with it.
- **Predicate**: `recommends`, from the canonical ontology (`CANONICAL_PREDICATE_IDS.recommends`).
- **Claim id**: computed locally, `recommendClaimId(page) = calculateTripleId(I, recommends, page)`.
- **Curve 2** for the page market: early backers get cheaper shares. Everything else (atom creation, tags, platform pools) uses **curve 1**.
- **Oppose** = deposit on the claim's counter vault, curve 2, only once the claim exists. The extension's "Distrust" maps to it.

## Tags

- A tag is a nested triple: subject = the claim, predicate `in context of`, object = a tag atom.
- **Intention tags**: atoms `for work`, `for learning`, `for fun`, `for inspiration`, `for buying`, `for music` (slug `intent:<key>`, minted 2026-10-20). They replace the old `visits for <key>` predicates. The `for ` prefix avoids collisions with categories ("Music").
- **Topics / categories**: atoms from `TOPIC_ATOM_IDS` / `CATEGORY_ATOM_IDS`. A category rolls up to its topic.
- A tag is **known** (registered atom id) or **to mint** (a frozen Thing payload `url: sofia:context:<slug>`, so every app mints the same atom). The write-relayer only uses known tags, 2 per page.
- Deposit 0.01 TRUST per tag.

## Page atoms

- A page atom is an IPFS Thing `{name, description, url, image}` pinned through the pin-proxy, then `createAtoms` with a 0 deposit on curve 1 (cost = `getAtomCost()` only).
- Same fields → same IPFS CID → same atom id: that's the only dedup at mint time. The extension builds the fields with `pageAtomData()` everywhere (right-click, free path) and suggests existing atoms in "Add to Sofia". Several atoms for one URL exist anyway on Intuition; the explorer groups them at read time by normalized URL (`utils/webAtom.ts`).

## Legacy claims

- Before the page market, each intention was its own claim: `I / visits for work / page` (and learning — with a trailing-space variant on chain —, fun, inspiration, buying, music), plus `trusts` and `distrust`.
- They are **no longer created** but still read everywhere (`PAGE_CLAIM_PREDICATE_LABELS`); their positions keep counting.
- **Migration** (explorer, `/positions` banner): exits a user's legacy legs on both curves (`redeemBatch`, 0.75% exit fee), then prefills the cart with one Recommend per page for the amount recovered plus the old intentions as tags. Only pages above a threshold (0.5 / 1 / 5 TRUST, default 1), support side only. The user confirms.

## Platforms and pools

- **Platform atoms**: `PLATFORM_ATOM_IDS`; the catalog comes from on-chain `has tag` links between platforms and categories. A platform's market sums all its curve vaults.
- **Platform pool** (extension): a share of a Recommend (default 10%, 0–80%) goes to the page's platform atom on curve 1, **taken out of** the stake, in the same transaction. Skipped under 0.01 TRUST.
- **Beta Season Pool**: retired. Its vault (`SEASON_POOL_TERM_ID`) shows as "ended" on `/positions`; positions can still be withdrawn.

## Fees and approval

- Every write goes through **SofiaFeeProxy** (`0x26F81d72…212c6c`) in front of **MultiVault** (`0x6E35cF57…784Fe7e`): `depositFixedFee` per deposit entry + `depositPercentageFee` on the amount, `creationFixedFee` per created term. Cost helpers: `getAtomCost`, `getTripleCost`, `getTotalDepositCost`, `getTotalCreationCost`, `calculateDepositFee`.
- Every write takes a **`receiver`**: the shares go to it, whoever sends the transaction (wallet, session key, smart account, relayer).
- MultiVault only lets the proxy deposit for a receiver that called `approve(proxy, DEPOSIT)` once — otherwise `MultiVault_SenderNotApproved` (`0xd76f6ff8`). The explorer probes it by simulation, the extension caches it, the relayer exposes `GET /sponsor/approval`.
- Exits (`redeem`) call MultiVault directly, on both curves.

## Ids and minimums

- Term ids are computed locally (`apps/explorer/src/lib/contracts/termIds.ts`, same in the relayer): `tripleId = keccak256(TRIPLE_SALT, s, p, o)`, `counterId = keccak256(COUNTER_SALT, tripleId)` — verified against indexed triples. No RPC call needed.
- Minimum deposit: **0.01 TRUST** (below: `MultiVault_DepositBelowMinimumDeposit`). After fees a 0.01 deposit lands as ~0.0097–0.0099, hence missions count from 0.009.
- Extension quick publish (right-click with a session): 0.5 TRUST. Cart presets: 0.01 / 0.5 / 1 TRUST.
- Batches: 35 creations / 80 deposits per transaction (~32M gas cap per transaction on Intuition).

## Known inconsistencies

- Tags created by the **extension** go through `TripleService.createTriplesBatch`, which creates on curve 2; the explorer and the relayer create tags on curve 1.
