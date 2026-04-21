/**
 * GroupManagerModal
 * Full-screen modal for bulk managing domain groups and URLs
 * Supports filtering, sorting, multi-select, and batch delete/remove
 */

import { useState, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { useGroupManager, type ManagerFilter, type ManagerSort } from "~/hooks"
import type { IntentionGroupWithStats } from "~/hooks"
import { getFaviconUrl, formatDuration } from "~/lib/utils"
import { getLevelColor, getLevelColorAlpha } from "~/types/interests"
import "../styles/GroupManagerModal.css"

interface GroupManagerModalProps {
  isOpen: boolean
  groups: IntentionGroupWithStats[]
  deleteGroup: (groupId: string) => Promise<boolean>
  removeUrl: (groupId: string, url: string) => Promise<boolean>
  loadGroups: () => Promise<void>
  onClose: () => void
  initialFilter?: ManagerFilter
}

const FILTER_OPTIONS: { value: ManagerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "uncertified", label: "Uncertified" },
  { value: "empty", label: "Empty" },
  { value: "inactive", label: "Inactive" }
]

const SORT_OPTIONS: { value: ManagerSort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "level", label: "Level" },
  { value: "urls", label: "URLs" },
  { value: "time", label: "Time" },
  { value: "alphabetic", label: "A-Z" }
]

