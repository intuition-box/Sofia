/**
 * BookmarkButton Component
 * Allows users to add triplets to their bookmark lists
 */

import { useState } from 'react'
import { useBookmarks } from '../../hooks/useBookmarks'
import type { Triplet } from '~components/pages/core-tabs/types'
import type { BookmarkedTriplet } from '../../types/bookmarks'
import QuickActionButton from './QuickActionButton'
import '../styles/BookmarkStyles.css'

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
        <div className="bookmark-modal-overlay">
          <div className="bookmark-modal-content">
            <h3 className="bookmark-modal-title">
              Add to Bookmark List
            </h3>

            {/* Show triplet preview */}
            <div className="bookmark-triplet-preview">
              <div className="bookmark-triplet-preview-label">
                Triplet to bookmark:
              </div>
              <div className="bookmark-triplet-preview-content">
                <strong>{triplet.subject}</strong> → {triplet.predicate} → <strong>{triplet.object}</strong>
              </div>
            </div>

            {!isCreatingList ? (
              <>
                {/* List selection */}
                {lists.length > 0 ? (
                  <div className="bookmark-form-group">
                    <label className="bookmark-label">
                      Select a list:
                    </label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="bookmark-select"
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
                  <div className="bookmark-empty-message">
                    No bookmark lists found. Create your first list below!
                  </div>
                )}

                {/* Create new list option */}
                <div className="bookmark-form-group">
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="bookmark-button bookmark-button-full"
                  >
                    + Create New List
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Create new list form */}
                <div className="bookmark-form-group">
                  <label className="bookmark-label">
                    New list name:
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    autoFocus
                    className="bookmark-input"
                  />
                </div>
                
                <div className="bookmark-form-group">
                  <button
                    onClick={() => {
                      setIsCreatingList(false)
                      setNewListName('')
                    }}
                    className="bookmark-button bookmark-button-full"
                  >
                    ← Back to List Selection
                  </button>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="bookmark-button-group">
              <button 
                onClick={() => {
                  setShowModal(false)
                  setIsCreatingList(false)
                  setNewListName('')
                  setSelectedListId('')
                }}
                className="bookmark-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddToBookmark}
                disabled={isCreatingList ? !newListName.trim() : !selectedListId}
                className={
                  (isCreatingList ? !newListName.trim() : !selectedListId) 
                    ? "bookmark-button-disabled" 
                    : "bookmark-button-primary"
                }
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