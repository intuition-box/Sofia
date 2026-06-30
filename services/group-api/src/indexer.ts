// Owner identity comes from on-chain, but NOT from the atom's `creator` field —
// that is always the SofiaFeeProxy (or a deployer wallet), never the human who
// created the circle. We resolve the owner from the relationship triples
// instead: a dedicated `circle_owner` triple when present, else the earliest
// `MEMBER_OF` triple (minted in the same batch as the circle atom). See
// `predicates.ts`. We seed an OWNER membership from this so the approval flow
// has someone authorised from the very first request.
import { prisma } from './db'
import { env } from './env'
import { MEMBER_OF_PREDICATE_IDS } from './predicates'

// Two aliased lookups in one round-trip: the dedicated owner triple (preferred)
// and the earliest membership (fallback). The circle is always the triple's
// OBJECT; the human owner is the subject atom's account.
const GROUP_OWNER_QUERY = `
  query GroupOwner($termId: String!, $ownerPred: String!, $memberPreds: [String!]!) {
    owner: triples(
      where: { object_id: { _eq: $termId }, predicate_id: { _eq: $ownerPred } }
      order_by: { created_at: asc }
      limit: 1
    ) { subject { value { account { id } } } }
    member: triples(
      where: { object_id: { _eq: $termId }, predicate_id: { _in: $memberPreds } }
      order_by: { created_at: asc }
      limit: 1
    ) { subject { value { account { id } } } }
  }
`

type OwnerRow = { subject?: { value?: { account?: { id?: string } } } }

/** First row's subject-account wallet, lowercased, or null. */
function pickWallet(rows?: OwnerRow[]): string | null {
  const id = rows?.[0]?.subject?.value?.account?.id
  return id ? id.toLowerCase() : null
}

/** Resolve a group's human owner wallet (lowercased) from on-chain triples, or
 *  null when the indexer has no owner/membership signal for it yet. */
export async function fetchGroupOwner(
  groupTermId: string,
): Promise<string | null> {
  try {
    const res = await fetch(env.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GROUP_OWNER_QUERY,
        variables: {
          termId: groupTermId,
          // Empty when unminted — the `_eq: ""` owner lookup simply returns
          // nothing and we fall through to the membership signal.
          ownerPred: env.circleOwnerPredicateId,
          memberPreds: [...MEMBER_OF_PREDICATE_IDS],
        },
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data?: { owner?: OwnerRow[]; member?: OwnerRow[] }
    }
    return pickWallet(json.data?.owner) ?? pickWallet(json.data?.member)
  } catch (err) {
    console.error('[indexer] fetchGroupOwner failed', err)
    return null
  }
}

/**
 * Ensure a group has its OWNER seeded from on-chain (see `fetchGroupOwner`).
 * Idempotent + concurrency-safe (the unique (wallet, groupTermId) constraint
 * absorbs races). Self-heals a stale proxy OWNER left by the old creator-based
 * logic. Returns the owner wallet, or null if the indexer can't resolve it.
 */
export async function ensureGroupSeeded(
  groupTermId: string,
): Promise<string | null> {
  const existingOwner = await prisma.membership.findFirst({
    where: { groupTermId, role: 'OWNER' },
  })
  // A real human owner already seeded — done. But an OWNER row holding the fee
  // proxy is a stale seed from the old `creator`-based logic: fall through and
  // re-resolve from the membership/owner triples.
  const staleProxyOwner = existingOwner?.wallet === env.feeProxyAddress
  if (existingOwner && !staleProxyOwner) return existingOwner.wallet

  const owner = await fetchGroupOwner(groupTermId)
  if (!owner) return null

  try {
    // Drop the stale proxy OWNER (different wallet = different PK row) before
    // writing the real owner.
    if (staleProxyOwner && existingOwner && existingOwner.wallet !== owner) {
      await prisma.membership.delete({
        where: {
          wallet_groupTermId: {
            wallet: existingOwner.wallet,
            groupTermId,
          },
        },
      })
    }
    await prisma.membership.upsert({
      where: { wallet_groupTermId: { wallet: owner, groupTermId } },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: {
        wallet: owner,
        groupTermId,
        role: 'OWNER',
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    })
    await prisma.event.create({
      data: { groupTermId, actorWallet: owner, type: 'OWNER_SEEDED' },
    })
  } catch (err) {
    console.error('[indexer] seed owner failed', err)
  }
  return owner
}
