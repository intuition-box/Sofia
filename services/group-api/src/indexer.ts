// Owner identity comes from on-chain: the group atom's creator wallet. We query
// the Intuition indexer once per group and seed an OWNER membership, so the
// approval flow has someone authorised from the very first request.
import { prisma } from './db'
import { env } from './env'

const GROUP_CREATOR_QUERY = `
  query GroupCreator($termId: String!) {
    atoms(where: { term_id: { _eq: $termId } }, limit: 1) {
      term_id
      creator { id }
    }
  }
`

/** Fetch the wallet that created a group atom (lowercased), or null. */
export async function fetchGroupOwner(groupTermId: string): Promise<string | null> {
  try {
    const res = await fetch(env.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GROUP_CREATOR_QUERY,
        variables: { termId: groupTermId },
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data?: { atoms?: Array<{ creator?: { id?: string } }> }
    }
    const creator = json.data?.atoms?.[0]?.creator?.id
    return creator ? creator.toLowerCase() : null
  } catch (err) {
    console.error('[indexer] fetchGroupOwner failed', err)
    return null
  }
}

/**
 * Ensure a group has its OWNER seeded from the on-chain creator. Idempotent +
 * concurrency-safe (the unique (wallet, groupTermId) constraint absorbs races).
 * Returns the owner wallet, or null if the indexer couldn't resolve it.
 */
export async function ensureGroupSeeded(groupTermId: string): Promise<string | null> {
  const existingOwner = await prisma.membership.findFirst({
    where: { groupTermId, role: 'OWNER' },
  })
  if (existingOwner) return existingOwner.wallet

  const owner = await fetchGroupOwner(groupTermId)
  if (!owner) return null

  try {
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
