/**
 * EchoesGroupsSection Component
 * Displays intention groups as a bento grid with detail view
 */

import { useIntentionGroups } from '../../hooks/useIntentionGroups'
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
    loadGroups,
    selectGroup,
    certifyUrl,
    removeUrl
  } = useIntentionGroups()

  // Show detail view if a group is selected
  if (selectedGroup) {
    return (
      <GroupDetailView
        group={selectedGroup}
        onBack={() => selectGroup(null)}
        onCertifyUrl={(url, cert) => certifyUrl(selectedGroup.id, url, cert)}
        onRemoveUrl={(url) => removeUrl(selectedGroup.id, url)}
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

  // Assign sizes to cards for visual interest
  const getCardSize = (index: number, urlCount: number): 'small' | 'tall' => {
    // Make cards with more URLs taller
    if (urlCount >= 5 && index % 3 === 0) return 'tall'
    return 'small'
  }

  return (
    <div className="groups-section">
      <div className="groups-header">
        <h3 className="groups-title">Your browsing groups</h3>
        <span className="groups-count">{groups.length} domains</span>
      </div>

      <div className="bento-grid">
        {groups.map((group, index) => (
          <GroupBentoCard
            key={group.id}
            group={group}
            onClick={() => selectGroup(group.id)}
            size={getCardSize(index, group.activeUrlCount)}
          />
        ))}
      </div>
    </div>
  )
}

export default EchoesGroupsSection
