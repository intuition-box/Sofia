// Test preload: give `bun test` a DOM (parseBookmarks uses DOMParser). Reuses
// the already-installed happy-dom — no extra dependency.
import { Window } from "happy-dom"

const window = new Window()
;(globalThis as any).DOMParser = window.DOMParser
;(globalThis as any).window = window
;(globalThis as any).document = window.document
