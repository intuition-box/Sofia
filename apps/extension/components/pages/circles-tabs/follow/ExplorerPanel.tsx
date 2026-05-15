/**
 * ExplorerPanel - Global account search and discovery
 * Shows top 10 most active Sofia accounts + search
 */

import { useMemo } from 'react'
import { UserPlus } from 'lucide-react'
import { useRouter } from '../../../layout/RouterProvider'
import SofiaLoader from '../../../ui/SofiaLoader'
import { useCheckFollowStatus, type AccountAtom } from '../../../../hooks'
import { useGetTopSofiaAccountsQuery } from '@0xsofia/graphql'
import { SOFIA_PROXY_ADDRESS } from '../../../../lib/config/chainConfig'
import { FollowSearchBox } from './FollowSearchBox'
import Avatar from '../../../ui/Avatar'
import TrustAccountButton from '../../../ui/TrustAccountButton'
import { createHookLogger } from '../../../../lib/utils/logger'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

const logger = createHookLogger('ExplorerPanel')

/**
 * Renders the trust action for a Top Account row. Shows a disabled
 * "Trusted ✓" button when the account is already in the connected user's
 * trust circle, otherwise the standard "+ add" button.
 */
function TopAccountTrustAction({
  termId,
  label,
  onTrustAdded
}: {
  termId: string
  label: string
  onTrustAdded?: () => void
}) {
  const followStatus = useCheckFollowStatus(termId)

  if (followStatus.loading) {
    return (
      <button
        className="follow-button salmon-gradient-button"
        disabled
      >
        Loading...
      </button>
    )
  }

  if (followStatus.isTrusting) {
    return (
      <button
        className="follow-button salmon-gradient-button"
        disabled
      >
        Trusted ✓
      </button>
    )
  }

  return (
    <TrustAccountButton
      accountTermId={termId}
      accountLabel={label}
      label={<><UserPlus size={12} /> add</>}
      initialWeight="light"
      className="explorer-add-btn"
      onSuccess={() => {
        logger.debug('Trust triple created from explorer top accounts')
        followStatus.refetch()
        onTrustAdded?.()
      }}
    />
  )
}

interface ExplorerPanelProps {
  walletAddress: string | undefined
  /** Called after a successful trust action so the parent can redirect
      the user to the My Trust Circle members view. */
  onTrustAdded?: () => void
}

interface TopAccount {
  walletAddress: string
  label: string
  image?: string | null
  termId?: string
  txCount: number
}

export function ExplorerPanel({ walletAddress, onTrustAdded }: ExplorerPanelProps) {
  const { navigateTo } = useRouter()

  const sevenDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }, [])

  const { data, isLoading, error } = useGetTopSofiaAccountsQuery(
    { proxy: SOFIA_PROXY_ADDRESS, since: sevenDaysAgo },
    { enabled: !!walletAddress, staleTime: 60000 }
  )

  // Aggregate deposits by receiver to get top accounts by tx count.
  // Skip the connected user — they shouldn't be invited to their own circle.
  const topAccounts = useMemo<TopAccount[]>(() => {
    if (!data?.deposits) return []

    const selfWallet = walletAddress?.toLowerCase()
    const countMap = new Map<string, TopAccount>()

    for (const deposit of data.deposits) {
      const id = deposit.receiver_id
      if (selfWallet && id.toLowerCase() === selfWallet) continue
      const existing = countMap.get(id)
      if (existing) {
        existing.txCount++
      } else {
        countMap.set(id, {
          walletAddress: id,
          label: deposit.receiver?.label ?? id,
          image: deposit.receiver?.image,
          termId: deposit.receiver?.atom?.term_id,
          txCount: 1
        })
      }
    }

    return Array.from(countMap.values())
      .sort((a, b) => b.txCount - a.txCount)
      .slice(0, 10)
  }, [data, walletAddress])

  const handleSearchResultClick = (account: AccountAtom) => {
    navigateTo('user-profile', {
      termId: account.id,
      label: account.label,
      image: account.image,
      walletAddress: account.data,
      url: undefined,
      description: undefined
    })
  }

  const handleViewProfile = (account: TopAccount) => {
    navigateTo('user-profile', {
      termId: account.termId ?? '',
      label: account.label,
      image: account.image ?? undefined,
      walletAddress: account.walletAddress,
      url: undefined,
      description: undefined
    })
  }

  if (!walletAddress) {
    return (
      <div className="follow-panel">
        <div className="empty-state">
          <p>Connect wallet to explore accounts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="follow-panel">
      <FollowSearchBox
        onSelectAccount={handleSearchResultClick}
        onTrustSuccess={() => {
          logger.debug('Trust triple created from explorer search')
          onTrustAdded?.()
        }}
        placeholder="Search all accounts on Intuition..."
      />

      <div className="explorer-top-accounts">
        <h3 className="explorer-section-title">Most Active on Sofia (7 days)</h3>

        {isLoading && (
          <div className="loading-state">
            <SofiaLoader size={150} />
          </div>
        )}

        {error && !isLoading && (
          <div className="error-state">
            <p>Failed to load top accounts</p>
          </div>
        )}

        {!isLoading && !error && topAccounts.length === 0 && (
          <div className="empty-state">
            <p>No accounts found</p>
          </div>
        )}

        {!isLoading && !error && topAccounts.length > 0 && (
          <div className="followed-accounts">
            {topAccounts.map((account, index) => (
              <div
                key={account.walletAddress}
                className="followed-account-card"
              >
                <div className="account-left">
                  <span className="account-number">{index + 1}</span>
                  <Avatar
                    imgSrc={account.image}
                    name={account.label}
                    avatarClassName="account-avatar"
                    size="medium"
                  />
                  <div className="account-info">
                    <span className="account-label">{account.label}</span>
                  </div>
                </div>
                <div className="account-right explorer-card-actions">
                  <button
                    type="button"
                    className="explorer-view-profile-btn"
                    onClick={() => handleViewProfile(account)}
                  >
                    View profile
                  </button>
                  {account.termId && account.termId.length === 66 && (
                    <TopAccountTrustAction
                      termId={account.termId}
                      label={account.label}
                      onTrustAdded={onTrustAdded}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
