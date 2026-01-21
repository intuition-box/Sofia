/**
 * EchoesGroupsSection Component
 * Displays intention groups as a bento grid with detail view
 */

import { useIntentionGroups, SortOption } from '../../hooks/useIntentionGroups'
import GroupBentoCard from './GroupBentoCard'
import GroupDetailView from './GroupDetailView'
import SofiaLoader from './SofiaLoader'
import '../styles/CommonPage.css'

const EchoesGroupsSection = () => {
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'level', label: 'Level' },
    { value: 'urls', label: 'URLs' },
    { value: 'alphabetic', label: 'A-Z' },
    { value: 'recent', label: 'Recent' }
  ]

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
      <GroupDetailView
        group={selectedGroup}
        onBack={() => selectGroup(null)}
        onCertifyUrl={(url, cert) => certifyUrl(selectedGroup.id, url, cert)}
        onRemoveUrl={(url) => removeUrl(selectedGroup.id, url)}
        onRefresh={() => refreshGroup(selectedGroup.id)}
      />
    )
  }

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <div className="groups-loading">
        <SofiaLoader size={60} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="groups-error">
        <p>Failed to load groups</p>
        <button onClick={loadGroups} className="refresh-button">
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (groups.length === 0) {
    return (
      <div className="groups-empty">
        <p>No browsing groups yet</p>
        <p className="empty-subtext">
          Continue browsing and your visited sites will appear here
        </p>
      </div>
    )
  }

  // All cards same size
  const getCardSize = (): 'small' | 'tall' => {
    return 'small'
  }

  return (
    <div className="groups-section">
      <div className="groups-header">
        <span className="groups-count">{groups.length} domains</span>
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

      <div className="bento-grid">
        {groups.map((group) => (
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
  )
}

export default EchoesGroupsSection
