import { useState, useMemo } from 'react'
import { useBookmarks } from '../../../hooks/useBookmarks'
import { useIntentionCategories } from '../../../hooks/useIntentionCategories'
import { useIntuitionTriplets } from '../../../hooks/useIntuitionTriplets'
import CategoryCard from '../../ui/CategoryCard'
import CategoryDetailView from '../../ui/CategoryDetailView'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/Modal.css'
import '../../styles/BookmarkStyles.css'
import '../../styles/CategoryStyles.css'

// Helper to extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Helper to get favicon URL
const getFavicon = (url: string): string => {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return ''
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
    selectCategory
  } = useIntentionCategories()

  // User's on-chain signals for adding to bookmarks
  const { triplets: userSignals, isLoading: signalsLoading } = useIntuitionTriplets()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isEditingList, setIsEditingList] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isAddingSignal, setIsAddingSignal] = useState(false)
  const [signalSearchQuery, setSignalSearchQuery] = useState('')

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    try {
      await createList(newListName.trim(), newListDescription.trim() || undefined)
      setSelectedListId(null)
      setIsCreatingList(false)
      setNewListName('')
      setNewListDescription('')
    } catch (err) {
      console.error('Failed to create list:', err)
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
      console.error('Failed to update list:', err)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All bookmarked triplets in this list will be removed.')) {
      return
    }

    try {
      await deleteList(listId)
      if (selectedListId === listId) {
        setSelectedListId(null)
      }
    } catch (err) {
      console.error('Failed to delete list:', err)
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
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Get triplets for selected list or all if no list selected
  const displayedTriplets = selectedListId
    ? getTripletsByList(selectedListId)
    : triplets

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
      console.error('Failed to add signal to bookmark:', err)
    }
  }


  const handleRemoveTripletFromList = async (listId: string, tripletId: string) => {
    try {
      await removeTripletFromList(listId, tripletId)
    } catch (err) {
      console.error('Failed to remove triplet from list:', err)
    }
  }


  // If a category is selected, show the detail view
  if (selectedCategory) {
    return (
      <div className="bookmarks-container">
        <CategoryDetailView
          category={selectedCategory}
          onBack={() => selectCategory(null)}
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
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {isAddingSignal ? 'Cancel' : '+ Add'}
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingList(true)}
              className="btn iridescence-btn"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              + New List
            </button>
          )}
        </div>

        {/* Categories and Lists navigation */}
        <div className="bookmark-nav-wrapper">
          {/* All bookmarks button - first position, similar style to category cards */}
          <div
            onClick={() => {
              setSelectedListId(null)
              setIsAddingSignal(false)
            }}
            className={`category-card ${selectedListId === null && !selectedCategory ? 'active' : ''}`}
          >
            <div className="category-card-header">
              <span className="category-name">All Bookmarks</span>
              <span className="category-count-value">{triplets.length}</span>
            </div>
          </div>

          {/* Categories */}
          {categoriesLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="category-card loading" style={{ minWidth: '120px' }}>
                  <div className="category-card-header">
                    <div className="category-color-dot" style={{ backgroundColor: '#666' }} />
                    <span className="category-name">...</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onClick={() => selectCategory(category.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Selected list title */}
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
                          src={getFavicon(signal.url)}
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

        {selectedListId === null ? (
          /* Show all lists as cards */
          lists.length === 0 ? (
            <div className="bookmark-empty-state">
              <p>No bookmark lists yet!</p>
              <p className="bookmark-empty-subtext">
                Create your first bookmark list to start organizing your favorite Signals.
              </p>
            </div>
          ) : (
            <div className="lists-grid">
              {lists.map((list) => (
                <div key={list.id} className="bookmark-card">
                  <div className="bookmark-item">
                    <div className="bookmark-header-content">
                      <div className="bookmark-list-info">
                        <h4>{list.name}</h4>
                        {list.description && <p>{list.description}</p>}
                        <div className="bookmark-list-meta">
                          <span>{list.tripletIds.length} Signals</span>
                          <span>Created: {formatDate(list.createdAt)}</span>
                          {list.updatedAt !== list.createdAt && (
                            <span>Updated: {formatDate(list.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="signal-actions">
                      <div
                        onClick={() => setSelectedListId(list.id)}
                        className="category-card"
                        style={{ cursor: 'pointer', minWidth: 'auto', padding: '6px 12px' }}
                      >
                        <span className="category-name">View</span>
                      </div>
                      <button
                        onClick={() => startEditingList(list.id)}
                        className="btn secondary small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="batch-btn delete-selected btn-small-custom"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : !isAddingSignal && (
          /* Show triplets in selected list */
          displayedTriplets.length === 0 ? (
            <div className="bookmark-empty-state">
              <p>No signals in this list yet!</p>
              <p className="bookmark-empty-subtext">
                Click "Add" to add signals from your on-chain signals.
              </p>
            </div>
          ) : (
            <div className="bookmark-triplets-list">
              {displayedTriplets.map((bookmarkedTriplet) => (
                <div key={bookmarkedTriplet.id} className="bookmark-card">
                  <div className="bookmark-item">
                    <div className="bookmark-header-content">
                      <p className="bookmark-text">
                        <span className="object">{bookmarkedTriplet.triplet.object}</span>
                      </p>
                    </div>
                    <div className="signal-actions">
                      <button
                        onClick={() => handleRemoveTripletFromList(selectedListId, bookmarkedTriplet.id)}
                        className="batch-btn delete-selected btn-small-custom"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="bookmark-triplet-details">
                      <div>Source: {bookmarkedTriplet.sourceType}</div>
                      <div>Added: {formatDate(bookmarkedTriplet.addedAt)}</div>
                      {bookmarkedTriplet.description && (
                        <div>Description: {bookmarkedTriplet.description}</div>
                      )}
                      {bookmarkedTriplet.url && (
                        <div>URL: <a href={bookmarkedTriplet.url} target="_blank" rel="noopener noreferrer">
                          {bookmarkedTriplet.url.length > 50 ? bookmarkedTriplet.url.slice(0, 50) + '...' : bookmarkedTriplet.url}
                        </a></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default BookmarkTab