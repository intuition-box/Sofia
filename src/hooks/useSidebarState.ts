import { useState, useEffect, useCallback } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop'

interface UseSidebarStateResult {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isLaptop: boolean
  isDesktop: boolean
  leftOpen: boolean
  rightOpen: boolean
  toggleLeft: () => void
  toggleRight: () => void
  closeLeft: () => void
  closeRight: () => void
}

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  if (w < 1280) return 'laptop'
  return 'desktop'
}

export function useSidebarState(): UseSidebarStateResult {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 767px)')
    const mqTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const mqLaptop = window.matchMedia('(min-width: 1024px) and (max-width: 1279px)')

    const update = () => {
      const bp = getBreakpoint()
      setBreakpoint(bp)
      // Auto-close sidebars when shrinking below their visible breakpoint
      if (bp === 'mobile' || bp === 'tablet') {
        setLeftOpen(false)
        setRightOpen(false)
      } else if (bp === 'laptop') {
        setRightOpen(false)
      }
    }

    mqMobile.addEventListener('change', update)
    mqTablet.addEventListener('change', update)
    mqLaptop.addEventListener('change', update)

    return () => {
      mqMobile.removeEventListener('change', update)
      mqTablet.removeEventListener('change', update)
      mqLaptop.removeEventListener('change', update)
    }
  }, [])

  const toggleLeft = useCallback(() => setLeftOpen((o) => !o), [])
  const toggleRight = useCallback(() => setRightOpen((o) => !o), [])
  const closeLeft = useCallback(() => setLeftOpen(false), [])
  const closeRight = useCallback(() => setRightOpen(false), [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isLaptop: breakpoint === 'laptop',
    isDesktop: breakpoint === 'desktop',
    leftOpen,
    rightOpen,
    toggleLeft,
    toggleRight,
    closeLeft,
    closeRight,
  }
}
