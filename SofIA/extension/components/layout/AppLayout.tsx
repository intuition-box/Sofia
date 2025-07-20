import React from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import SplineBackground from '../Splinebackground'
import { useRouter } from './RouterProvider'

interface AppLayoutProps {
  children: any
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage } = useRouter()

  return (
    <div style={styles.container}>
      <SplineBackground />
      {account && currentPage !== 'home-connected' && (
        <div style={styles.overlay} />
      )}
      
      <div style={styles.content}>
        {children}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    minHeight: '100vh',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 14, 14, 0.30)',
    zIndex: 1
  },
  content: {
    position: 'relative' as const,
    zIndex: 2,
    minHeight: 'calc(100vh - 60px)',
    paddingBottom: '60px'
  }
}

export default AppLayout