const GroupManagerModal = ({
  isOpen,
  groups,
  deleteGroup,
  removeUrl,
  loadGroups,
  onClose,
  initialFilter
}: GroupManagerModalProps) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<"groups" | "urls" | null>(null)

  const manager = useGroupManager({
    groups,
    deleteGroup,
    removeUrl,
    loadGroups
  })

  // Apply initial filter when provided
  useEffect(() => {
    if (initialFilter) manager.setFilter(initialFilter)
  }, [initialFilter])

  const handleDeleteGroups = useCallback(async () => {
    await manager.deleteSelectedGroups()
    setConfirmAction(null)
  }, [manager])

  const handleRemoveUrls = useCallback(async () => {
    await manager.removeSelectedUrls()
    setConfirmAction(null)
  }, [manager])

  const toggleExpand = useCallback((groupId: string) => {
    setExpandedGroupId(prev => prev === groupId ? null : groupId)
  }, [])

  if (!isOpen) return null

  const totalUrls = manager.filteredGroups.reduce(
    (sum, g) => sum + g.activeUrlCount, 0
  )

  return createPortal(
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="gm-header">
          <div className="gm-header-info">
            <h2 className="gm-title">Manage Groups</h2>
            <span className="gm-counter">
              {manager.filteredGroups.length} groups &middot; {totalUrls} URLs
            </span>
          </div>
          <button className="gm-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Toolbar */}
        <div className="gm-toolbar">
          <div className="gm-search-row">
            <input
              type="text"
              className="gm-search"
              placeholder="Search domains..."
              value={manager.search}
              onChange={e => manager.setSearch(e.target.value)}
            />
            {manager.search && (
              <button
                className="gm-search-clear"
                onClick={() => manager.setSearch("")}
              >
                &times;
              </button>
            )}
          </div>
          <div className="gm-filters">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`gm-filter-btn${manager.filter === opt.value ? " active" : ""}`}
                onClick={() => manager.setFilter(opt.value)}
              >
                {opt.label}
                {opt.value === "inactive" && manager.inactiveGroups.length > 0 && (
                  <span className="gm-badge">{manager.inactiveGroups.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="gm-sort-row">
            <span className="gm-sort-label">Sort:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`gm-sort-btn${manager.sort === opt.value ? " active" : ""}`}
                onClick={() => manager.setSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Select all / deselect */}
        <div className="gm-select-bar">
          <button
            className="gm-select-btn"
            onClick={manager.selectedGroupIds.size > 0
              ? manager.deselectAll
              : manager.selectAllFiltered}
          >
            {manager.selectedGroupIds.size > 0
              ? `Deselect All (${manager.selectedGroupIds.size})`
              : "Select All"}
          </button>
        </div>

        {/* Group list */}
        <div className="gm-list">
          {manager.filteredGroups.length === 0 ? (
            <div className="gm-empty">No groups match your filters</div>
          ) : (
            manager.filteredGroups.map(group => {
              const isSelected = manager.selectedGroupIds.has(group.id)
              const isExpanded = expandedGroupId === group.id
              const activeUrls = group.urls.filter(u => !u.removed)

              return (
                <div key={group.id} className="gm-group-item">
                  <div
                    className={`gm-group-row${isSelected ? " selected" : ""}`}
                    onClick={() => manager.toggleGroup(group.id)}
                  >
                    <input
                      type="checkbox"
                      className="gm-checkbox"
                      checked={isSelected}
                      onChange={() => manager.toggleGroup(group.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <img
                      src={getFaviconUrl(group.domain)}
                      alt=""
                      className="gm-favicon"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                    <div className="gm-group-info">
                      <span className="gm-domain">{group.domain}</span>
                      <span className="gm-stats">
                        {group.activeUrlCount} URLs &middot; {group.certifiedCount} certified &middot; {formatDuration(group.totalAttentionTime)}
                      </span>
                    </div>
                    <span
                      className="gm-level"
                      style={{
                        color: getLevelColor(group.level),
                        background: getLevelColorAlpha(group.level)
                      }}
                    >
                      LVL {group.level}
                    </span>
                    <button
                      className="gm-expand-btn"
                      onClick={e => {
                        e.stopPropagation()
                        toggleExpand(group.id)
                      }}
                    >
                      {isExpanded ? "\u25BE" : "\u25B8"}
                    </button>
                  </div>

                  {/* Expanded URL list */}
                  {isExpanded && (
                    <div className="gm-url-list">
                      {activeUrls.length === 0 ? (
                        <div className="gm-url-empty">No active URLs</div>
                      ) : (
                        activeUrls.map(url => {
                          const urlKey = `${group.id}::${url.url}`
                          const isOnChain = url.isOnChain || !!url.certification
                          const isUrlSelected = !isOnChain && manager.selectedUrlKeys.has(urlKey)
                          return (
                            <div
                              key={url.url}
                              className={`gm-url-row${isUrlSelected ? " selected" : ""}${isOnChain ? " locked" : ""}`}
                              onClick={() => !isOnChain && manager.toggleUrl(urlKey)}
                            >
                              <input
                                type="checkbox"
                                className="gm-checkbox"
                                checked={isUrlSelected}
                                disabled={isOnChain}
                                onChange={() => !isOnChain && manager.toggleUrl(urlKey)}
                                onClick={e => e.stopPropagation()}
                              />
                              <div className="gm-url-info">
                                <span className="gm-url-title">
                                  {url.title || url.url}
                                </span>
                                <span className="gm-url-meta">
                                  {formatDuration(url.attentionTime)}
                                  {isOnChain && (
                                    <span className="gm-onchain-badge">on-chain</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="gm-footer">
          {confirmAction ? (
            <div className="gm-confirm">
              <span className="gm-confirm-text">
                {confirmAction === "groups"
                  ? `Clean ${manager.selectedGroupIds.size} group${manager.selectedGroupIds.size > 1 ? "s" : ""}? Groups with certified URLs will keep them, only uncertified URLs are removed.`
                  : `Remove ${manager.selectedUrlKeys.size} URL${manager.selectedUrlKeys.size > 1 ? "s" : ""}?`}
              </span>
              <button
                className="gm-confirm-btn danger"
                onClick={confirmAction === "groups" ? handleDeleteGroups : handleRemoveUrls}
                disabled={manager.isDeleting}
              >
                {manager.isDeleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                className="gm-confirm-btn cancel"
                onClick={() => setConfirmAction(null)}
                disabled={manager.isDeleting}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="gm-actions">
              <span className="gm-selection-count">
                {manager.selectedGroupIds.size > 0 &&
                  `${manager.selectedGroupIds.size} group${manager.selectedGroupIds.size > 1 ? "s" : ""}`}
                {manager.selectedGroupIds.size > 0 && manager.selectedUrlKeys.size > 0 && " & "}
                {manager.selectedUrlKeys.size > 0 &&
                  `${manager.selectedUrlKeys.size} URL${manager.selectedUrlKeys.size > 1 ? "s" : ""}`}
                {manager.selectedGroupIds.size === 0 && manager.selectedUrlKeys.size === 0 &&
                  "Select items to manage"}
              </span>
              <div className="gm-action-btns">
                {manager.selectedUrlKeys.size > 0 && (
                  <button
                    className="gm-action-btn remove"
                    onClick={() => setConfirmAction("urls")}
                  >
                    Remove URLs
                  </button>
                )}
                {manager.selectedGroupIds.size > 0 && (
                  <button
                    className="gm-action-btn delete"
                    onClick={() => setConfirmAction("groups")}
                  >
                    Clean Groups
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GroupManagerModal
