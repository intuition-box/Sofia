/**
 * Claim supporters types — the ordered stakers per claim (support + oppose)
 * that the derived-reputation calc consumes. Pure types; the data fetcher
 * lives in the explorer (claimSupportersService).
 */

export interface ClaimStaker {
  /** Staker wallet address. */
  account: string
  /** ISO timestamp of the position — the ordering key (asc = Pioneer first). */
  createdAt: string
  /** Raw shares (bigint string). Financial only — NOT used for reputation. */
  shares: string
}

export interface ClaimSupporters {
  /** Ordered support positions (index 0 = first staker / Pioneer). */
  support: ClaimStaker[]
  /** Ordered oppose positions (counter_term). */
  oppose: ClaimStaker[]
}
