import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

interface AuthToken {
  name: string
  value: string
  source: 'localStorage' | 'sessionStorage' | 'cookie'
}

interface ApiCall {
  url: string
  method: string
  status?: number
  timestamp: number
  hasAuth: boolean
}

class DataDetector {
  private authTokens: AuthToken[] = []
  private apiCalls: ApiCall[] = []
  private hostname: string = window.location.hostname

  constructor() {
    this.init()
  }

  private init() {
    if (this.shouldIgnore()) return

    console.log('🔍 [DataDetector] Starting on:', this.hostname)
    
    // Extract auth tokens
    this.extractAuthTokens()
    
    // Intercept API calls
    this.interceptApiCalls()
    
    // Analyze after page loads
    setTimeout(() => this.analyzeAndCreateTriplets(), 2000)
  }

  private shouldIgnore(): boolean {
    const ignored = ['chrome-extension', 'localhost', 'googletagmanager', 'doubleclick']
    return ignored.some(domain => this.hostname.includes(domain))
  }

  private extractAuthTokens() {
    const commonTokens = [
      'authToken', 'access_token', 'jwt', 'session', 'token',
      'github_token', '_gh_sess', 'JSESSIONID', 'li_at', 
      'auth_token', 'ct0', 'reddit_session'
    ]

    // localStorage
    commonTokens.forEach(tokenName => {
      const value = localStorage.getItem(tokenName)
      if (value) {
        this.authTokens.push({ name: tokenName, value, source: 'localStorage' })
      }
    })

    // sessionStorage
    commonTokens.forEach(tokenName => {
      const value = sessionStorage.getItem(tokenName)
      if (value) {
        this.authTokens.push({ name: tokenName, value, source: 'sessionStorage' })
      }
    })

    // cookies
    commonTokens.forEach(tokenName => {
      const value = this.getCookie(tokenName)
      if (value) {
        this.authTokens.push({ name: tokenName, value, source: 'cookie' })
      }
    })

    console.log('🔑 [DataDetector] Found auth tokens:', this.authTokens.length)
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  private interceptApiCalls() {
    // Intercept fetch
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      this.logApiCall(args[0], 'fetch', response.status)
      return response
    }

    // Intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest.prototype.open
    window.XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      this.addEventListener('load', () => {
        ;(window as any).dataDetector?.logApiCall(url, method, this.status)
      })
      return originalXHR.call(this, method, url, ...args)
    }

