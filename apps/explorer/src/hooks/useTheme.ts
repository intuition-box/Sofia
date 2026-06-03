import { useEffect } from 'react'

/**
 * Dark is now the only theme. The light/white mode (and its toggle) was
 * removed — this hook just guarantees the `dark` class stays on <html>
 * and returns a frozen API so any remaining call sites keep compiling.
 */
export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const noop = () => {}
  return { theme: 'dark' as const, toggleTheme: noop, setTheme: noop }
}
