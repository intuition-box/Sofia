/**
 * EchoesTab Component
 * Displays intention groups as a bento grid with detail view
 */

import { useEffect, useRef, useState } from "react"

import { userSettingsService } from "~/lib/database"

import {
  getCertificationForUrl,
  useIntentionGroups,
  useUserCertifications,
  useWalletFromStorage
} from "../../../hooks"
import {
  TOPIC_FILTER_OPTIONS,
  VERB_FILTER_OPTIONS
} from "../../../lib/config/filterOptions"
import { getProfileUrl } from "../../../lib/utils"
import type { IntentionType } from "../../../types/intentionCategories"
import { useRouter } from "../../layout/RouterProvider"
import GroupManagerModal from "../../modals/GroupManagerModal"
import FilterDropdown from "../../ui/FilterDropdown"
import GroupBentoCard from "../../ui/GroupBentoCard"
import GroupDetailView from "../../ui/GroupDetailView"
import SofiaLoader from "../../ui/SofiaLoader"

import "../../styles/CoreComponents.css"
import "../../styles/CorePage.css"
import "../../styles/CommonPage.css"
import "../../styles/CategoryStyles.css"
import "../../styles/CircleFeedTab.css"

const HIGHLIGHT_DURATION_MS = 3200

const EchoesTab = () => {
  const [certFilter, setCertFilter] = useState<IntentionType | "all">("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { walletAddress } = useWalletFromStorage()
  const { certifications } = useUserCertifications(walletAddress)
  const [showManager, setShowManager] = useState(false)
  const [managerInitialFilter, setManagerInitialFilter] = useState<
    "all" | "inactive"
  >("all")
  const [cleanupBannerDismissed, setCleanupBannerDismissed] = useState(false)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [highlightDomains, setHighlightDomains] = useState<Set<string>>(
    new Set()
  )
  const { myProfileIntent, setMyProfileIntent } = useRouter()
  const {
    groups,
    selectedGroup,
    isLoading,
    error,
    loadGroups,
    selectGroup,
    certifyUrl,
    removeUrl,
    refreshGroup,
    deleteGroup
  } = useIntentionGroups()

  // Phase 4: consume navigation intent set by CartDrawer post-tx.
  //   - highlightDomain (mono) → auto-open GroupDetailView for that domain.
  //   - highlightDomains (multi) → set a transient highlight set so each freshly-Marked
  //     bento card gets a "drop-in staggered" entrance.
  // We clear the intent once consumed so navigating back to the tab feels normal.
  const intentConsumedRef = useRef(false)
  useEffect(() => {
    if (intentConsumedRef.current) return
    if (!myProfileIntent) return
    if (groups.length === 0) return

    if (myProfileIntent.highlightDomain) {
      const target = groups.find(
        (g) => g.domain === myProfileIntent.highlightDomain
      )
      if (target) {
        intentConsumedRef.current = true
        selectGroup(target.id)
        setMyProfileIntent(null)
      }
      return
    }

    if (
      myProfileIntent.highlightDomains &&
      myProfileIntent.highlightDomains.length > 0
    ) {
      intentConsumedRef.current = true
      setHighlightDomains(new Set(myProfileIntent.highlightDomains))
      setMyProfileIntent(null)
    }
  }, [groups, myProfileIntent, selectGroup, setMyProfileIntent])

  // Auto-clear the highlight set once the entrance animation has run its course.
  useEffect(() => {
    if (highlightDomains.size === 0) return
    const t = setTimeout(
      () => setHighlightDomains(new Set()),
      HIGHLIGHT_DURATION_MS
    )
    return () => clearTimeout(t)
  }, [highlightDomains])

  // Auto-delete groups with 0 active URLs (use ref to avoid infinite loop)
  const deletedGroupsRef = useRef(new Set<string>())
  useEffect(() => {
    const emptyGroups = groups.filter(
      (g) =>
        g.activeUrlCount === 0 &&
        !g.isVirtualGroup &&
        !g.urls.some((u) => u.oauthPredicate) &&
        !deletedGroupsRef.current.has(g.id)
    )
    if (emptyGroups.length === 0) return
    for (const group of emptyGroups) {
      deletedGroupsRef.current.add(group.id)
      deleteGroup(group.id)
    }
  }, [groups, deleteGroup])

  // Auto-cleanup: detect inactive groups and show banner
  useEffect(() => {
    let cancelled = false
    userSettingsService.getSettings().then((settings) => {
      if (cancelled || !settings.autoCleanup) return
      const cutoff =
        Date.now() - settings.autoCleanupInactiveDays * 24 * 60 * 60 * 1000
      const inactive = groups.filter(
        (g) =>
          !g.isVirtualGroup &&
          g.level <= settings.autoCleanupMinLevel &&
          g.certifiedCount === 0 &&
          g.updatedAt < cutoff
      )
      setInactiveCount(inactive.length)
    })
    return () => {
      cancelled = true
    }
  }, [groups])

  const handleOpenManager = (filter: "all" | "inactive" = "all") => {
    setManagerInitialFilter(filter)
    setShowManager(true)
  }

  // Filter out ENS names (.eth) and wallet addresses (0x)
  const baseGroups = groups.filter(
    (g) => !g.domain.endsWith(".eth") && !g.domain.startsWith("0x")
  )

  // Filter by certification type (verb)
  const certFilteredGroups =
    certFilter === "all"
      ? baseGroups
      : baseGroups.filter(
          (g) => (g.certificationBreakdown[certFilter] || 0) > 0
        )

  // Filter by topic — keep groups with ≥1 active URL whose on-chain
  // certification carries the selected topic in its "in context of"
  // triples (CertificationEntry.interestContexts). Same topic semantics
  // and slug palette as the explorer feed — one coherent system.
  const topicFilteredGroups =
    topicFilter === "all"
      ? certFilteredGroups
      : certFilteredGroups.filter((g) =>
          (g.urls || []).some((u) => {
            if (u.removed || u.oauthPredicate) return false
            const entry = getCertificationForUrl(certifications, u.url)
            return entry?.interestContexts?.includes(topicFilter) ?? false
          })
        )

  // Filter by search query
  const filteredGroups = searchQuery.trim()
    ? topicFilteredGroups.filter((g) =>
        g.domain.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topicFilteredGroups

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    const confirmed = window.confirm(
      `Delete "${group.domain}"?\n\n` +
        `⚠️ This will only remove the group from your local view.\n` +
        `Your on-chain Marks will remain on the blockchain and won't be affected.`
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

  // Empty state (no groups at all)
  if (baseGroups.length === 0) {
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

  return (
    <div className="triples-container">
      <div className="groups-section">
        {/* Search bar — own row, full width */}
        <div className="echoes-search-row">
          <div className="category-search-container">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="category-search-input"
            />
            {searchQuery && (
              <button
                className="category-search-clear"
                onClick={() => setSearchQuery("")}>
                x
              </button>
            )}
          </div>
        </div>

        {/* Verb + Topic dropdowns share one line with Manage /
            Open-on-Explorer. The `--actions` modifier shrinks the
            dropdowns so all four fit — Echoes only; the other pages
            keep the default-size dropdowns. Topic uses the on-chain
            "in context of" data from useUserCertifications. */}
        <div className="echoes-filter-row echoes-filter-row--actions">
          <FilterDropdown
            label="Intention"
            value={certFilter}
            onChange={(id) => setCertFilter(id as IntentionType | "all")}
            options={VERB_FILTER_OPTIONS}
          />
          <FilterDropdown
            label="Topics"
            value={topicFilter}
            onChange={setTopicFilter}
            options={TOPIC_FILTER_OPTIONS}
            wide
          />
          <div className="echoes-actions">
            <button
              className="sort-btn gm-manage-btn"
              onClick={() => handleOpenManager("all")}
              title="Manage groups">
              Manage
            </button>
            <button
              className="sort-btn gm-manage-btn echoes-open-sofia-btn"
              onClick={() =>
                chrome.tabs.create({ url: getProfileUrl(), active: true })
              }
              title="View my profile on Explorer">
              View on Explorer ↗
            </button>
          </div>
        </div>

        {/* Inactive groups cleanup banner */}
        {inactiveCount > 0 && !cleanupBannerDismissed && (
          <div className="gm-cleanup-banner">
            <span>
              {inactiveCount} inactive group{inactiveCount > 1 ? "s" : ""} found
            </span>
            <button
              className="gm-cleanup-review"
              onClick={() => handleOpenManager("inactive")}>
              Review
            </button>
            <button
              className="gm-cleanup-dismiss"
              onClick={() => setCleanupBannerDismissed(true)}>
              &times;
            </button>
          </div>
        )}

        {filteredGroups.length === 0 ? (
          <div className="groups-empty">
            <p>No groups match this filter</p>
          </div>
        ) : (
          <div className="bento-grid">
            {(() => {
              let staggerIndex = 0
              return filteredGroups.map((group) => {
                const fresh = highlightDomains.has(group.domain)
                const order = fresh ? staggerIndex++ : 0
                return (
                  <GroupBentoCard
                    key={group.id}
                    group={group}
                    onClick={() => selectGroup(group.id)}
                    onDelete={handleDeleteGroup}
                    size="small"
                    isHighlighted={fresh}
                    highlightOrder={order}
                  />
                )
              })
            })()}
          </div>
        )}
      </div>

      <GroupManagerModal
        isOpen={showManager}
        groups={groups}
        deleteGroup={deleteGroup}
        removeUrl={removeUrl}
        loadGroups={loadGroups}
        onClose={() => setShowManager(false)}
        initialFilter={managerInitialFilter}
      />
    </div>
  )
}

export default EchoesTab
