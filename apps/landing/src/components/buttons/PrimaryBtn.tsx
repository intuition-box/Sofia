import type { ReactNode } from 'react'
import styles from './PrimaryBtn.module.css'

interface PrimaryBtnProps {
  href: string
  children: ReactNode
}

/**
 * PrimaryBtn — solid filled CTA matching the Hero "Open Explorer" look
 * (deep-ink slab + peach text) with a hard hover swap to white bg +
 * deep-ink text. All styling lives in PrimaryBtn.module.css; hover is a
 * pure :hover pseudo so no JS state.
 */
export function PrimaryBtn({ href, children }: PrimaryBtnProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}>
      {children}
    </a>
  )
}
