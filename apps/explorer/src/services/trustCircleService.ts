import { useGetMyTrustCircleQuery } from '@0xsofia/dashboard-graphql'
import { getAddress } from 'viem'
import { SUBJECT_IDS, PREDICATE_IDS } from '../config'

export interface TrustCircleAccount {
  id: string
  termId: string
  tripleId: string
  label: string
  image: string | null
  walletAddress: string | undefined
  trustAmount: number
  createdAt: number
}

/**
 * Fetch accounts the user has trusted (I → TRUSTS → Account with positions)
 * Mirrors extension's useTrustCircle logic exactly.
 */
export async function fetchTrustCircle(walletAddress: string): Promise<TrustCircleAccount[]> {
  const checksumAddress = getAddress(walletAddress)

  const response = await useGetMyTrustCircleQuery.fetcher({
    subjectId: SUBJECT_IDS.I,
    predicateId: PREDICATE_IDS.TRUSTS,
    walletAddress: checksumAddress,
  })()

  if (!response?.triples) return []

  // Filter: only triples where user has positions with shares > 0
  const triplesWithPositions = response.triples.filter(
    (triple) => triple.term?.vaults?.some(
      (vault) => vault.positions.some((pos) => BigInt(pos.shares || '0') > 0n)
    )
  )

  const accounts: TrustCircleAccount[] = triplesWithPositions.map((triple) => {
    const atom = triple.object

    // Calculate trust amount from ALL vaults (curves) — same as extension
    const trustAmountWei = (triple.term?.vaults ?? []).reduce((vaultSum, vault) => {
      const vaultTotal = vault.positions.reduce((posSum, pos) => {
        return posSum + BigInt(pos.shares || '0')
      }, 0n)
      return vaultSum + vaultTotal
    }, 0n)

    const trustAmount = Number(trustAmountWei) / 1e18

    // Extract wallet address — same as extension
    let walletAddr: string | undefined
    if (atom?.data) {
      const data = atom.data.toLowerCase()
      if (data.startsWith('0x')) {
        walletAddr = data
      }
    } else if (atom?.label?.startsWith('0x')) {
      walletAddr = atom.label.toLowerCase()
    }

    return {
      id: triple.term_id,
      termId: atom?.term_id ?? '',
      tripleId: triple.term_id,
      label: atom?.label ?? triple.term_id.slice(0, 10),
      image: atom?.image ?? null,
      walletAddress: walletAddr,
      trustAmount,
      createdAt: new Date(triple.created_at).getTime(),
    }
  })

  // Sort by trust amount descending
  accounts.sort((a, b) => b.trustAmount - a.trustAmount)

  // Resolve missing avatars for ENS/box names
  const needsAvatar = accounts.filter((a) => !a.image && (a.label.endsWith('.eth') || a.label.endsWith('.box')))
  if (needsAvatar.length > 0) {
    await Promise.allSettled(
      needsAvatar.map(async (a) => {
        // 1. Try ENS metadata service (official, reliable)
        if (a.label.endsWith('.eth')) {
          a.image = `https://metadata.ens.domains/mainnet/avatar/${a.label}`
          return
        }
        // 2. ENSTATE for .box and others
        try {
          const res = await fetch(`https://enstate.rs/n/${a.label}`)
          if (res.ok) {
            const data = await res.json()
            if (data.avatar) a.image = data.avatar
          }
        } catch {}
      }),
    )
  }

  return accounts
}
