import { useState, useMemo } from 'react'
import { useBookmarks, useIntentionCategories, useIntuitionTriplets, useRedeemTriple } from '../../../hooks'
import CategoryCard from '../../ui/CategoryCard'
import CategoryDetailView from '../../ui/CategoryDetailView'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/Modal.css'
import '../../styles/BookmarkStyles.css'
import '../../styles/CategoryStyles.css'
import '../../styles/InterestTab.css'
import '../../styles/CircleFeedTab.css'
import { createHookLogger } from '../../../lib/utils/logger'
import { getFaviconUrl } from '~/lib/utils'

const logger = createHookLogger('BookmarkTab')

type BookmarkSortBy = "date-desc" | "date-asc" | "name" | "domain"

const bookmarkSortOptions: { value: BookmarkSortBy; label: string }[] = [
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
  { value: "name", label: "Name" },
  { value: "domain", label: "Domain" }
]

// Helper to extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

const BookmarkTab = () => {
  const {
    lists,
    triplets,
    createList,
    deleteList,
    updateList,
    addTripletToList,
    removeTripletFromList,
    getTripletsByList,
    refreshFromLocal
  } = useBookmarks()

  // Intention categories (on-chain certified URLs)
  const {
    categories,
    selectedCategory,
    loading: categoriesLoading,
    selectCategory,
    refetch: refetchCategories
  } = useIntentionCategories()

  // User's on-chain signals for adding to bookmarks
  const { triplets: userSignals, isLoading: signalsLoading } = useIntuitionTriplets()

  // Redeem hook for on-chain positions
  const { redeemPosition } = useRedeemTriple()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isEditingList, setIsEditingList] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isAddingSignal, setIsAddingSignal] = useState(false)
  const [signalSearchQuery, setSignalSearchQuery] = useState('')
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('')
  const [bookmarkSortBy, setBookmarkSortBy] = useState<BookmarkSortBy>("date-desc")
  const [showAllBookmarks, setShowAllBookmarks] = useState(false)
  const [redeemingUrls, setRedeemingUrls] = useState<Set<string>>(() => new Set())
  const [redeemedUrls, setRedeemedUrls] = useState<Set<string>>(() => new Set())

  const handleRedeemUrl = async (termId: string, url: string) => {
    setRedeemingUrls(prev => new Set(prev).add(url))
    try {
      const result = await redeemPosition(termId)
      if (!result.success) {
        alert(`Redeem failed: ${result.error}`)
        return
      }
      // Optimistic removal — hide immediately, refetch in background
      setRedeemedUrls(prev => new Set(prev).add(url))
      refetchCategories()
    } finally {
      setRedeemingUrls(prev => {
        const next = new Set(prev)
        next.delete(url)
        return next
      })
    }
  }

  const selectList = (listId: string | null) => {
    setSelectedListId(listId)
    setShowAllBookmarks(false)
    setBookmarkSearchQuery('')
    setBookmarkSortBy("date-desc")
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    try {
      await createList(newListName.trim(), newListDescription.trim() || undefined)
      selectList(null)
      setIsCreatingList(false)
      setNewListName('')
      setNewListDescription('')
    } catch (err) {
      logger.error('Failed to create list', err)
    }
  }

  const handleUpdateList = async (listId: string) => {
    if (!newListName.trim()) return

    try {
      await updateList(listId, {
        name: newListName.trim(),
        description: newListDescription.trim() || undefined
      })
      setIsEditingList(null)
      setNewListName('')
      setNewListDescription('')
    } catch (err) {
      logger.error('Failed to update list', err)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All bookmarked triplets in this list will be removed.')) {
      return
    }

    try {
      await deleteList(listId)
      if (selectedListId === listId) {
        selectList(null)
      }
    } catch (err) {
      logger.error('Failed to delete list', err)
    }
  }

  const startEditingList = (listId: string) => {
    const list = lists.find(l => l.id === listId)
    if (list) {
      setNewListName(list.name)
      setNewListDescription(list.description || '')
      setIsEditingList(listId)
    }
  }

  const cancelEdit = () => {
    setIsCreatingList(false)
    setIsEditingList(null)
    setNewListName('')
    setNewListDescription('')
  }

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  // Get triplets for selected list or all if no list selected
  const displayedTriplets = selectedListId
    ? getTripletsByList(selectedListId)
    : triplets

  // Merge manual bookmarks + on-chain category URLs for "All Bookmarks" view
  const allBookmarkItems = useMemo(() => {
    if (!showAllBookmarks) return displayedTriplets

    // Convert on-chain category URLs to the same shape as bookmarked triplets
    const categoryItems = categories.flatMap(category =>
      category.urls.map(catUrl => ({
        id: `cat-${category.id}-${catUrl.url}`,
        triplet: {
          subject: 'I',
          predicate: category.label,
          object: catUrl.label || catUrl.url
        },
        addedAt: new Date(catUrl.certifiedAt).getTime() || 0,
        url: catUrl.url,
        description: category.label,
        sourceType: 'intuition' as const,
        sourceId: category.id,
        sourceMessageId: undefined,
        termId: catUrl.termId
      }))
    )

    return [...displayedTriplets, ...categoryItems]
  }, [showAllBookmarks, displayedTriplets, categories])

  // Filter user signals based on search query for adding to bookmark
  const filteredSignals = useMemo(() => {
    if (!signalSearchQuery.trim()) return userSignals
    const query = signalSearchQuery.toLowerCase()
    return userSignals.filter(signal =>
      signal.triplet.object.toLowerCase().includes(query) ||
      signal.triplet.predicate.toLowerCase().includes(query) ||
      (signal.url && signal.url.toLowerCase().includes(query))
    )
  }, [userSignals, signalSearchQuery])

  // Filter + sort bookmarks in the selected list (or all bookmarks)
  const activeItems = showAllBookmarks ? allBookmarkItems : displayedTriplets
  const sortedBookmarks = useMemo(() => {
    // Exclude optimistically removed (redeemed) URLs
    let filtered = redeemedUrls.size > 0
      ? activeItems.filter(bt => !bt.url || !redeemedUrls.has(bt.url))
      : activeItems

    if (bookmarkSearchQuery.trim()) {
      const q = bookmarkSearchQuery.toLowerCase()
      filtered = filtered.filter(bt =>
        bt.triplet.object.toLowerCase().includes(q) ||
        (bt.url && bt.url.toLowerCase().includes(q)) ||
        (bt.description && bt.description.toLowerCase().includes(q))
      )
    }

    const sorted = [...filtered]
    switch (bookmarkSortBy) {
      case "date-desc":
        sorted.sort((a, b) => b.addedAt - a.addedAt)
        break
      case "date-asc":
        sorted.sort((a, b) => a.addedAt - b.addedAt)
        break
      case "name":
        sorted.sort((a, b) => a.triplet.object.localeCompare(b.triplet.object))
        break
      case "domain":
        sorted.sort((a, b) => {
          const domA = a.url ? getDomain(a.url) : ""
          const domB = b.url ? getDomain(b.url) : ""
          return domA.localeCompare(domB)
        })
        break
    }

    return sorted
  }, [activeItems, bookmarkSearchQuery, bookmarkSortBy, redeemedUrls])

  // Handle adding a signal to the current bookmark list
  const handleAddSignalToBookmark = async (signal: typeof userSignals[0]) => {
    if (!selectedListId) return

    try {
      await addTripletToList(
        selectedListId,
        {
          subject: signal.triplet.subject,
          predicate: signal.triplet.predicate,
          object: signal.triplet.object,
          objectUrl: signal.url
        },
        {
          sourceType: 'intuition',
          sourceId: signal.id,
          url: signal.url,
          description: signal.description,
          sourceMessageId: undefined
        }
      )
      setIsAddingSignal(false)
      setSignalSearchQuery('')
    } catch (err) {
      logger.error('Failed to add signal to bookmark', err)
    }
  }


  const handleRemoveTripletFromList = async (listId: string, tripletId: string) => {
    try {
      await removeTripletFromList(listId, tripletId)
    } catch (err) {
      logger.error('Failed to remove triplet from list', err)
    }
  }


  // If a category is selected, show the detail view
  if (selectedCategory) {
    return (
      <div className="bookmarks-container">
        <CategoryDetailView
          category={selectedCategory}
          onBack={() => selectCategory(null)}
          onRedeem={refetchCategories}
        />
      </div>
    )
  }

  return (
    <div className="bookmarks-container">
      {/* My Lists Section - Manual bookmark lists */}
      <div className="lists-section">
        <div className="section-header">
          {selectedListId ? (
            <button
              onClick={() => setIsAddingSignal(!isAddingSignal)}
              className="btn iridescence-btn"
              style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '700' }}
            >
              {isAddingSignal ? 'Cancel' : '+ Add'}
            </button>
          ) : !showAllBookmarks ? (
            <button
              onClick={() => setIsCreatingList(true)}
              className="btn iridescence-btn"
              style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '700' }}
            >
              + New List
            </button>
          ) : null}
        </div>

        {/* Categories as bookmark cards - Only show when no list is selected and not viewing all */}
        {!selectedListId && !showAllBookmarks && (
          <div className="lists-grid">
            {/* All bookmarks card */}
            <div
              onClick={() => {
                setShowAllBookmarks(true)
                setIsAddingSignal(false)
                selectCategory(null)
              }}
              className="bookmark-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="bookmark-item">
                <div className="bookmark-header-content">
                  <div className="bookmark-list-info">
                    <h4>All Bookmarks</h4>
                    <div className="bookmark-list-meta">
                      <span>{triplets.filter(t => t.url).length + categories.reduce((sum, c) => sum + c.urlCount, 0)} URLs</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const manualDomains = triplets.filter(t => t.url).map(t => getDomain(t.url!))
                  const categoryDomains = categories.flatMap(c => c.urls.map(u => u.domain))
                  const allDomains = [...new Set([...manualDomains, ...categoryDomains])]
                  return allDomains.length > 0 ? (
                    <div className="bookmark-favicon-grid">
                      {allDomains.slice(0, 8).map((domain) => (
                        <img
                          key={domain}
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt={domain}
                          className="bookmark-favicon-icon"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ))}
                      {allDomains.length > 8 && (
                        <div className="bookmark-favicon-more">+{allDomains.length - 8}</div>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            </div>

            {/* Categories */}
            {categoriesLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bookmark-card loading">
                    <div className="bookmark-item">
                      <div className="bookmark-header-content">
                        <div className="bookmark-list-info">
                          <h4>Loading...</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {categories.map((category) => {
                  const categoryDomains = [...new Set(
                    category.urls.map(u => u.domain)
                  )]
                  return (
                    <div
                      key={category.id}
                      onClick={() => selectCategory(category.id)}
                      className="bookmark-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="bookmark-item">
                        <div className="bookmark-header-content">
                          <div className="bookmark-list-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              className="category-color-dot"
                              style={{ backgroundColor: category.color }}
                            />
                            <h4 style={{ margin: 0 }}>{category.label}</h4>
                          </div>
                          <div className="bookmark-list-meta">
                            <span>{category.urlCount} URLs</span>
                          </div>
                        </div>
                        {categoryDomains.length > 0 && (
                          <div className="bookmark-favicon-grid">
                            {categoryDomains.slice(0, 4).map((domain) => (
                              <img
                                key={domain}
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                alt={domain}
                                className="bookmark-favicon-icon"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ))}
                            {categoryDomains.length > 4 && (
                              <div className="bookmark-favicon-more">+{categoryDomains.length - 4}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* Back navigation when viewing a list or all bookmarks */}
        {(selectedListId || showAllBookmarks) && (
          <button
            className="category-back-btn"
            onClick={() => {
              selectList(null)
              setIsAddingSignal(false)
              selectCategory(null)
            }}
          >
            Back
          </button>
        )}

        {/* View title */}
        {showAllBookmarks && !selectedListId && (
          <h2 className="bookmark-list-title">All Bookmarks</h2>
        )}
        {selectedListId && (
          <h2 className="bookmark-list-title">
            {lists.find(l => l.id === selectedListId)?.name}
          </h2>
        )}
      </div>

      {/* Create/Edit List Modal */}
      {(isCreatingList || isEditingList) && (
        <div className="bookmark-modal-overlay">
          <div className="bookmark-modal-content">
            <div className="bookmark-modal-header">
              <div className="bookmark-modal-title">
                {isCreatingList ? 'Create New List' : 'Edit List'}
              </div>
            </div>

            <div className="bookmark-modal-body">
              <div className="bookmark-form-group">
                <label className="bookmark-label">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  className="bookmark-input"
                />
              </div>

              <div className="bookmark-form-group">
                <label className="bookmark-label">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  className="bookmark-textarea"
                />
              </div>

              <div className="bookmark-button-group">
                <button
                  onClick={cancelEdit}
                  className="bookmark-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => isCreatingList ? handleCreateList() : handleUpdateList(isEditingList!)}
                  disabled={!newListName.trim()}
                  className={!newListName.trim() ? 'bookmark-button-disabled' : 'bookmark-button-primary'}
                >
                  {isCreatingList ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bookmark-content-padding">
        {/* Signal search interface when adding to bookmark */}
        {selectedListId && isAddingSignal && (
          <div className="signal-search-section">
            <div className="bookmark-search-container">
              <input
                type="text"
                placeholder="Search your signals..."
                value={signalSearchQuery}
                onChange={(e) => setSignalSearchQuery(e.target.value)}
                className="input"
                autoFocus
              />
            </div>
            {signalsLoading ? (
              <div className="bookmark-empty-state">
                <p>Loading your signals...</p>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="bookmark-empty-state">
                <p>{signalSearchQuery ? 'No signals match your search' : 'No signals available'}</p>
              </div>
            ) : (
              <div className="category-url-list">
                {filteredSignals.map((signal) => (
                  <div key={signal.id} className="category-url-row bookmark-signal-row">
                    <div
                      className="bookmark-signal-link"
                      onClick={() => signal.url && window.open(signal.url, '_blank', 'noopener,noreferrer')}
                    >
                      {signal.url && (
                        <img
                          src={getFaviconUrl(signal.url, 64)}
                          alt=""
                          className="category-url-favicon"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="category-url-info">
                        <span className="category-url-label">{signal.triplet.object}</span>
                        {signal.url && (
                          <span className="category-url-domain">{getDomain(signal.url)}</span>
                        )}
                      </div>
                      <span className="category-url-date">{formatDate(signal.timestamp)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddSignalToBookmark(signal)
                      }}
                      className="btn iridescence-btn small"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedListId === null && !showAllBookmarks ? (
          /* Show all lists as cards */
          lists.length === 0 ? (
            categories.some(c => c.urlCount > 0) ? null : (
              <div className="bookmark-empty-state">
                <p>No bookmark lists yet!</p>
                <p className="bookmark-empty-subtext">
                  Create your first bookmark list to start organizing your favorite Signals.
                </p>
              </div>
            )
          ) : (
            <div className="lists-grid">
              {lists.map((list) => {
                const listTriplets = getTripletsByList(list.id)
                const uniqueDomains = [...new Set(
                  listTriplets
                    .filter(t => t.url)
                    .map(t => getDomain(t.url!))
                )]

                return (
                  <div
                    key={list.id}
                    className="bookmark-card"
                    onClick={() => selectList(list.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bookmark-item">
                      <div className="bookmark-header-content">
                        <div className="bookmark-list-info">
                          <h4>{list.name}</h4>
                          {list.description && <p>{list.description}</p>}
                          <div className="bookmark-list-meta">
                            <span>Private</span>
                            <span>{list.tripletIds.length} Signals</span>
                            <span>Created: {formatDate(list.createdAt)}</span>
                            {list.updatedAt !== list.createdAt && (
                              <span>Updated: {formatDate(list.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {uniqueDomains.length > 0 && (
                        <div className="bookmark-favicon-grid">
                          {uniqueDomains.slice(0, 4).map((domain) => (
                            <img
                              key={domain}
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                              alt={domain}
                              className="bookmark-favicon-icon"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ))}
                          {uniqueDomains.length > 4 && (
                            <div className="bookmark-favicon-more">+{uniqueDomains.length - 4}</div>
                          )}
                        </div>
                      )}
                      <div className="signal-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteList(list.id)
                          }}
                          className="batch-btn delete-selected btn-small-custom"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : !isAddingSignal && (
          /* Show triplets in selected list or all bookmarks */
          activeItems.length === 0 ? (
            <div className="bookmark-empty-state">
              {showAllBookmarks ? (
                <p>No bookmarks yet!</p>
              ) : (
                <>
                  <p>No signals in this list yet!</p>
                  <p className="bookmark-empty-subtext">
                    Click "Add" to add signals from your on-chain signals.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Search + Sort toolbar */}
              <div className="category-toolbar">
                <div className="category-search-container">
                  <input
                    type="text"
                    placeholder="Search bookmarks..."
                    value={bookmarkSearchQuery}
                    onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                    className="category-search-input"
                  />
                  {bookmarkSearchQuery && (
                    <button
                      className="category-search-clear"
                      onClick={() => setBookmarkSearchQuery('')}
                    >
                      x
                    </button>
                  )}
                </div>
                <div className="sort-buttons">
                  {bookmarkSortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`sort-btn ${bookmarkSortBy === option.value ? 'active' : ''}`}
                      onClick={() => setBookmarkSortBy(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result count when searching */}
              {bookmarkSearchQuery && (
                <span className="category-result-count">
                  {sortedBookmarks.length} of {activeItems.length} bookmarks
                </span>
              )}

              {sortedBookmarks.length === 0 ? (
                <div className="bookmark-empty-state">
                  <p>No bookmarks match your search</p>
                </div>
              ) : (
                <div className="category-url-list">
                  {sortedBookmarks.map((bookmarkedTriplet) => (
                    <div
                      key={bookmarkedTriplet.id}
                      className="category-url-row"
                      onClick={() => bookmarkedTriplet.url && window.open(bookmarkedTriplet.url, '_blank', 'noopener,noreferrer')}
                    >
                      {bookmarkedTriplet.url && (
                        <img
                          src={getFaviconUrl(bookmarkedTriplet.url, 32)}
                          alt=""
                          className="category-url-favicon"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="category-url-info">
                        <span className="category-url-label">
                          {bookmarkedTriplet.triplet.object}
                        </span>
                        <span className="category-url-domain">
                          {bookmarkedTriplet.url ? getDomain(bookmarkedTriplet.url) : ''}
                        </span>
                      </div>
                      <span className="category-url-date">
                        {formatDate(bookmarkedTriplet.addedAt)}
                      </span>
                      {selectedListId && !bookmarkedTriplet.id.startsWith('cat-') && (
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveTripletFromList(selectedListId, bookmarkedTriplet.id)
                          }}
                          title="Remove from list"
                        >
                          ×
                        </button>
                      )}
                      {bookmarkedTriplet.id.startsWith('cat-') && (bookmarkedTriplet as any).termId && (
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRedeemUrl((bookmarkedTriplet as any).termId, bookmarkedTriplet.url!)
                          }}
                          disabled={redeemingUrls.has(bookmarkedTriplet.url!)}
                          title="Redeem position"
                        >
                          {redeemingUrls.has(bookmarkedTriplet.url!) ? '...' : '×'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}

export default BookmarkTab