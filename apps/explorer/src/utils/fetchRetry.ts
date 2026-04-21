const MAX_RETRIES = 3

export async function fetchWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  throw new Error('Unreachable')
}
