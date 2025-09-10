import { useState } from 'react'
import { useBookmarks } from '../../../hooks/useBookmarks'
import QuickActionButton from '../../ui/QuickActionButton'
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
          <QuickActionButton 
            onClick={refreshFromLocal}
            className="reload-button"
            style={{ marginTop: '10px' }}
          >
            Retry
          </QuickActionButton>
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
          <QuickActionButton
            onClick={() => setIsCreatingList(true)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            + New List
          </QuickActionButton>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {isCreatingList ? 'Create New List' : 'Edit List'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
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
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
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
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <QuickActionButton onClick={cancelEdit}>
                Cancel
              </QuickActionButton>
              <QuickActionButton 
                onClick={() => isCreatingList ? handleCreateList() : handleUpdateList(isEditingList!)}
                disabled={!newListName.trim()}
              >
                {isCreatingList ? 'Create' : 'Update'}
              </QuickActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {displayedTriplets.length === 0 ? (
          <div className="empty-state">
            <p>
              {selectedListId 
                ? 'No triplets in this list yet!'
                : lists.length === 0 
                  ? 'No bookmark lists yet!'
                  : 'No bookmarked triplets found!'
              }
            </p>
            <p className="empty-subtext">
              {selectedListId
                ? 'Add triplets to this list from your Knowledge Graph.'
                : 'Create your first bookmark list to start organizing your favorite triplets.'
              }
            </p>
          </div>
        ) : (
          <div className="triplets-list">
            {displayedTriplets.map((bookmarkedTriplet) => (
              <div
                key={bookmarkedTriplet.id}
                className="triplet-item"
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)'
                }}
              >
                <div className="triplet-content">
                  <div className="triplet-row">
                    <span className="triplet-part subject">{bookmarkedTriplet.triplet.subject}</span>
                    <span className="triplet-part predicate">{bookmarkedTriplet.triplet.predicate}</span>
                    <span className="triplet-part object">{bookmarkedTriplet.triplet.object}</span>
                  </div>
                  
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div>Source: {bookmarkedTriplet.sourceType}</div>
                    <div>Added: {formatDate(bookmarkedTriplet.addedAt)}</div>
                    {bookmarkedTriplet.description && (
                      <div>Description: {bookmarkedTriplet.description}</div>
                    )}
                    {bookmarkedTriplet.url && (
                      <div>URL: <a href={bookmarkedTriplet.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>
                        {bookmarkedTriplet.url}
                      </a></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookmarkTab