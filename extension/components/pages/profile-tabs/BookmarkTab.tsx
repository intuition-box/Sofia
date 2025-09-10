import { useState } from 'react'
import { useBookmarks } from '../../../hooks/useBookmarks'
import '../../styles/CorePage.css'

const BookmarkTab = () => {
  const { 
    lists, 
    triplets,
    isLoading, 
    error, 
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

  if (isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Error loading bookmarks: {error}</p>
          <button 
            onClick={refreshFromLocal}
            className="reload-button"
            style={{ 
              marginTop: '10px',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--accent-color)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">
      {/* Header with lists navigation */}
      <div className="bookmark-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Bookmark Lists</h3>
          <button
            onClick={() => setIsCreatingList(true)}
            style={{ 
              fontSize: '12px', 
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--accent-color)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            + New List
          </button>
        </div>

        {/* Lists navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedListId(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              background: selectedListId === null ? 'var(--accent-color)' : 'transparent',
              color: selectedListId === null ? 'white' : 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            All ({triplets.length})
          </button>
          
          {lists.map(list => (
            <div key={list.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setSelectedListId(list.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  background: selectedListId === list.id ? 'var(--accent-color)' : 'transparent',
                  color: selectedListId === list.id ? 'white' : 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {list.name} ({list.tripletIds.length})
              </button>
              
              <button
                onClick={() => startEditingList(list.id)}
                style={{
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✏️
              </button>
              
              <button
                onClick={() => handleDeleteList(list.id)}
                style={{
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Search bar */}
        {!selectedListId && (
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Search bookmarked triplets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>
        )}
      </div>

      {/* Create/Edit List Modal */}
      {(isCreatingList || isEditingList) && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(14, 14, 14, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="echo-card border-green" style={{
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid rgba(199, 134, 108, 0.4)',
            background: 'linear-gradient(135deg, rgba(199, 134, 108, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(199, 134, 108, 0.05) 100%)',
            boxShadow: '0 20px 40px rgba(55, 33, 24, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'rgba(255, 255, 255, 0.86) ' }}>
              {isCreatingList ? 'Create New List' : 'Edit List'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.79) ' }}>
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'rgba(255, 255, 255, 0.79) '
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.79) '}}>
                Description (optional)
              </label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'rgba(255, 255, 255, 0.79) ',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={cancelEdit}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'rgba(255, 255, 255, 0.79) ',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => isCreatingList ? handleCreateList() : handleUpdateList(isEditingList!)}
                disabled={!newListName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: !newListName.trim() ? 'var(--bg-disabled)' : 'var(--accent-color)',
                  color: !newListName.trim() ? 'rgba(255, 255, 255, 0.79) ' : 'white',
                  cursor: !newListName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreatingList ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px' }}>
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
                <div key={list.id} className="echo-card border-green" style={{ marginBottom: '12px' }}>
                  <div className="triplet-item">
                    <div className="triplet-header">
                      <div className="list-info">
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '16px' }}>
                          {list.name}
                        </h4>
                        {list.description && (
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {list.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
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
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--accent-color)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => startEditingList(list.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Delete
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
                <div key={bookmarkedTriplet.id} className="echo-card border-green" style={{ marginBottom: '12px' }}>
                  <div className="triplet-item">
                    <div className="triplet-header">
                      <p className="triplet-text">
                        <span className="subject">{bookmarkedTriplet.triplet.subject}</span><br />
                        <span className="action">{bookmarkedTriplet.triplet.predicate}</span><br />
                        <span className="object">{bookmarkedTriplet.triplet.object}</span>
                      </p>
                    </div>
                    <div className="signal-actions">
                      <button
                        onClick={() => removeTripletFromList(selectedListId, bookmarkedTriplet.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                    <div style={{ 
                      marginTop: '12px', 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '8px'
                    }}>
                      <div>Source: {bookmarkedTriplet.sourceType}</div>
                      <div>Added: {formatDate(bookmarkedTriplet.addedAt)}</div>
                      {bookmarkedTriplet.description && (
                        <div>Description: {bookmarkedTriplet.description}</div>
                      )}
                      {bookmarkedTriplet.url && (
                        <div>URL: <a href={bookmarkedTriplet.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>
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