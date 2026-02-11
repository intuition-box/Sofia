/**
 * EchoesTab Component
 * Displays intention groups as a bento grid with detail view
 */

import { useEffect, useRef } from 'react'
import { useIntentionGroups, useGoldSystem, type SortOption } from '../../../hooks'
import GroupBentoCard from '../../ui/GroupBentoCard'
import GroupDetailView from '../../ui/GroupDetailView'
import SofiaLoader from '../../ui/SofiaLoader'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/CommonPage.css'

const EchoesTab = () => {
  const { totalGold } = useGoldSystem()
  const {
    groups,
    selectedGroup,
    isLoading,
    error,
    sortBy,
    setSortBy,
    loadGroups,
    selectGroup,
    certifyUrl,
    removeUrl,
    refreshGroup,
    deleteGroup
  } = useIntentionGroups()

  // Auto-delete groups with 0 active URLs (use ref to avoid infinite loop)
  const deletedGroupsRef = useRef(new Set<string>())
  useEffect(() => {
    const emptyGroups = groups.filter(g => g.activeUrlCount === 0 && !g.isVirtualGroup && !g.urls.some(u => u.oauthPredicate) && !deletedGroupsRef.current.has(g.id))
    if (emptyGroups.length === 0) return
    for (const group of emptyGroups) {
      deletedGroupsRef.current.add(group.id)
      deleteGroup(group.id)
    }
  }, [groups, deleteGroup])

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'level', label: 'Level' },
    { value: 'urls', label: 'URLs' },
    { value: 'alphabetic', label: 'A-Z' },
    { value: 'recent', label: 'Recent' }
  ]

  // Filter out ENS names (.eth) and wallet addresses (0x)
  const filteredGroups = groups.filter(g =>
    !g.domain.endsWith('.eth') && !g.domain.startsWith('0x')
  )

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const confirmed = window.confirm(
      `Delete "${group.domain}"?\n\n` +
      `⚠️ This will only remove the group from your local view.\n` +
      `Your on-chain certifications will remain on the blockchain and won't be affected.`
    )

    if (confirmed) {
      await deleteGroup(groupId)
    }
  }

  // Show detail view if a group is selected
  if (selectedGroup) {
    return (
      <div className="triples-container">
        <GroupDetailView
          group={selectedGroup}
          onBack={() => selectGroup(null)}
          onCertifyUrl={(url, cert) => certifyUrl(selectedGroup.id, url, cert)}
          onRemoveUrl={(url) => removeUrl(selectedGroup.id, url)}
          onRefresh={() => refreshGroup(selectedGroup.id)}
        />
      </div>
    )
  }

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <div className="triples-container">
        <div className="groups-loading">
          <SofiaLoader size={60} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="triples-container">
        <div className="groups-error">
          <p>Failed to load groups</p>
          <button onClick={loadGroups} className="refresh-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredGroups.length === 0) {
    return (
      <div className="triples-container">
        <div className="groups-empty">
          <p>No browsing groups yet</p>
          <p className="empty-subtext">
            Continue browsing and your visited sites will appear here
          </p>
        </div>
      </div>
    )
  }

  // All cards same size
  const getCardSize = (): 'small' | 'tall' => {
    return 'small'
  }

  return (
    <div className="triples-container">
      <div className="groups-section">
        <div className="groups-header">
          <span className="groups-gold-badge">{totalGold} Gold</span>
          <div className="sort-buttons">
            {sortOptions.map(option => (
              <button
                key={option.value}
                className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {/* Unlock Proofs CTA */}
        


        <div className="bento-grid">
          {filteredGroups.map((group) => (
            <GroupBentoCard
              key={group.id}
              group={group}
              onClick={() => selectGroup(group.id)}
              onDelete={handleDeleteGroup}
              size={getCardSize()}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default EchoesTab
