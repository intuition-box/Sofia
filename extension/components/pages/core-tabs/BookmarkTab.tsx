import { useState } from 'react'
import { useBookmarks } from '../../../hooks/useBookmarks'
import Iridescence from '../../ui/Iridescence'
import '../../styles/CoreComponents.css'
import '../../styles/CorePage.css'
import '../../styles/BookmarkStyles.css'

const BookmarkTab = () => {
  const { 
    lists, 
    triplets,
    createList, 
    deleteList, 
    updateList,
    getTripletsByList,
    searchTriplets,
    refreshFromLocal 
  } = useBookmarks()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isEditingList, setIsEditingList] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    try {
      const listId = await createList(newListName.trim(), newListDescription.trim() || undefined)
      setSelectedListId(listId)
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
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Get triplets for selected list or all if no list selected
  const displayedTriplets = selectedListId 
    ? getTripletsByList(selectedListId)
    : searchQuery.trim() 
      ? searchTriplets(searchQuery)
      : triplets


  function removeTripletFromList(selectedListId: string, id: string): void {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="triples-container">
      {/* Header with lists navigation */}
      <div className="bookmark-header">
        {/* New List Button - Full Width */}
        <div className="bookmark-header-flex">
          <button
            onClick={() => setIsCreatingList(true)}
            className="btn iridescence-btn"
            style={{ width: '100%' }}
          >
            <div className="iridescence-btn-background">
              <Iridescence
                color={[1, 0.4, 0.5]}
                speed={0.3}
                mouseReact={false}
                amplitude={0.1}
                zoom={0.05}
              />
            </div>
            <span className="iridescence-btn-content">
              + New List
            </span>
          </button>
        </div>

        {/* Search bar */}
        {!selectedListId && (
          <div className="bookmark-search-container">
            <input
              type="text"
              placeholder="Search bookmarked triplets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>
        )}

        {/* Lists navigation */}
        <div className="bookmark-nav-wrapper">
          <button
            onClick={() => setSelectedListId(null)}
            className={`bookmark-nav-button ${selectedListId === null ? 'active' : ''}`}
          >
            All ({triplets.length})
          </button>
        </div>
      </div>

      {/* Create/Edit List Modal */}
      {(isCreatingList || isEditingList) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                {isCreatingList ? 'Create New List' : 'Edit List'}
              </div>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="label">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  className="input"
                />
              </div>
              
              <div className="form-group">
                <label className="label">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  className="textarea"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={cancelEdit}
                  className="btn secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => isCreatingList ? handleCreateList() : handleUpdateList(isEditingList!)}
                  disabled={!newListName.trim()}
                  className="btn primary"
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
        {selectedListId === null ? (
          /* Show all lists as cards */
          lists.length === 0 ? (
            <div className="empty-state">
              <p>No bookmark lists yet!</p>
              <p className="empty-subtext">
                Create your first bookmark list to start organizing your favorite triplets.
              </p>
            </div>
          ) : (
            <div className="lists-grid">
              {lists.map((list) => (
                <div key={list.id} className="echo-card border-default bookmark-card">
                  <div className="bookmark-item">
                    <div className="bookmark-header-content">
                      <div className="bookmark-list-info">
                        <h4>{list.name}</h4>
                        {list.description && <p>{list.description}</p>}
                        <div className="bookmark-list-meta">
                          <span>{list.tripletIds.length} triplets</span>
                          <span>Created: {formatDate(list.createdAt)}</span>
                          {list.updatedAt !== list.createdAt && (
                            <span>Updated: {formatDate(list.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="signal-actions">
                      <button
                        onClick={() => setSelectedListId(list.id)}
                        className="btn primary small"
                      >
                        View
                      </button>
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
        ) : (
          /* Show triplets in selected list */
          displayedTriplets.length === 0 ? (
            <div className="empty-state">
              <p>No triplets in this list yet!</p>
              <p className="empty-subtext">
                Add triplets to this list from your Knowledge Graph.
              </p>
            </div>
          ) : (
            <div className="triplets-list">
              {displayedTriplets.map((bookmarkedTriplet) => (
                <div key={bookmarkedTriplet.id} className="echo-card border-default bookmark-card">
                  <div className="bookmark-item">
                    <div className="bookmark-header-content">
                      <p className="bookmark-text">
                        <span className="object">{bookmarkedTriplet.triplet.object}</span>
                      </p>
                    </div>
                    <div className="signal-actions">
                      <button
                        onClick={() => removeTripletFromList(selectedListId, bookmarkedTriplet.id)}
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