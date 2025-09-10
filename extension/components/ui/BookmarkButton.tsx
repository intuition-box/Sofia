/**
 * BookmarkButton Component
 * Allows users to add triplets to their bookmark lists
 */

import { useState } from 'react'
import { useBookmarks } from '../../hooks/useBookmarks'
import type { Triplet } from '~components/pages/core-tabs/types'
import type { BookmarkedTriplet } from '../../types/bookmarks'
import QuickActionButton from './QuickActionButton'

interface BookmarkButtonProps {
  triplet: Triplet
  sourceInfo: Pick<BookmarkedTriplet, 'sourceType' | 'sourceId' | 'url' | 'description' | 'sourceMessageId'>
  size?: 'small' | 'medium'
  className?: string
}

const BookmarkButton = ({ triplet, sourceInfo, size = 'small', className }: BookmarkButtonProps) => {
  const { lists, addTripletToList, createList } = useBookmarks()
  const [showModal, setShowModal] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  const handleAddToBookmark = async () => {
    if (isCreatingList) {
      // Create new list first
      if (!newListName.trim()) return
      
      try {
        const listId = await createList(newListName.trim())
        await addTripletToList(listId, triplet, sourceInfo)
        setShowModal(false)
        setNewListName('')
        setIsCreatingList(false)
      } catch (err) {
        console.error('Failed to create list and add triplet:', err)
      }
    } else if (selectedListId) {
      // Add to existing list
      try {
        await addTripletToList(selectedListId, triplet, sourceInfo)
        setShowModal(false)
      } catch (err) {
        console.error('Failed to add triplet to list:', err)
      }
    }
  }

  const buttonStyle = size === 'small' ? {
    fontSize: '11px',
    padding: '4px 8px',
    minHeight: 'auto'
  } : {
    fontSize: '12px',
    padding: '6px 12px'
  }

  return (
    <>
      <QuickActionButton
        action="add"
        onClick={() => setShowModal(true)}
        className={className}
      />

      {showModal && (
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
            boxShadow: '0 20px 40px rgba(55, 33, 24, 0.15)',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'rgba(255, 255, 255, 0.86)' }}>
              Add to Bookmark List
            </h3>

            {/* Show triplet preview */}
            <div style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Triplet to bookmark:
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                <strong>{triplet.subject}</strong> → {triplet.predicate} → <strong>{triplet.object}</strong>
              </div>
            </div>

            {!isCreatingList ? (
              <>
                {/* List selection */}
                {lists.length > 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Select a list:
                    </label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Choose a list...</option>
                      {lists.map(list => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.tripletIds.length} triplets)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    No bookmark lists found. Create your first list below!
                  </div>
                )}

                {/* Create new list option */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => setIsCreatingList(true)}
                    style={{ 
                      width: '100%', 
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      justifyContent: 'center'
                    }}
                  >
                    + Create New List
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Create new list form */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    New list name:
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    autoFocus
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
                
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      setIsCreatingList(false)
                      setNewListName('')
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      justifyContent: 'center'
                    }}
                  >
                    ← Back to List Selection
                  </button>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setIsCreatingList(false)
                  setNewListName('')
                  setSelectedListId('')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddToBookmark}
                disabled={isCreatingList ? !newListName.trim() : !selectedListId}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: (isCreatingList ? !newListName.trim() : !selectedListId) ? 'var(--bg-disabled)' : 'var(--accent-color)',
                  color: (isCreatingList ? !newListName.trim() : !selectedListId) ? 'var(--text-disabled)' : 'white',
                  cursor: (isCreatingList ? !newListName.trim() : !selectedListId) ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreatingList ? 'Create & Add' : 'Add to List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookmarkButton