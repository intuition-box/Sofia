/**
 * ExplorerPanel - Global account search and discovery
 */

import { useState } from 'react'
import { useRouter } from '../../../layout/RouterProvider'
import type { AccountAtom } from '../../../../hooks/useGetAtomAccount'
import { FollowSearchBox } from './FollowSearchBox'
import '../../../styles/CoreComponents.css'
import '../../../styles/FollowTab.css'

interface ExplorerPanelProps {
  walletAddress: string | undefined
}

export function ExplorerPanel({ walletAddress }: ExplorerPanelProps) {
  const { navigateTo } = useRouter()

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
          console.log('✅ Follow successful from explorer')
        }}
        placeholder="Search all accounts on Intuition..."
      />
    </div>
  )
}