    // Make detector available for XHR
    ;(window as any).dataDetector = this
  }

  private logApiCall(url: string | URL, method: string, status?: number) {
    const urlString = typeof url === 'string' ? url : url.toString()
    
    // Only log relevant API calls
    if (this.isRelevantApiCall(urlString)) {
      const hasAuth = this.authTokens.length > 0
      
      this.apiCalls.push({
        url: urlString,
        method,
        status,
        timestamp: Date.now(),
        hasAuth
      })
      
      console.log('🔗 [DataDetector] API call:', method, urlString)
    }
  }

  private isRelevantApiCall(url: string): boolean {
    // Check if it's an API call from the same domain
    if (url.startsWith('/')) return true
    if (url.includes(this.hostname)) return true
    
    // Check for common API patterns
    const apiPatterns = ['/api/', '/graphql', '/rest/', '/v1/', '/v2/', '/v3/']
    return apiPatterns.some(pattern => url.includes(pattern))
  }

  private async analyzeAndCreateTriplets() {
    if (this.authTokens.length === 0 && this.apiCalls.length === 0) {
      console.log('ℹ️ [DataDetector] No auth or API calls detected')
      return
    }

    const triplets = this.createTriplets()
    
    if (triplets.length > 0) {
      console.log('🎯 [DataDetector] Created triplets:', triplets.length)
      await this.sendTriplets(triplets)
    }
  }

  private createTriplets(): any[] {
    const triplets = []
    const currentUrl = window.location.href
    const title = document.title

    // Create triplets based on platform and actions
    const platform = this.detectPlatform()
    const actions = this.detectActions()

    actions.forEach(action => {
      triplets.push({
        subject: 'You',
        predicate: action.predicate,
        object: action.object,
        confidence: action.confidence,
        platform: platform,
        timestamp: Date.now(),
        url: currentUrl,
        evidence: action.evidence
      })
    })

    return triplets
  }

  private detectPlatform(): string {
    if (this.hostname.includes('github')) return 'GitHub'
    if (this.hostname.includes('linkedin')) return 'LinkedIn'
    if (this.hostname.includes('twitter') || this.hostname.includes('x.com')) return 'Twitter'
    if (this.hostname.includes('reddit')) return 'Reddit'
    if (this.hostname.includes('youtube')) return 'YouTube'
    return this.hostname
  }

  private detectActions(): any[] {
    const actions = []
    const path = window.location.pathname
    const hasAuth = this.authTokens.length > 0

    // GitHub patterns
    if (this.hostname.includes('github')) {
      if (path.includes('/star')) {
        actions.push({
          predicate: 'starred',
          object: this.extractRepoName() || 'repository',
          confidence: 0.9,
          evidence: 'starred repository page'
        })
      }
      if (path.includes('/follow')) {
        actions.push({
          predicate: 'followed',
          object: this.extractUsername() || 'user',
          confidence: 0.9,
          evidence: 'followed user page'
        })
      }
      if (hasAuth && this.isRepoPage()) {
        actions.push({
          predicate: 'explored',
          object: this.extractRepoName() || 'repository',
          confidence: 0.8,
          evidence: 'authenticated repository view'
        })
      }
    }

    // LinkedIn patterns
    if (this.hostname.includes('linkedin')) {
      if (path.includes('/in/')) {
        actions.push({
          predicate: 'viewed',
          object: 'LinkedIn profile',
          confidence: 0.8,
          evidence: 'profile page visit'
        })
      }
      if (hasAuth && path.includes('/feed/')) {
        actions.push({
          predicate: 'browsed',
          object: 'LinkedIn feed',
          confidence: 0.7,
          evidence: 'authenticated feed access'
        })
      }
    }

    // Twitter/X patterns
    if (this.hostname.includes('twitter') || this.hostname.includes('x.com')) {
      if (hasAuth && path === '/home') {
        actions.push({
          predicate: 'browsed',
          object: 'Twitter timeline',
          confidence: 0.8,
          evidence: 'authenticated timeline access'
        })
      }
    }

    // Generic patterns based on API calls
    this.apiCalls.forEach(call => {
      if (call.url.includes('/like') || call.url.includes('/favorite')) {
        actions.push({
          predicate: 'liked',
          object: 'content',
          confidence: 0.7,
          evidence: 'like API call'
        })
      }
      if (call.url.includes('/follow')) {
        actions.push({
          predicate: 'followed',
          object: 'user or content',
          confidence: 0.7,
          evidence: 'follow API call'
        })
      }
      if (call.url.includes('/bookmark') || call.url.includes('/save')) {
        actions.push({
          predicate: 'saved',
          object: 'content',
          confidence: 0.8,
          evidence: 'bookmark API call'
        })
      }
    })

    return actions
  }

  private extractRepoName(): string | null {
    const path = window.location.pathname
    const parts = path.split('/').filter(p => p)
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
    return null
  }

  private extractUsername(): string | null {
    const path = window.location.pathname
    const parts = path.split('/').filter(p => p)
    if (parts.length >= 1) {
      return parts[0]
    }
    return null
  }

  private isRepoPage(): boolean {
    const path = window.location.pathname
    const parts = path.split('/').filter(p => p)
    return parts.length >= 2 && !parts.includes('orgs') && !parts.includes('users')
  }

  private async sendTriplets(triplets: any[]) {
    try {
      chrome.runtime.sendMessage({
        type: 'STORE_DETECTED_TRIPLETS',
        triplets: triplets,
        metadata: {
          hostname: this.hostname,
          authTokensCount: this.authTokens.length,
          apiCallsCount: this.apiCalls.length,
          timestamp: Date.now()
        }
      })
      
      console.log('✅ [DataDetector] Triplets sent to background')
    } catch (error) {
      console.error('❌ [DataDetector] Failed to send triplets:', error)
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DataDetector())
} else {
  new DataDetector()
}