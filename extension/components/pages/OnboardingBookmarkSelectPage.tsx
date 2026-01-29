import { useState, useEffect, useMemo } from 'react'
import { useRouter, type BookmarkData } from '../layout/RouterProvider'
import FullScreenLoader from '../ui/FullScreenLoader'
import '../styles/OnboardingStyles.css'

interface DomainGroup {
  domain: string
  bookmarks: BookmarkData[]
}

const OnboardingBookmarkSelectPage = () => {
  const { navigateTo, onboardingBookmarks } = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)

  // Group bookmarks by domain
  const domainGroups = useMemo<DomainGroup[]>(() => {
    const map = new Map<string, BookmarkData[]>()
    for (const bm of onboardingBookmarks) {
      try {
        const domain = new URL(bm.url).hostname.replace('www.', '')
        if (!map.has(domain)) map.set(domain, [])
        map.get(domain)!.push(bm)
      } catch { /* skip invalid */ }
    }
    return Array.from(map.entries())
      .map(([domain, bookmarks]) => ({ domain, bookmarks }))
      .sort((a, b) => b.bookmarks.length - a.bookmarks.length)
  }, [onboardingBookmarks])

  // Select all by default
  useEffect(() => {
    const allUrls = new Set(onboardingBookmarks.map(b => b.url))
    setSelected(allUrls)
  }, [onboardingBookmarks])

  const selectedCount = selected.size

  const toggleUrl = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const toggleDomain = (group: DomainGroup) => {
    const domainUrls = group.bookmarks.map(b => b.url)
    const allSelected = domainUrls.every(url => selected.has(url))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        domainUrls.forEach(url => next.delete(url))
      } else {
        domainUrls.forEach(url => next.add(url))
      }
      return next
    })
  }

  const toggleCollapse = (domain: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(onboardingBookmarks.map(b => b.url)))
  }

  const deselectAll = () => {
    setSelected(new Set())
  }

  const handleImport = () => {
    const selectedBookmarks = onboardingBookmarks.filter(b => selected.has(b.url))
    if (selectedBookmarks.length === 0) return

    setIsImporting(true)
    chrome.runtime.sendMessage(
      {
        type: 'IMPORT_SELECTED_BOOKMARKS',
        data: { bookmarks: selectedBookmarks }
      },
      (response) => {
        setIsImporting(false)
        if (response?.success) {
          localStorage.setItem('targetTab', 'Echoes')
          navigateTo('Sofia')
        } else {
          console.error('Import failed:', response?.error)
        }
      }
    )
  }

  const handleBack = () => {
    navigateTo('onboarding-tutorial')
  }

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return ''
    }
  }

  return (
    <>
      <FullScreenLoader
        isVisible={isImporting}
        message="Importing selected bookmarks..."
      />
      <div className="bookmark-select-page">
        <div className="bookmark-select-header">
          <h2 className="onboarding-title">Select bookmarks</h2>
          <p className="bookmark-select-count">
            {selectedCount} / {onboardingBookmarks.length} selected
          </p>
          <div className="bookmark-select-actions-top">
            <button className="bookmark-select-link" onClick={selectAll}>Select all</button>
            <button className="bookmark-select-link" onClick={deselectAll}>Deselect all</button>
          </div>
        </div>

        <div className="bookmark-select-list">
          {domainGroups.map(group => {
            const domainUrls = group.bookmarks.map(b => b.url)
            const allSelected = domainUrls.every(url => selected.has(url))
            const someSelected = domainUrls.some(url => selected.has(url))
            const isCollapsed = collapsed.has(group.domain)

            return (
              <div key={group.domain} className="bookmark-domain-group">
                <div className="bookmark-domain-header" onClick={() => toggleCollapse(group.domain)}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={(e) => { e.stopPropagation(); toggleDomain(group) }}
                    className="bookmark-checkbox"
                  />
                  <img src={getFavicon(group.bookmarks[0].url)} alt="" className="bookmark-favicon" />
                  <span className="bookmark-domain-name">{group.domain}</span>
                  <span className="bookmark-domain-count">{group.bookmarks.length}</span>
                  <span className={`bookmark-chevron ${isCollapsed ? '' : 'open'}`}>&#9662;</span>
                </div>

                {!isCollapsed && (
                  <div className="bookmark-url-list">
                    {group.bookmarks.map(bm => (
                      <label key={bm.url} className="bookmark-url-item">
                        <input
                          type="checkbox"
                          checked={selected.has(bm.url)}
                          onChange={() => toggleUrl(bm.url)}
                          className="bookmark-checkbox"
                        />
                        <span className="bookmark-url-title" title={bm.url}>
                          {bm.title || bm.url}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="bookmark-select-footer">
          <button
            className="onboarding-btn onboarding-btn-primary"
            onClick={handleImport}
            disabled={selectedCount === 0 || isImporting}
          >
            Import {selectedCount} selected
          </button>
          <button
            className="onboarding-btn onboarding-btn-secondary"
            onClick={handleBack}
          >
            Back
          </button>
        </div>
      </div>
    </>
  )
}

export default OnboardingBookmarkSelectPage
