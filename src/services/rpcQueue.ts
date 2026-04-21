import type { RpcQueueConfig } from '../types'

type RequiredConfig = Required<RpcQueueConfig>

interface PendingEntry {
  execute: () => void
}

const DEFAULT_CONFIG: RequiredConfig = {
  minDelayMs: 500,
  baseBackoffMs: 2_000,
  maxBackoffMs: 30_000,
  backoffMultiplier: 2,
  maxRetries: 4,
}

export class RpcQueue {
  private config: RequiredConfig
  private busy = false
  private pending: PendingEntry[] = []
  private lastDispatchTime = Date.now()
  private backoffUntil = 0
  private consecutiveRateLimits = 0

  constructor(config?: RpcQueueConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  createFetchFn(): typeof fetch {
    return (input: RequestInfo | URL, init?: RequestInit) =>
      this._enqueue(() => fetch(input, init))
  }

  private _enqueue(fn: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      this.pending.push({
        execute: () => this._dispatch(fn).then(resolve, reject),
      })
      this._flush()
    })
  }

  private _flush(): void {
    if (this.pending.length > 0 && !this.busy) {
      const entry = this.pending.shift()!
      entry.execute()
    }
  }

  private async _dispatch(fn: () => Promise<Response>): Promise<Response> {
    this.busy = true
    try {
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        await this._waitForBackoff()
        await this._enforceMinDelay()
        this.lastDispatchTime = Date.now()

        let response: Response
        try {
          response = await fn()
        } catch (err) {
          if (attempt === this.config.maxRetries) throw err
          this._applyBackoff()
          continue
        }

        if (response.status !== 429) {
          this.consecutiveRateLimits = 0
          return response
        }

        this._applyBackoff()
        if (attempt === this.config.maxRetries) return response
      }

      throw new Error('[RpcQueue] Unexpected exit from retry loop')
    } finally {
      this.busy = false
      this._flush()
    }
  }

  private async _waitForBackoff(): Promise<void> {
    const remaining = this.backoffUntil - Date.now()
    if (remaining > 0) await this._sleep(remaining)
  }

  private async _enforceMinDelay(): Promise<void> {
    const elapsed = Date.now() - this.lastDispatchTime
    if (elapsed < this.config.minDelayMs) {
      await this._sleep(this.config.minDelayMs - elapsed)
    }
  }

  private _applyBackoff(): void {
    this.consecutiveRateLimits++
    const base =
      this.config.baseBackoffMs *
      Math.pow(this.config.backoffMultiplier, this.consecutiveRateLimits - 1)
    const capped = Math.min(base, this.config.maxBackoffMs)
    const jitter = capped * (0.8 + Math.random() * 0.4)
    this.backoffUntil = Date.now() + jitter
    console.warn(
      `[RpcQueue] 429 detected (×${this.consecutiveRateLimits}). Backoff: ${Math.round(jitter)}ms`
    )
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
