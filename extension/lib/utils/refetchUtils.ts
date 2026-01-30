/**
 * Refetch utilities with exponential backoff
 * Replaces multiple setTimeout calls with a smarter retry strategy
 */

interface RefetchOptions {
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number
  /** Maximum delay in ms (default: 8000) */
  maxDelay?: number
  /** Maximum number of attempts (default: 4) */
  maxAttempts?: number
  /** Condition function to check if expected data appeared (optional) */
  condition?: () => boolean | Promise<boolean>
  /** Callback on each attempt */
  onAttempt?: (attempt: number) => void
}

/**
 * Refetch with exponential backoff
 * Retries: 1s, 2s, 4s, 8s (total ~15s)
 *
 * @param refetchFn - Function to call for refetch
 * @param options - Backoff options
 */
export async function refetchWithBackoff(
  refetchFn: () => Promise<void>,
  options: RefetchOptions = {}
): Promise<void> {
  const {
    initialDelay = 1000,
    maxDelay = 8000,
    maxAttempts = 4,
    condition,
    onAttempt
  } = options

  let attempt = 0
  let delay = initialDelay

  while (attempt < maxAttempts) {
    // Wait before refetch (except first attempt)
    if (attempt > 0) {
      await sleep(delay)
    }

    attempt++
    onAttempt?.(attempt)

    // Perform refetch
    await refetchFn()

    // Check condition if provided
    if (condition) {
      const conditionMet = await condition()
      if (conditionMet) {
        console.log(`✅ Refetch condition met after ${attempt} attempt(s)`)
        return
      }
    }

    // Increase delay (exponential backoff, capped at maxDelay)
    delay = Math.min(delay * 2, maxDelay)
  }

  console.log(`⚠️ Refetch completed after ${maxAttempts} attempts`)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}
