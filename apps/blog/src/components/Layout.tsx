import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import styles from './Layout.module.css'

/**
 * Layout — single shell rendered around every route. Restores scroll
 * to the top on route change (React Router doesn't do that by default
 * the way Next.js or Docusaurus do, and "the blog scrolls to the
 * middle of the next post" is a worse default than a hard reset).
 */
export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
