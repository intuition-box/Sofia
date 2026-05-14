import { useEffect, useRef, type ReactNode } from 'react'
import { ReactLenis, type LenisRef } from 'lenis/react'
import { gsap, ScrollTrigger } from './gsap'

interface SmoothScrollProps {
  children: ReactNode
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000)
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    const lenis = lenisRef.current?.lenis
    const onScroll = () => ScrollTrigger.update()
    lenis?.on('scroll', onScroll)

    return () => {
      gsap.ticker.remove(update)
      lenis?.off('scroll', onScroll)
    }
  }, [])

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        /* Snappier than the 1.2s default — the deck transitions feel
           sluggish if the wheel input takes a full second to settle. */
        duration: 0.8,
        wheelMultiplier: 1.1,
      }}
      ref={lenisRef}
    >
      {children}
    </ReactLenis>
  )
}
