/**
 * ExplorerPanel - Global account search and discovery
 * Shows top 10 most active Sofia accounts + search
 */

import { useMemo } from 'react'
import { useRouter } from '../../../layout/RouterProvider'
import SofiaLoader from '../../../ui/SofiaLoader'
import type { AccountAtom } from '../../../../hooks'
import { useGetTopSofiaAccountsQuery } from '@0xsofia/graphql'
import { SOFIA_PROXY_ADDRESS } from '../../../../lib/config/chainConfig'
import { FollowSearchBox } from './FollowSearchBox'
import Avatar from '../../../ui/Avatar'
import { createHookLogger } from '../../../../lib/utils/logger'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

const logger = createHookLogger('ExplorerPanel')

interface ExplorerPanelProps {
  walletAddress: string | undefined
}

interface TopAccount {
  walletAddress: string
  label: string
  image?: string | null
  termId?: string
  txCount: number
}

export function ExplorerPanel({ walletAddress }: ExplorerPanelProps) {
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

  // Aggregate deposits by receiver to get top accounts by tx count
  const topAccounts = useMemo<TopAccount[]>(() => {
    if (!data?.deposits) return []

    const countMap = new Map<string, TopAccount>()

    for (const deposit of data.deposits) {
      const id = deposit.receiver_id
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
  }, [data])

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

  const handleTopAccountClick = (account: TopAccount) => {
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
        onFollowSuccess={() => {
          logger.debug('Follow successful from explorer')
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
                onClick={() => handleTopAccountClick(account)}
                style={{ cursor: 'pointer' }}
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
                    <span className="trust-amount">
                      {account.txCount} signals
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
