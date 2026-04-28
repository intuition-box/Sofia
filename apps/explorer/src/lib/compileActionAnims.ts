/**
 * Three.js animation builders for the "compile actions" (Merge /
 * Intersect / Subtract / Contrast). 1:1 port of
 * proto-explorer/src/lib/compileActionAnims.ts — each builder returns a
 * per-frame `update(t, pulseT)` callback that `mountThreeButton` drives.
 */
import * as THREE from 'three'

export type CompareMode = 'merge' | 'intersect' | 'subtract' | 'contrast'

const DURATION = 1.0

function makeLoopGeometry(n: number, radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    positions[i * 3] = Math.cos(a) * radius
    positions[i * 3 + 1] = Math.sin(a) * radius
    positions[i * 3 + 2] = 0
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geo
}

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3)
}
function clamp01(p: number): number {
  return Math.max(0, Math.min(1, p))
}

export interface BuildContext {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  accent: THREE.Color
  ink: THREE.Color
}
export type UpdateFn = (t: number, pulseT: number) => void
export type CompileAnimBuilder = (ctx: BuildContext) => UpdateFn

const merge: CompileAnimBuilder = ({ scene, accent }) => {
  const group = new THREE.Group()
  const matA = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const matB = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const c1 = new THREE.LineLoop(makeLoopGeometry(48, 0.45), matA)
  const c2 = new THREE.LineLoop(makeLoopGeometry(48, 0.45), matB)
  group.add(c1); group.add(c2)
  group.visible = false
  scene.add(group)
  return (_t, pulseT) => {
    const active = pulseT < DURATION
    group.visible = active
    if (!active) return
    const p = easeOutCubic(clamp01(pulseT / DURATION))
    const d = 0.75 * (1 - p)
    c1.position.x = -d
    c2.position.x = d
    const opacity = 1 - p * p
    matA.opacity = opacity
    matB.opacity = opacity
  }
}

const intersect: CompileAnimBuilder = ({ scene, accent }) => {
  const group = new THREE.Group()
  const matA = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const matB = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const c1 = new THREE.LineLoop(makeLoopGeometry(64, 0.5), matA)
  const c2 = new THREE.LineLoop(makeLoopGeometry(64, 0.5), matB)
  c1.position.x = -0.3
  c2.position.x = 0.3
  const lensMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0 })
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), lensMat)
  lens.scale.set(0.6, 1.3, 1)
  group.add(c1); group.add(c2); group.add(lens)
  group.visible = false
  scene.add(group)
  return (_t, pulseT) => {
    const active = pulseT < DURATION
    group.visible = active
    if (!active) return
    const p = clamp01(pulseT / DURATION)
    const opacity = 1 - p * p
    matA.opacity = opacity
    matB.opacity = opacity
    const flash = Math.sin(p * Math.PI)
    lensMat.opacity = flash * 0.65
  }
}

const subtract: CompileAnimBuilder = ({ scene, accent }) => {
  const group = new THREE.Group()
  const matA = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const matB = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const c1 = new THREE.LineLoop(makeLoopGeometry(64, 0.5), matA)
  const c2 = new THREE.LineLoop(makeLoopGeometry(64, 0.5), matB)
  c1.position.x = -0.3
  c2.position.x = 0.3
  group.add(c1); group.add(c2)
  group.visible = false
  scene.add(group)
  return (_t, pulseT) => {
    const active = pulseT < DURATION
    group.visible = active
    if (!active) return
    const p = clamp01(pulseT / DURATION)
    const pe = easeOutCubic(p)
    matA.opacity = 1 - p * p
    matB.opacity = Math.max(0, 1 - pe * 1.3)
    c2.position.x = 0.3 + pe * 0.6
  }
}

const contrast: CompileAnimBuilder = ({ scene, accent }) => {
  const group = new THREE.Group()
  const matA = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const matB = new THREE.LineBasicMaterial({ color: accent, transparent: true })
  const c1 = new THREE.LineLoop(makeLoopGeometry(48, 0.42), matA)
  const c2 = new THREE.LineLoop(makeLoopGeometry(48, 0.42), matB)
  group.add(c1); group.add(c2)
  group.visible = false
  scene.add(group)
  return (_t, pulseT) => {
    const active = pulseT < DURATION
    group.visible = active
    if (!active) return
    const p = clamp01(pulseT / DURATION)
    const pe = easeOutCubic(p)
    const d = pe * 0.9
    c1.position.x = -d
    c2.position.x = d
    c1.rotation.z = -pe * 0.7
    c2.rotation.z = pe * 0.7
    const opacity = 1 - p * p
    matA.opacity = opacity
    matB.opacity = opacity
  }
}

export const COMPILE_ACTION_BUILDERS: Record<CompareMode, CompileAnimBuilder> = {
  merge, intersect, subtract, contrast,
}

/** Duration (ms) of the compile animation — keep in sync with `DURATION` above. */
export const COMPILE_ANIM_MS = 1000
