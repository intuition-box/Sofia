// src/hooks/useBookmarkImport.ts
import { useEffect, useCallback } from 'react'
import { useStorage } from '@plasmohq/storage/hook'

type ImportState = {
  jobId?: string
  status: 'idle' | 'initializing' | 'running' | 'success' | 'error'
  progress: number // 0..100
  message?: string
  startedAt?: string
  finishedAt?: string
}

const DEFAULT_STATE: ImportState = {
  status: 'idle',
  progress: 0
}

const STORAGE_KEY = 'bookmark-import/state'

export function useBookmarkImport() {
  const [state, setState] = useStorage<ImportState>(STORAGE_KEY, DEFAULT_STATE)

  // Démarrer côté UI (déclenche le background via message)
  const startImport = useCallback(async () => {
    const jobId = crypto.randomUUID()
    setState({
      status: 'initializing',
      progress: 0,
      jobId,
      message: 'Initializing import...',
      startedAt: new Date().toISOString()
    })
    await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS', jobId })
  }, [setState])

  // Écoute *globale* des messages -> écrit dans le storage
  useEffect(() => {
    const handler = (msg: any) => {
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'BOOKMARK_IMPORT_PROGRESS') {
        setState(prev => ({
          ...(prev ?? DEFAULT_STATE),
          status: 'running',
          progress: Math.max(0, Math.min(100, Number(msg.progress ?? 0))),
          message: msg.status ?? 'Import in progress...'
        }))
      }
      if (msg.type === 'BOOKMARK_IMPORT_DONE') {
        setState(prev => ({
          ...(prev ?? DEFAULT_STATE),
          status: 'success',
          progress: 100,
          message: `Import completed! ${msg.count ?? 0} bookmarks processed`,
          finishedAt: new Date().toISOString()
        }))
      }
      if (msg.type === 'BOOKMARK_IMPORT_ERROR') {
        setState(prev => ({
          ...(prev ?? DEFAULT_STATE),
          status: 'error',
          message: String(msg.error ?? 'Import failed')
        }))
      }
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [setState])

  // Optionnel: reset manuel (ne le fais *pas* automatiquement dans finally)
  const resetImport = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [setState])

  return {
    state,
    startImport,
    resetImport,
    // Helpers pratiques pour l’UI
    isImporting: state.status === 'initializing' || state.status === 'running'
  }
}
