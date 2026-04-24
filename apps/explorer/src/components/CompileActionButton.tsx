/**
 * CompileActionButton — the Merge / Intersect / Subtract / Contrast
 * buttons on the Compose page, wrapped around the proto's three.js
 * "fx-stage" animation layer.
 *
 * Port of `proto-explorer/src/components/threeButton.ts` adapted to
 * React lifecycle: the scene is built in `useEffect`, kept alive
 * across renders, and the click-pulse is driven by incrementing a
 * ref-based `lastPulseMs`. The canvas fades the circles in/out every
 * time the button is clicked, matching the proto behaviour.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  COMPILE_ACTION_BUILDERS,
  COMPILE_ANIM_MS,
  type CompareMode,
} from '@/lib/compileActionAnims'

interface CompileActionButtonProps {
  mode: CompareMode
  label: string
  title?: string
  disabled?: boolean
  onRun: (mode: CompareMode) => void
}

const CANVAS_SIZE = { w: 260, h: 200 }

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export default function CompileActionButton({
  mode,
  label,
  title,
  disabled,
  onRun,
}: CompileActionButtonProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastPulseMsRef = useRef<number>(-Infinity)
  const isCompilingRef = useRef<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Mount + teardown the three.js scene. Runs once per mode change.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const canvas = document.createElement('canvas')
    canvas.className = 'tb-canvas'
    stage.insertBefore(canvas, stage.firstChild)
    canvasRef.current = canvas

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(CANVAS_SIZE.w, CANVAS_SIZE.h, false)

    const scene = new THREE.Scene()
    const aspect = CANVAS_SIZE.w / CANVAS_SIZE.h
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10)
    camera.position.z = 3

    const accent = new THREE.Color(cssVar('--ds-accent', '#ffc6b0'))
    const ink = new THREE.Color(cssVar('--ds-ink', '#02000e'))

    const update = COMPILE_ACTION_BUILDERS[mode]({ scene, camera, accent, ink })

    // Click ripple — two concentric bursts, same as proto's mountThreeButton.
    const N = 64
    const positions = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      positions[i * 3] = Math.cos(a)
      positions[i * 3 + 1] = Math.sin(a)
    }
    const rippleGeoA = new THREE.BufferGeometry()
    rippleGeoA.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const rippleGeoB = new THREE.BufferGeometry()
    rippleGeoB.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    const rippleMatA = new THREE.LineBasicMaterial({ color: ink, transparent: true })
    const rippleMatB = new THREE.LineBasicMaterial({ color: ink, transparent: true })
    const rippleA = new THREE.LineLoop(rippleGeoA, rippleMatA)
    const rippleB = new THREE.LineLoop(rippleGeoB, rippleMatB)
    rippleA.visible = false
    rippleB.visible = false
    scene.add(rippleA)
    scene.add(rippleB)

    let raf = 0
    const startMs = performance.now()
    const RIPPLE_DURATION = 0.7
    const loop = (now: number): void => {
      const t = (now - startMs) / 1000
      const pulseT = (now - lastPulseMsRef.current) / 1000
      update(t, pulseT)

      // Ripple A — primary burst
      if (pulseT < RIPPLE_DURATION) {
        rippleA.visible = true
        const p = pulseT / RIPPLE_DURATION
        const s = 0.15 + p * 0.95
        rippleA.scale.set(s, s, 1)
        rippleMatA.opacity = 1 - p

        // Ripple B — 80 ms trailing burst
        const pB = Math.max(0, pulseT - 0.08) / RIPPLE_DURATION
        if (pB > 0 && pB < 1) {
          rippleB.visible = true
          const sB = 0.15 + pB * 0.95
          rippleB.scale.set(sB, sB, 1)
          rippleMatB.opacity = (1 - pB) * 0.55
        } else {
          rippleB.visible = false
        }
      } else {
        rippleA.visible = false
        rippleB.visible = false
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
      renderer.dispose()
      canvas.remove()
      canvasRef.current = null
    }
  }, [mode])

  // Refresh the colours when the theme toggles. Recomputes from CSS vars.
  useEffect(() => {
    const html = document.documentElement
    const ro = new MutationObserver(() => {
      // Force a remount on theme flip by bumping the canvas, simplest path.
      // In practice the ref is recreated on next useLayoutEffect run.
      const canvas = canvasRef.current
      if (canvas) canvas.dataset.themeTick = String(Date.now())
    })
    ro.observe(html, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => ro.disconnect()
  }, [])

  const handleClick = useCallback(() => {
    if (disabled || isCompilingRef.current) return
    lastPulseMsRef.current = performance.now()
    isCompilingRef.current = true
    buttonRef.current?.classList.add('is-compiling')
    // Let the animation play out, then fire the callback.
    window.setTimeout(() => {
      isCompilingRef.current = false
      buttonRef.current?.classList.remove('is-compiling')
      onRun(mode)
    }, COMPILE_ANIM_MS)
  }, [disabled, mode, onRun])

  return (
    <div
      ref={stageRef}
      className="fx-stage cmp-action-stage"
      data-compile-mode={mode}
    >
      <button
        ref={buttonRef}
        type="button"
        className="action-btn fx-btn"
        data-action={mode}
        disabled={disabled}
        title={title}
        onClick={handleClick}
      >
        {label}
      </button>
    </div>
  )
}
