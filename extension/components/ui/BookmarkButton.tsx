/**
 * BookmarkButton Component
 * Allows users to add triplets to their bookmark lists
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
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

  const handleOpenModal = () => {
    setShowModal(true)
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
        onClick={handleOpenModal}
        className={className}
      />

      {showModal && createPortal(
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false)
            setIsCreatingList(false)
            setNewListName('')
            setSelectedListId('')
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                Add to Bookmark List
              </div>
            </div>

            <div className="modal-body">
              {/* Show triplet preview */}
              <div className="triplet-preview">
                <div className="triplet-preview-label">
                  Triplet to bookmark:
                </div>
                <div className="triplet-preview-content">
                  <strong>{triplet.subject}</strong> → {triplet.predicate} → <strong>{triplet.object}</strong>
                </div>
              </div>

              {!isCreatingList ? (
                <>
                  {/* List selection */}
                  {lists.length > 0 ? (
                    <div className="form-group">
                      <label className="label">
                        Select a list:
                      </label>
                      <select
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="select"
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
                    <div className="empty-message">
                      No bookmark lists found. Create your first list below!
                    </div>
                  )}

                  {/* Create new list option */}
                  <div className="form-group">
                    <button
                      onClick={() => setIsCreatingList(true)}
                      className="btn secondary full-width"
                    >
                      + Create New List
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Create new list form */}
                  <div className="form-group">
                    <label className="label">
                      New list name:
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Enter list name..."
                      autoFocus
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <button
                      onClick={() => {
                        setIsCreatingList(false)
                        setNewListName('')
                      }}
                      className="btn secondary full-width"
                    >
                      ← Back to List Selection
                    </button>
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="form-actions">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setIsCreatingList(false)
                    setNewListName('')
                    setSelectedListId('')
                  }}
                  className="btn secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToBookmark}
                  disabled={isCreatingList ? !newListName.trim() : !selectedListId}
                  className="btn primary"
                >
                  {isCreatingList ? 'Create & Add' : 'Add to List'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default BookmarkButton