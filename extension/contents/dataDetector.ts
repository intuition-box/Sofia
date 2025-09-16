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
    
    // Listen for button clicks
    this.setupButtonListeners()
    
    // Analyze after page loads
    setTimeout(() => this.analyzeAndCreateTriplets(), 2000)
    
    // Extract existing follows after page loads
    setTimeout(() => this.extractExistingFollows(), 3000)
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

  private setupButtonListeners() {
    // Twitter/X Follow button detection
    if (this.hostname.includes('twitter') || this.hostname.includes('x.com')) {
      this.setupTwitterFollowDetection()
    }
    
    // GitHub Follow button detection
    if (this.hostname.includes('github')) {
      this.setupGitHubFollowDetection()
    }

    // LinkedIn Connect button detection
    if (this.hostname.includes('linkedin')) {
      this.setupLinkedInConnectDetection()
    }
  }

  private setupTwitterFollowDetection() {
    // Listen for clicks on the document
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target) return

      // Check if clicked element or its parent is a Follow button
      const followButton = this.findTwitterFollowButton(target)
      if (followButton) {
        const username = this.extractTwitterUsername()
        const action = this.determineTwitterAction(followButton)
        console.log('🐦 [DataDetector] Follow button clicked for:', username, 'Action:', action)
        
        // Create triplet immediately for button click
        this.createAndSendFollowTriplet(action, username || 'user', 'Twitter')
      }
    })
  }

  private findTwitterFollowButton(element: HTMLElement): HTMLElement | null {
    // Check current element and up to 3 parents for Follow button indicators
    let current = element
    for (let i = 0; i < 4; i++) {
      if (!current) break

      // Must be a button or have button role
      const isButton = current.tagName === 'BUTTON' || 
                      current.getAttribute('role') === 'button' ||
                      current.classList.contains('btn')

      if (isButton) {
        // Check for common Twitter Follow button patterns
        const text = current.textContent?.toLowerCase().trim() || ''
        const ariaLabel = current.getAttribute('aria-label')?.toLowerCase() || ''
        const dataTestId = current.getAttribute('data-testid') || ''

        // Must be EXACTLY follow/following, not just contain it
        if (text === 'follow' || 
            text === 'following' ||
            text === 'unfollow' ||
            ariaLabel.includes('follow') ||
            dataTestId.includes('follow')) {
          return current
        }
      }

      current = current.parentElement as HTMLElement
    }

    return null
  }

  private determineTwitterAction(button: HTMLElement): string {
    const text = button.textContent?.toLowerCase() || ''
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || ''
    
    // Check if it's currently "Following" (which means clicking will unfollow)
    if (text.includes('following') || ariaLabel.includes('following')) {
      return 'unfollowed'
    }
    
    // Check if it's "Follow" (which means clicking will follow)
    if (text.includes('follow') || ariaLabel.includes('follow')) {
      return 'followed'
    }
    
    // Default fallback
    return 'followed'
  }

  private extractTwitterUsername(): string | null {
    // Try to extract username from URL
    const path = window.location.pathname
    const segments = path.split('/').filter(s => s)
    
    if (segments.length > 0 && !segments[0].match(/^(home|explore|notifications|messages|i|settings)$/)) {
      return `@${segments[0]}`
    }

    // Try to extract from page content
    const usernameElements = document.querySelectorAll('[data-testid="UserName"]')
    if (usernameElements.length > 0) {
      const usernameText = usernameElements[0].textContent
      if (usernameText && usernameText.startsWith('@')) {
        return usernameText
      }
    }

    return null
  }

  private setupGitHubFollowDetection() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target) return

      const followButton = this.findGitHubFollowButton(target)
      if (followButton) {
        const username = this.extractGitHubUsername()
        const action = this.determineGitHubAction(followButton)
        console.log('🐙 [DataDetector] GitHub Follow button clicked for:', username, 'Action:', action)
        
        this.createAndSendFollowTriplet(action, username || 'GitHub user', 'GitHub')
      }
    })
  }

  private findGitHubFollowButton(element: HTMLElement): HTMLElement | null {
    let current = element
    for (let i = 0; i < 4; i++) {
      if (!current) break

      // Must be a button
      const isButton = current.tagName === 'BUTTON' || 
                      current.classList.contains('btn') ||
                      current.getAttribute('role') === 'button'

      if (isButton) {
        const text = current.textContent?.toLowerCase().trim() || ''

        // Must be EXACTLY follow/unfollow
        if (text === 'follow' || text === 'unfollow') {
          return current
        }
      }

      current = current.parentElement as HTMLElement
    }

    return null
  }

  private determineGitHubAction(button: HTMLElement): string {
    const text = button.textContent?.toLowerCase() || ''
    
    // Check if it's "Unfollow" (which means currently following)
    if (text.includes('unfollow')) {
      return 'unfollowed'
    }
    
    // Check if it's "Follow"
    if (text.includes('follow')) {
      return 'followed'
    }
    
    // Default fallback
    return 'followed'
  }

  private extractGitHubUsername(): string | null {
    const path = window.location.pathname
    const segments = path.split('/').filter(s => s)
    
    if (segments.length > 0 && !segments[0].match(/^(orgs|topics|trending|marketplace|pricing|team|enterprise)$/)) {
      return segments[0]
    }

    return null
  }

  private setupLinkedInConnectDetection() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target) return

      const connectButton = this.findLinkedInConnectButton(target)
      if (connectButton) {
        const profileName = this.extractLinkedInProfileName()
        console.log('💼 [DataDetector] LinkedIn Connect button clicked for:', profileName)
        
        this.createAndSendFollowTriplet('connected', profileName || 'LinkedIn user', 'LinkedIn')
      }
    })
  }

  private findLinkedInConnectButton(element: HTMLElement): HTMLElement | null {
    let current = element
    for (let i = 0; i < 4; i++) {
      if (!current) break

      // Must be a button
      const isButton = current.tagName === 'BUTTON' || 
                      current.getAttribute('role') === 'button' ||
                      current.classList.contains('btn')

      if (isButton) {
        const text = current.textContent?.toLowerCase().trim() || ''
        const ariaLabel = current.getAttribute('aria-label')?.toLowerCase() || ''

        // Must be EXACTLY connect/follow
        if (text === 'connect' || 
            text === 'follow' || 
            text === 'unfollow' ||
            ariaLabel.includes('connect') ||
            ariaLabel.includes('follow')) {
          return current
        }
      }

      current = current.parentElement as HTMLElement
    }

    return null
  }

  private extractLinkedInProfileName(): string | null {
    // Try to extract name from profile page
    const nameSelectors = [
      'h1[class*="text-heading"]',
      '.text-heading-xlarge',
      '.pv-text-details__name',
      '[data-anonymize="person-name"]'
    ]

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector)
      if (element?.textContent?.trim()) {
        return element.textContent.trim()
      }
    }

    return null
  }

  private async createAndSendFollowTriplet(predicate: string, object: string, platform: string) {
    const triplet = {
      subject: 'You',
      predicate: predicate,
      object: object,
      confidence: 0.95, // High confidence for direct button clicks
      platform: platform,
      timestamp: Date.now(),
      url: window.location.href,
      evidence: 'button click detected'
    }

    console.log('🎯 [DataDetector] Creating follow triplet:', triplet)

    try {
      await this.sendTriplets([triplet])
    } catch (error) {
      console.error('❌ [DataDetector] Failed to send follow triplet:', error)
    }
  }

  private logApiCall(url: string | URL | Request, method: string, status?: number) {
    let urlString: string
    if (typeof url === 'string') {
      urlString = url
    } else if (url instanceof URL) {
      urlString = url.toString()
    } else if (url instanceof Request) {
      urlString = url.url
    } else {
      urlString = String(url)
    }
    
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

  private async extractExistingFollows() {
    if (this.authTokens.length === 0) {
      console.log('ℹ️ [DataDetector] No auth tokens found, skipping follow extraction')
      return
    }

    console.log('🔍 [DataDetector] Extracting existing follows...')

    if (this.hostname.includes('twitter') || this.hostname.includes('x.com')) {
      await this.extractTwitterFollowing()
    } else if (this.hostname.includes('github')) {
      await this.extractGitHubFollowing()
    } else if (this.hostname.includes('linkedin')) {
      await this.extractLinkedInConnections()
    }
  }

  private async extractTwitterFollowing() {
    try {
      console.log('🐦 [DataDetector] Extracting Twitter following list...')
      
      // Try multiple API endpoints
      const endpoints = [
        '/i/api/1.1/friends/list.json?count=200',
        '/i/api/1.1/friends/ids.json?count=5000',
        '/api/1.1/friends/list.json?count=200'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await this.makeAuthenticatedRequest(endpoint)
          if (response && response.users) {
            await this.processTwitterFollowing(response.users)
            break
          } else if (response && response.ids) {
            await this.processTwitterFollowingIds(response.ids)
            break
          }
        } catch (error) {
          console.log('🐦 [DataDetector] Endpoint failed:', endpoint, error)
        }
      }
    } catch (error) {
      console.error('❌ [DataDetector] Failed to extract Twitter following:', error)
    }
  }

  private async extractGitHubFollowing() {
    try {
      console.log('🐙 [DataDetector] Extracting GitHub following list...')
      
      // Get current user first
      const userResponse = await this.makeAuthenticatedRequest('/user')
      if (!userResponse || !userResponse.login) {
        console.log('❌ [DataDetector] Could not get GitHub user info')
        return
      }

      const username = userResponse.login
      const followingResponse = await this.makeAuthenticatedRequest(`/users/${username}/following?per_page=100`)
      
      if (followingResponse && Array.isArray(followingResponse)) {
        await this.processGitHubFollowing(followingResponse)
      }
    } catch (error) {
      console.error('❌ [DataDetector] Failed to extract GitHub following:', error)
    }
  }

  private async extractLinkedInConnections() {
    try {
      console.log('💼 [DataDetector] Extracting LinkedIn connections...')
      
      // LinkedIn API is more restricted, try common endpoints
      const endpoints = [
        '/voyager/api/relationships/dash/connections?count=100',
        '/voyager/api/identity/profiles/~/connections?count=100'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await this.makeAuthenticatedRequest(endpoint)
          if (response && response.elements) {
            await this.processLinkedInConnections(response.elements)
            break
          }
        } catch (error) {
          console.log('💼 [DataDetector] LinkedIn endpoint failed:', endpoint)
        }
      }
    } catch (error) {
      console.error('❌ [DataDetector] Failed to extract LinkedIn connections:', error)
    }
  }

  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    const fullUrl = endpoint.startsWith('/') ? `${window.location.origin}${endpoint}` : endpoint
    
    // Get auth headers
    const headers = this.buildAuthHeaders()
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.log('🔗 [DataDetector] API call failed:', fullUrl, error)
      throw error
    }
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // Add auth tokens as headers
    this.authTokens.forEach(token => {
      if (token.source === 'cookie') {
        // Don't add cookies to headers, they're sent automatically
        return
      }

      // Bearer token patterns
      if (token.name.includes('token') || token.name.includes('jwt')) {
        headers['Authorization'] = `Bearer ${token.value}`
      }

      // CSRF tokens
      if (token.name.includes('csrf') || token.name.includes('ct0')) {
        headers['X-CSRF-Token'] = token.value
      }
    })

    return headers
  }

  private async processTwitterFollowing(users: any[]) {
    console.log(`🐦 [DataDetector] Processing ${users.length} Twitter following`)
    
    const triplets = users.slice(0, 50).map(user => ({ // Limit to 50 to avoid spam
      subject: 'You',
      predicate: 'already follow',
      object: `@${user.screen_name}`,
      confidence: 0.9,
      platform: 'Twitter',
      timestamp: Date.now(),
      url: window.location.href,
      evidence: 'following list API'
    }))

    await this.sendTriplets(triplets)
  }

  private async processTwitterFollowingIds(ids: string[]) {
    console.log(`🐦 [DataDetector] Processing ${ids.length} Twitter following IDs`)
    
    // Convert IDs to basic triplets (we don't have usernames but we have relationships)
    const triplets = ids.slice(0, 100).map((id, index) => ({
      subject: 'You',
      predicate: 'follow',
      object: `Twitter user ${id}`,
      confidence: 0.8,
      platform: 'Twitter',
      timestamp: Date.now(),
      url: window.location.href,
      evidence: 'following IDs API'
    }))

    await this.sendTriplets(triplets)
  }

  private async processGitHubFollowing(users: any[]) {
    console.log(`🐙 [DataDetector] Processing ${users.length} GitHub following`)
    
    const triplets = users.map(user => ({
      subject: 'You',
      predicate: 'already follow',
      object: user.login,
      confidence: 0.9,
      platform: 'GitHub',
      timestamp: Date.now(),
      url: window.location.href,
      evidence: 'following list API'
    }))

    await this.sendTriplets(triplets)
  }

  private async processLinkedInConnections(connections: any[]) {
    console.log(`💼 [DataDetector] Processing ${connections.length} LinkedIn connections`)
    
    const triplets = connections.slice(0, 50).map((connection, index) => ({
      subject: 'You',
      predicate: 'connected with',
      object: connection.name || `LinkedIn connection ${index + 1}`,
      confidence: 0.8,
      platform: 'LinkedIn',
      timestamp: Date.now(),
      url: window.location.href,
      evidence: 'connections API'
    }))

    await this.sendTriplets(triplets)
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DataDetector())
} else {
  new DataDetector()
}