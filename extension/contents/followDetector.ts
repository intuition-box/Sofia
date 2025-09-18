import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}


class DataDetector {
  private hostname: string = window.location.hostname

  constructor() {
    this.init()
  }

  private init() {
    if (this.shouldIgnore()) return

    console.log('🔍 [DataDetector] Starting on:', this.hostname)
    
    // Only setup Twitter follow/unfollow detection
    this.setupButtonListeners()
  }

  private shouldIgnore(): boolean {
    const ignored = ['chrome-extension', 'localhost', 'googletagmanager', 'doubleclick']
    return ignored.some(domain => this.hostname.includes(domain))
  }



  private setupButtonListeners() {
    // Twitter/X Follow button detection only
    if (this.hostname.includes('twitter') || this.hostname.includes('x.com')) {
      this.setupTwitterFollowDetection()
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
        // IMPORTANT: Capture button state BEFORE the click changes it
        const textBeforeClick = followButton.textContent?.toLowerCase().trim() || ''
        const ariaLabelBeforeClick = followButton.getAttribute('aria-label')?.toLowerCase() || ''
        
        console.log('🐦 [DataDetector] Button state BEFORE click:', `text="${textBeforeClick}"`, `aria="${ariaLabelBeforeClick}"`)
        
        const username = this.extractTwitterUsername()
        const action = this.determineTwitterActionFromState(textBeforeClick, ariaLabelBeforeClick)
        console.log('🐦 [DataDetector] Follow button clicked for:', username, 'Action:', action)
        
        // Add slight delay to avoid rapid click issues
        setTimeout(() => {
          this.createAndSendFollowTriplet(action, username || 'user', 'Twitter')
        }, 100)
      }
    })
  }

  private findTwitterFollowButton(element: HTMLElement): HTMLElement | null {
    // Check current element and up to 3 parents for Follow button
    let current = element
    
    for (let i = 0; i < 4; i++) {
      if (!current) break
      
      if (current.tagName === 'BUTTON') {
        const text = current.textContent?.toLowerCase().trim() || ''
        if (text === 'follow' || text === 'following' || text === 'unfollow') {
          return current
        }
      }

      // Also check for elements with button role (might be needed for Twitter)
      if (current.getAttribute('role') === 'button') {
        const text = current.textContent?.toLowerCase().trim() || ''
        if (text === 'follow' || text === 'following' || text === 'unfollow') {
          return current
        }
      }

      current = current.parentElement as HTMLElement
    }
    return null
  }

  private determineTwitterActionFromState(text: string, ariaLabel: string): string {
    // Simple logic: text "unfollow" = user will unfollow, everything else = follow
    if (text === 'unfollow') {
      return 'unfollowed'
    }
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

  private async sendTriplets(triplets: any[]) {
    try {
      chrome.runtime.sendMessage({
        type: 'STORE_DETECTED_TRIPLETS',
        triplets: triplets,
        metadata: {
          hostname: this.hostname,
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