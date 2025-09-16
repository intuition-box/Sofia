import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

interface AuthToken {
  name: string
  value: string
  type: 'jwt' | 'bearer' | 'session' | 'api_key' | 'unknown'
  source: 'localStorage' | 'sessionStorage' | 'cookie'
  platform?: string
}

interface AuthenticationStatus {
  isAuthenticated: boolean
  confidence: number
  indicators: string[]  // What made us think user is authenticated
  authSources: string[] // Where we found auth indicators
}

interface ApiEndpoint {
  url: string
  method: string
  hasAuth: boolean
  responseType?: string
}

interface DataPattern {
  type: 'purchase' | 'booking' | 'media' | 'social' | 'travel' | 'food' | 'unknown'
  data: any
  confidence: number
}

interface GenericTriplet {
  subject: string
  predicate: string
  object: string
  confidence: number
  platform: string
  timestamp: number
  url: string
  evidence: string
  dataType: string
}

class TokenDetector {
  private hostname: string = window.location.hostname
  private detectedTokens: AuthToken[] = []
  private apiEndpoints: ApiEndpoint[] = []
  private dataPatterns: DataPattern[] = []
  private hasExtracted: boolean = false
  private watchedTitles: Set<string> = new Set() // Track watched titles to prevent duplicates
  private authStatus: AuthenticationStatus = {
    isAuthenticated: false,
    confidence: 0,
    indicators: [],
    authSources: []
  }

  constructor() {
    this.init()
  }

  private init() {
    if (this.shouldIgnore()) return

    console.log('🔐 [TokenDetector] Starting secure data extraction on:', this.hostname)
    
    // 1. Start passive network monitoring immediately (BEST APPROACH)
    console.log('🎧 [TokenDetector] Setting up passive network interception...')
    this.setupNetworkInterception()
    
    // 2. Extract in-page state (safe, no token reading)
    this.extractInPageState()
    
    // 3. Universal authentication detection (safer patterns)
    this.detectUserAuthentication()
    
    // 4. Setup navigation monitoring for individual titles
    this.setupNavigationMonitoring()
    
    // 5. Show popup to propose data extraction (only once per session)
    if (this.authStatus.isAuthenticated && !this.hasExtracted) {
      console.log('🎯 [TokenDetector] User authenticated on Netflix - showing extraction popup...')
      setTimeout(() => this.showExtractionPopup(), 1000)
    } else {
      console.log('🔐 [TokenDetector] No popup needed (not authenticated or already extracted)')
    }
  }

  private shouldIgnore(): boolean {
    const ignored = ['chrome-extension', 'localhost', 'googletagmanager', 'doubleclick']
    return ignored.some(domain => this.hostname.includes(domain))
  }

  private setupNetworkInterception() {
    // Intercept fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      
      try {
        const response = await originalFetch(...args)
        
        // Check if this is a Netflix consumption API
        if (this.isConsumptionAPI(url.toString())) {
          console.log('🎯 [TokenDetector] Intercepted consumption API:', url.toString())
          
          // Clone response to read data without affecting original
          const clonedResponse = response.clone()
          try {
            const data = await clonedResponse.json()
            if (this.isConsumptionData(data)) {
              console.log('🎯 [TokenDetector] Found consumption data in API response!')
              this.sendRawDataToAgent(data, `intercepted-api-${url}`)
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
        
        return response
      } catch (error) {
        return originalFetch(...args)
      }
    }

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open
    const originalXHRSend = XMLHttpRequest.prototype.send
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._interceptedUrl = url.toString()
      return originalXHROpen.call(this, method, url, ...rest)
    }
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        if (this.status >= 200 && this.status < 300) {
          const url = this._interceptedUrl
          
          if (url && this.isConsumptionAPI && this.isConsumptionAPI(url)) {
            console.log('🎯 [TokenDetector] Intercepted XHR consumption API:', url)
            
            try {
              const data = JSON.parse(this.responseText)
              if (this.isConsumptionData && this.isConsumptionData(data)) {
                console.log('🎯 [TokenDetector] Found consumption data in XHR response!')
                this.sendRawDataToAgent && this.sendRawDataToAgent(data, `intercepted-xhr-${url}`)
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        }
      }.bind(this))
      
      return originalXHRSend.call(this, ...args)
    }

    console.log('🎧 [TokenDetector] Network interception active')
  }

  private extractNetflixContentFromDOM() {
    // Éviter les extractions multiples
    if (this.hasExtracted) {
      console.log('🎬 [TokenDetector] Already extracted - skipping to avoid duplicates')
      return
    }
    
    console.log('🎬 [TokenDetector] Extracting Netflix viewing data...')
    
    const viewingData: any = {
      continueWatching: [],
      watchedTitles: []
    }

    try {
      // 1. ONLY Extract Continue Watching section (viewing history)
      const continueWatchingSelectors = [
        '[data-testid="continue-watching"]',
        '[data-list-context="continueWatching"]',
        '.continueWatching',
        '[aria-label*="continuer"]',
        '[aria-label*="continue"]',
        '[data-testid*="continue"]',
        '[class*="continue"]'
      ]
      
      continueWatchingSelectors.forEach(selector => {
        const section = document.querySelector(selector)
        if (section) {
          const titles = this.extractTitlesFromSection(section, 'continue-watching')
          viewingData.continueWatching.push(...titles)
        }
      })


      console.log('🎬 [TokenDetector] Viewing data extracted:', {
        continueWatching: viewingData.continueWatching.length,
        watchedTitles: viewingData.watchedTitles.length
      })

      // ONLY send if we have actual viewing data
      if (viewingData.continueWatching.length > 0 || viewingData.watchedTitles.length > 0) {
        console.log('🎯 [TokenDetector] Found Netflix viewing data - sending to AI agent!')
        this.sendRawDataToAgent(viewingData, 'netflix-viewing-history')
        
        // Marquer comme extrait pour éviter les doublons
        this.hasExtracted = true
        console.log('✅ [TokenDetector] Extraction completed - no more duplicates will be created')
      } else {
        console.log('📺 [TokenDetector] No viewing data found yet')
      }

    } catch (error) {
      console.log('🎬 [TokenDetector] Error extracting viewing data:', error)
    }
  }

  private extractTitlesFromSection(section: Element, sectionType: string): any[] {
    const titles: any[] = []
    
    // Look for title text in various ways
    const titleSelectors = [
      '[aria-label]',
      '[title]',
      '.title',
      'h3', 'h4', 'h5',
      '[data-testid*="name"]',
      '[data-testid*="title"]'
    ]
    
    titleSelectors.forEach(selector => {
      const elements = section.querySelectorAll(selector)
      elements.forEach(element => {
        const title = element.getAttribute('aria-label') || 
                     element.getAttribute('title') || 
                     element.textContent?.trim()
                     
        if (title && title.length > 2) {
          titles.push({
            title,
            section: sectionType,
            element: element.tagName,
            source: 'section-extraction'
          })
        }
      })
    })
    
    return titles
  }

  private extractWatchedTitleInfo(progressElement: Element): any {
    const titleInfo: any = {
      title: null,
      progress: null,
      type: null,
      source: 'viewing-progress'
    }
    
    // Find the associated title card
    const parentCard = progressElement.closest('[data-testid*="card"], .title-card, [role="group"], .slider-item')
    if (parentCard) {
      // Extract title from parent card
      titleInfo.title = parentCard.getAttribute('aria-label') ||
                       parentCard.querySelector('[aria-label]')?.getAttribute('aria-label') ||
                       parentCard.querySelector('[title]')?.getAttribute('title') ||
                       parentCard.querySelector('h3, h4, h5')?.textContent?.trim()
      
      // Extract progress value
      titleInfo.progress = progressElement.getAttribute('aria-valuenow') ||
                          progressElement.getAttribute('value') ||
                          progressElement.style.width
      
      // Determine if it's a movie or series
      const cardText = parentCard.textContent?.toLowerCase() || ''
      if (cardText.includes('season') || cardText.includes('episode') || cardText.includes('saison') || cardText.includes('épisode')) {
        titleInfo.type = 'series'
      } else if (cardText.includes('film') || cardText.includes('movie')) {
        titleInfo.type = 'movie'
      }
    }
    
    return titleInfo
  }


  private isConsumptionAPI(url: string): boolean {
    const consumptionPatterns = [
      // Netflix Shakti API patterns
      '/shakti/',
      '/pathEvaluator',
      '/memberapi/',
      
      // Netflix browse endpoints
      '/browse/my-list',
      '/browse/continue-watching',
      '/browse/recently-watched',
      '/viewingactivity',
      
      // Generic consumption patterns
      '/api/mylist',
      '/api/ratings',
      '/api/viewing',
      '/api/watchlist',
      '/api/thumbs',
      
      // Netflix-specific API patterns
      'falcor',
      'lolomo',
      'continueWatching',
      'myList'
    ]
    
    return consumptionPatterns.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()))
  }

  private showExtractionPopup() {
    // Vérifier si le popup existe déjà pour éviter les doublons
    if (document.getElementById('netflix-extraction-popup')) {
      console.log('🎬 [TokenDetector] Popup already exists - skipping')
      return
    }

    console.log('🎬 [TokenDetector] Creating Netflix data extraction popup...')

    // Créer le popup
    const popup = document.createElement('div')
    popup.id = 'netflix-extraction-popup'
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: #141414;
      border: 2px solid #e50914;
      border-radius: 8px;
      padding: 20px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `

    popup.innerHTML = `
      <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #e50914; font-size: 16px;">🎬 Netflix Data Extraction</h3>
        <span id="close-popup" style="cursor: pointer; font-size: 18px; color: #999; margin-left: auto;">&times;</span>
      </div>
      <p style="margin: 0 0 15px 0; line-height: 1.4;">
        Extract your Netflix viewing history and watchlist to create triplets for your knowledge graph?
      </p>
      <div style="display: flex; gap: 10px;">
        <button id="extract-netflix-btn" style="
          flex: 1;
          background: #e50914;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">Extract Data</button>
        <button id="cancel-extraction-btn" style="
          flex: 1;
          background: #333;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
        ">Not Now</button>
      </div>
    `

    // Ajouter le popup au DOM
    document.body.appendChild(popup)

    // Gérer les événements
    const extractBtn = document.getElementById('extract-netflix-btn')
    const cancelBtn = document.getElementById('cancel-extraction-btn')
    const closeBtn = document.getElementById('close-popup')

    const closePopup = () => {
      popup.remove()
      console.log('🎬 [TokenDetector] Popup closed')
    }

    const extractData = () => {
      console.log('🎬 [TokenDetector] User clicked Extract Data - starting extraction...')
      closePopup()
      this.extractNetflixContentFromDOM()
    }

    extractBtn?.addEventListener('click', extractData)
    cancelBtn?.addEventListener('click', closePopup)
    closeBtn?.addEventListener('click', closePopup)

    // Auto-fermeture après 30 secondes
    setTimeout(() => {
      if (document.getElementById('netflix-extraction-popup')) {
        closePopup()
        console.log('🎬 [TokenDetector] Popup auto-closed after 30s')
      }
    }, 30000)

    console.log('🎬 [TokenDetector] Netflix extraction popup displayed')
  }

  private setupNavigationMonitoring() {
    console.log('🎯 [TokenDetector] Setting up navigation monitoring for individual titles...')
    
    // Simple URL monitoring - just check every second
    let currentUrl = window.location.href
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        const newUrl = window.location.href
        console.log('🎯 [TokenDetector] URL changed:', newUrl)
        currentUrl = newUrl
        this.handleNavigationToTitle(newUrl)
      }
    }, 1000)
  }

  private handleNavigationToTitle(url: string) {
    // Check if it's a watch/title page
    const isWatchPage = url.includes('/watch/') || url.includes('/title/')
    
    if (!isWatchPage) {
      console.log('🎯 [TokenDetector] Not a watch/title page - ignoring')
      return
    }
    
    console.log('🎯 [TokenDetector] Navigated to watch/title page, extracting title from DOM...')
    
    // Wait for DOM to load then extract title
    setTimeout(() => {
      this.extractCurrentTitle(url)
    }, 2000)
  }

  private extractCurrentTitle(url: string) {
    console.log('🎬 [TokenDetector] Extracting current title from DOM...')
    
    // Simple selectors that work
    const titleSelectors = [
      'h1[data-uia="title-info-title"]',
      'h1[data-testid="hero-title"]', 
      '.title-info-title',
      '[data-uia="video-title"]',
      'h1.title'
    ]
    
    setTimeout(() => {
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector)
        if (titleElement && titleElement.textContent?.trim()) {
          const title = titleElement.textContent.trim()
          console.log(`🎯 [TokenDetector] Found title: "${title}"`)
          this.createWatchingTriplet(title, url)
          return
        }
      }
      console.log('📺 [TokenDetector] No title found')
    }, 2000)
  }

  private createWatchingTriplet(title: string, url: string) {
    console.log(`🎬 [TokenDetector] Creating watching triplet for: "${title}"`)
    
    const triplet = {
      subject: "you",
      predicate: "watch", 
      object: title
    }
    
    // Store immediately via IndexedDB
    chrome.runtime.sendMessage({
      type: 'STORE_DETECTED_TRIPLETS',
      triplets: [triplet],
      metadata: {
        platform: 'netflix',
        hostname: this.hostname,
        url: url,
        type: 'individual_title_watch'
      }
    }).then(response => {
      if (response?.success) {
        console.log(`✅ [TokenDetector] Stored individual watch triplet: you watch "${title}"`)
      } else {
        console.log('❌ [TokenDetector] Failed to store individual triplet:', response?.error)
      }
    }).catch(error => {
      console.log('❌ [TokenDetector] Error storing individual triplet:', error)
    })
  }

  private extractInPageState() {
    console.log('📄 [TokenDetector] Extracting in-page state...')

    // Setup listener for page state messages
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'PAGE_STATE') {
        console.log('📄 [TokenDetector] Received page state:', event.data)
        this.analyzePageState(event.data.data)
      }
    })

    // CSP-safe approach: Parse JSON scripts directly from DOM
    this.extractJSONScripts()
    
    // Try to access window objects that might be accessible from content script
    // Note: Some may be blocked by CSP, but we try what we can
    setTimeout(() => {
      this.tryAccessWindowObjects()
    }, 500)
  }

  private analyzePageState(pageState: any) {
    if (!pageState || typeof pageState !== 'object') return
    
    console.log('🔍 [TokenDetector] Analyzing extracted page state...')
    
    // Handle new structured data format
    if (pageState.extractedData && Array.isArray(pageState.extractedData)) {
      pageState.extractedData.forEach((item: any) => {
        console.log(`🔍 [TokenDetector] Analyzing ${item.source} data...`)
        if (this.isConsumptionData(item.data)) {
          console.log(`🎯 [TokenDetector] Found consumption data in ${item.source} - but skipping (DOM extraction will handle this)`)
          // NE PLUS générer de triplets depuis les patterns de scripts
          // this.sendRawDataToAgent(...) - SUPPRIMÉ
        } else {
          console.log(`🔍 [TokenDetector] ${item.source} contains no consumption data`)
        }
      })
    } else {
      // Legacy format
      if (this.isConsumptionData(pageState)) {
        console.log('🎯 [TokenDetector] Found consumption data in page state - but skipping (DOM extraction will handle this)')
        // NE PLUS générer de triplets depuis le format legacy
        // this.sendRawDataToAgent(...) - SUPPRIMÉ
      }
    }
  }


  private extractJSONScripts() {
    console.log('📄 [TokenDetector] Extracting JSON scripts (CSP-safe)...')
    
    try {
      const scriptData: any[] = []
      
      // 1. Look for embedded JSON data in script tags
      const jsonScripts = document.querySelectorAll('script[type="application/json"]')
      jsonScripts.forEach(script => {
        try {
          if (script.textContent) {
            const data = JSON.parse(script.textContent)
            if (data && typeof data === 'object') {
              console.log('📄 [TokenDetector] Found JSON script with keys:', Object.keys(data))
              scriptData.push({ source: 'json-script', data })
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      })

      // 2. Check script tags with Next.js data
      const nextDataScripts = document.querySelectorAll('script[id="__NEXT_DATA__"]')
      nextDataScripts.forEach(script => {
        try {
          if (script.textContent) {
            const data = JSON.parse(script.textContent)
            if (data && typeof data === 'object') {
              console.log('📄 [TokenDetector] Found Next.js data with keys:', Object.keys(data))
              scriptData.push({ source: 'nextjs', data })
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      })

      // 3. Look for Netflix-specific script patterns (focused on consumption data)
      const allScripts = document.querySelectorAll('script:not([src])')
      allScripts.forEach(script => {
        try {
          const content = script.textContent || ''
          
          // Look for Netflix Falcor cache containing viewing/list data
          if (content.includes('falcorCache') || content.includes('falcor-cache')) {
            // Extract falcorCache objects that contain consumption data
            const falcorMatches = content.match(/falcorCache["\s]*:[^;]+/g)
            if (falcorMatches) {
              falcorMatches.forEach(match => {
                try {
                  // Look for my list, viewing history, or ratings data
                  if (match.includes('myList') || match.includes('continueWatching') || 
                      match.includes('viewingHistory') || match.includes('thumbs')) {
                    console.log('📄 [TokenDetector] Found Netflix Falcor cache with consumption data')
                    scriptData.push({ source: 'netflix-falcor-cache', data: match.substring(0, 1000) })
                  }
                } catch (e) {
                  // Skip parsing errors
                }
              })
            }
          }
          
          // Look for Netflix state patterns containing consumption data
          if (content.includes('netflix') || content.includes('memberContext')) {
            // Look for specific consumption data patterns
            const consumptionPatterns = [
              /myList["\s]*:[^,}]+/g,
              /continueWatching["\s]*:[^,}]+/g,
              /viewingActivity["\s]*:[^,}]+/g,
              /thumbs["\s]*:[^,}]+/g,
              /ratings["\s]*:[^,}]+/g
            ]
            
            consumptionPatterns.forEach((pattern, index) => {
              const matches = content.match(pattern)
              if (matches) {
                matches.forEach(match => {
                  console.log(`📄 [TokenDetector] Found Netflix consumption pattern #${index}:`, match.substring(0, 100))
                  scriptData.push({ 
                    source: `netflix-consumption-${index}`, 
                    data: match,
                    type: ['myList', 'continueWatching', 'viewingActivity', 'thumbs', 'ratings'][index]
                  })
                })
              }
            })
          }
        } catch (error) {
          // Skip script analysis errors
        }
      })

      // 4. Look for data attributes on body and html elements
      const bodyData = document.body?.dataset
      if (bodyData && Object.keys(bodyData).length > 0) {
        console.log('📄 [TokenDetector] Found body data attributes:', Object.keys(bodyData))
        scriptData.push({ source: 'body-data', data: bodyData })
      }

      // 5. Look for Netflix ratings/thumbs data in DOM elements
      const ratingElements = document.querySelectorAll('[data-rating], [class*="thumbs"], [class*="rating"], [data-testid*="rating"]')
      if (ratingElements.length > 0) {
        const ratingsData: any[] = []
        ratingElements.forEach(element => {
          const rating = element.getAttribute('data-rating')
          const titleId = element.getAttribute('data-title-id') || element.getAttribute('data-video-id')
          const thumbsUp = element.classList.contains('thumbs-up') || element.classList.contains('thumb-up')
          const thumbsDown = element.classList.contains('thumbs-down') || element.classList.contains('thumb-down')
          
          if (rating || thumbsUp || thumbsDown || titleId) {
            ratingsData.push({
              titleId,
              rating,
              thumbsUp,
              thumbsDown,
              element: element.className
            })
          }
        })
        
        if (ratingsData.length > 0) {
          console.log('📄 [TokenDetector] Found Netflix ratings/thumbs data:', ratingsData.length, 'items')
          scriptData.push({ source: 'netflix-ratings-dom', data: ratingsData })
        }
      }

      // 6. Check meta tags for consumption-related data only
      const consumptionMetaTags = document.querySelectorAll('meta[name*="viewing"], meta[name*="list"], meta[name*="watch"], meta[name*="rating"]')
      if (consumptionMetaTags.length > 0) {
        const metaData: Record<string, string> = {}
        consumptionMetaTags.forEach(meta => {
          const name = meta.getAttribute('name')
          const content = meta.getAttribute('content')
          if (name && content) {
            metaData[name] = content
          }
        })
        if (Object.keys(metaData).length > 0) {
          console.log('📄 [TokenDetector] Found consumption-related meta tags:', Object.keys(metaData))
          scriptData.push({ source: 'consumption-meta-tags', data: metaData })
        }
      }

      if (scriptData.length > 0) {
        console.log(`📄 [TokenDetector] Found ${scriptData.length} data sources`)
        this.analyzePageState({ extractedData: scriptData })
      } else {
        console.log('📄 [TokenDetector] No extractable page state found')
      }
      
    } catch (error) {
      console.log('📄 [TokenDetector] Error extracting JSON scripts:', error)
    }
  }

  private tryAccessWindowObjects() {
    console.log('📄 [TokenDetector] Trying to access window objects...')
    
    try {
      const pageState: any = {}
      
      // These might work from content script context (not always blocked by CSP)
      if (typeof (window as any).__NEXT_DATA__ !== 'undefined') {
        pageState.nextData = (window as any).__NEXT_DATA__
        console.log('📄 [TokenDetector] Found __NEXT_DATA__')
      }
      
      // Netflix-specific objects (may be accessible)
      if (typeof (window as any).netflix !== 'undefined') {
        pageState.netflix = (window as any).netflix
        console.log('📄 [TokenDetector] Found window.netflix')
      }
      
      // Check for user info in various places
      if (typeof (window as any).userInfo !== 'undefined') {
        pageState.userInfo = (window as any).userInfo
      }
      
      if (Object.keys(pageState).length > 0) {
        this.analyzePageState(pageState)
      } else {
        console.log('📄 [TokenDetector] No accessible window objects found')
      }
      
    } catch (error) {
      console.log('📄 [TokenDetector] Cannot access window objects (blocked by CSP)')
    }
  }

  private detectUserAuthentication() {
    console.log('🔍 [TokenDetector] Detecting user authentication universally...')
    
    let confidence = 0
    const indicators: string[] = []
    const authSources: string[] = []

    // 1. Check localStorage for auth patterns
    const localStorageAuth = this.checkStorageForAuth(localStorage, 'localStorage')
    confidence += localStorageAuth.confidence
    indicators.push(...localStorageAuth.indicators)
    if (localStorageAuth.confidence > 0) authSources.push('localStorage')

    // 2. Check sessionStorage for auth patterns  
    const sessionStorageAuth = this.checkStorageForAuth(sessionStorage, 'sessionStorage')
    confidence += sessionStorageAuth.confidence
    indicators.push(...sessionStorageAuth.indicators)
    if (sessionStorageAuth.confidence > 0) authSources.push('sessionStorage')

    // 3. Skip direct cookie reading (HttpOnly cookies are not accessible anyway)
    // Let browser handle auth cookies automatically in same-origin requests

    // 4. Check DOM for user-specific elements
    const domAuth = this.checkDOMForAuth()
    confidence += domAuth.confidence
    indicators.push(...domAuth.indicators)
    if (domAuth.confidence > 0) authSources.push('DOM')

    // 5. Check URL patterns for user areas
    const urlAuth = this.checkURLForAuth()
    confidence += urlAuth.confidence
    indicators.push(...urlAuth.indicators)
    if (urlAuth.confidence > 0) authSources.push('URL')

    // Determine authentication status
    this.authStatus = {
      isAuthenticated: confidence > 0.3, // Threshold for authentication
      confidence: Math.min(confidence, 1.0),
      indicators,
      authSources
    }

    console.log(`🔐 [TokenDetector] Authentication status:`, this.authStatus)
  }

  private checkStorageForAuth(storage: Storage, storageType: string) {
    let confidence = 0
    const indicators: string[] = []

    // Common auth indicators in storage
    const authPatterns = [
      'token', 'auth', 'session', 'user', 'login', 'account', 'profile', 'jwt', 'oauth',
      'access', 'refresh', 'api_key', 'client', 'member', 'subscriber', 'premium'
    ]

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key) continue

      const value = storage.getItem(key)
      if (!value || value.length < 5) continue

      // Check if key suggests authentication
      const keyLower = key.toLowerCase()
      const authKeyMatch = authPatterns.some(pattern => keyLower.includes(pattern))
      
      if (authKeyMatch) {
        indicators.push(`${storageType}:${key}`)
        confidence += 0.2
      }

      // Check for specific high-confidence patterns
      if (keyLower.includes('current') && keyLower.includes('user')) {
        indicators.push(`${storageType}:currentUser`)
        confidence += 0.4
      }

      // Check value for auth-like content
      if (value.includes('CURRENT_MEMBER') || value.includes('authenticated') || value.includes('logged_in')) {
        indicators.push(`${storageType}:${key}=authenticated`)
        confidence += 0.3
      }
    }

    return { confidence: Math.min(confidence, 0.6), indicators }
  }

  // Removed: Direct cookie reading - let browser handle HttpOnly cookies automatically

  private checkDOMForAuth() {
    let confidence = 0
    const indicators: string[] = []

    // Look for user-specific UI elements
    const userSelectors = [
      '[data-testid*="profile"]', '[data-testid*="account"]', '[data-testid*="user"]',
      '.profile', '.account', '.user-menu', '.avatar', '.username',
      '[class*="profile"]', '[class*="account"]', '[class*="user"]'
    ]

    userSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        indicators.push(`DOM:${selector}`)
        confidence += 0.1
      }
    })

    // Look for logout/signout buttons (indicates user is logged in)
    const logoutSelectors = [
      'a[href*="logout"]', 'a[href*="signout"]', 'button[data-testid*="logout"]',
      '[class*="logout"]', '[class*="signout"]'
    ]

    logoutSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        indicators.push(`DOM:logout-button`)
        confidence += 0.2
      }
    })

    return { confidence: Math.min(confidence, 0.4), indicators }
  }

  private checkURLForAuth() {
    let confidence = 0
    const indicators: string[] = []

    const path = window.location.pathname.toLowerCase()
    const userPaths = [
      'dashboard', 'profile', 'account', 'settings', 'my-', '/me', '/user/',
      'preferences', 'billing', 'subscription', 'orders', 'history'
    ]

    userPaths.forEach(pattern => {
      if (path.includes(pattern)) {
        indicators.push(`URL:${pattern}`)
        confidence += 0.2
      }
    })

    return { confidence: Math.min(confidence, 0.3), indicators }
  }

  private async testSameOriginEndpoints() {
    console.log('🔍 [TokenDetector] Testing same-origin endpoints for personal data...')

    // Generic endpoints + platform-specific patterns
    let genericEndpoints = [
      // Standard generic endpoints
      '/user', '/profile', '/account', '/me', '/dashboard',
      '/api/me', '/api/user', '/api/profile', '/api/account',
      '/api/current-user', '/api/currentuser',
      '/api/session', '/api/auth/user',
      '/api/settings', '/api/preferences',
      '/api/watchlist', '/api/favorites', '/api/playlists'
    ]

    // Add platform-specific endpoints based on hostname
    if (this.hostname.includes('netflix')) {
      genericEndpoints.push(
        // Netflix viewing history & consumption data (PRIMARY TARGETS)
        '/viewingactivity',                    // User's complete viewing history
        '/browse/my-list',                     // User's personal watchlist
        '/browse/continue-watching',           // Continue watching list
        '/browse/recently-watched',            // Recently watched content
        '/api/shakti/mre',                     // Shakti API root
        
        // Netflix Shakti API patterns for consumption data
        '/shakti/v12345/pathEvaluator',        // Dynamic version path
        '/shakti/v*/pathEvaluator',            // Version wildcard
        '/shakti/*/pathEvaluator',             // Generic path
        '/nq/website/memberapi/*/mylist',      // My list API
        '/nq/website/memberapi/*/ratings',     // Ratings/likes API
        '/nq/website/memberapi/*/viewing-history', // Viewing history API
        
        // Content interaction endpoints
        '/api/userdata/mylist',                // My list data
        '/api/userdata/ratings',               // User ratings/thumbs
        '/api/userdata/viewing-activity',      // Viewing activity
        '/api/userdata/continue-watching',     // Continue watching
        
        // Additional consumption-focused endpoints
        '/browse/watchlist',                   // Alternative watchlist endpoint
        '/api/v1/mylist',                      // Versioned my list
        '/api/v1/viewing-history',             // Versioned viewing history
        '/api/v1/ratings'                      // Versioned ratings
      )
    } else if (this.hostname.includes('spotify')) {
      genericEndpoints.push(
        '/api/v1/me', '/api/v1/me/playlists', '/api/v1/me/tracks',
        '/api/v1/me/albums', '/api/v1/me/following',
        '/api/v1/me/top/artists', '/api/v1/me/top/tracks'
      )
    } else if (this.hostname.includes('amazon')) {
      genericEndpoints.push(
        '/gp/your-account', '/your-orders', '/your-lists',
        '/gp/profile', '/gp/registry/wishlist',
        '/api/orders', '/api/wishlist'
      )
    }

    // Test each endpoint with same-origin requests (cookies included automatically)
    for (const endpoint of genericEndpoints) {
      try {
        await this.testSameOriginEndpoint(endpoint)
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.log(`🔍 [TokenDetector] Error testing ${endpoint}:`, error)
      }
    }
  }

  private async testSameOriginEndpoint(endpoint: string) {
    try {
      console.log(`🔍 [TokenDetector] Testing same-origin endpoint: ${endpoint}`)

      // Same-origin request from content-script = cookies included automatically
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin', // Safer: only same-origin cookies
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log(`🔍 [TokenDetector] ${endpoint} → ${response.status}`)

      // Only process successful responses
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          console.log(`📊 [TokenDetector] ${endpoint} returned data structure:`, JSON.stringify(data, null, 2).substring(0, 500) + '...')
          
          // Check if this looks like consumption data
          if (this.isConsumptionData(data)) {
            console.log(`🎯 [TokenDetector] Found consumption data at ${endpoint}:`, Object.keys(data))
            await this.sendRawDataToAgent(data, endpoint)
          } else {
            console.log(`🔍 [TokenDetector] ${endpoint} returned non-consumption data - Keys:`, Object.keys(data))
            console.log(`🔍 [TokenDetector] ${endpoint} data sample:`, JSON.stringify(data).substring(0, 200))
          }
        } else {
          console.log(`📄 [TokenDetector] ${endpoint} returned non-JSON content-type:`, contentType)
          // Try to log response text for debugging
          const text = await response.text()
          console.log(`📄 [TokenDetector] ${endpoint} text response (first 200 chars):`, text.substring(0, 200))
        }
      }
    } catch (error) {
      // Silently ignore network errors (endpoint doesn't exist, etc.)
      console.log(`🔍 [TokenDetector] ${endpoint} failed:`, error.message)
    }
  }

  private isConsumptionData(data: any): boolean {
    if (!data || (typeof data !== 'object' && typeof data !== 'string')) return false

    // Handle both objects and strings (for pattern matches)
    const dataString = typeof data === 'string' ? data.toLowerCase() : JSON.stringify(data).toLowerCase()
    
    // High-confidence consumption data indicators (any 1 of these means consumption data)
    const consumptionIndicators = [
      // Netflix-specific consumption patterns (make them more flexible)
      'mylist', 'my_list', 'watchlist', 'continuewatching', 'continue_watching',
      'viewingactivity', 'viewing_activity', 'watchhistory', 'watch_history',
      'recentlywatched', 'recently_watched', 'thumbs', 'ratings', 'liked', 'disliked',
      
      // More flexible patterns that match what we see in logs
      'continuewatch', 'reprendre', 'rating', 'thumb', 'watched', 'viewing',
      'episode', 'season', 'title', 'video', 'progress', 'resume',
      
      // Netflix-specific terms that appear in their data
      'falcor', 'shakti', 'lolomo', 'billboard', 'evidence', 'maturity',
      'userrating', 'showfirstthumb', 'thumbmessage',
      
      // Content-related patterns
      'queue', 'favorites', 'bookmarks', 'playlist', 'collection'
    ]
    
    const hasConsumptionData = consumptionIndicators.some(indicator => 
      dataString.includes(indicator)
    )
    
    // Additional check for common consumption data structure patterns
    const hasConsumptionStructure = (
      dataString.includes('watch') || 
      dataString.includes('view') || 
      dataString.includes('rating') || 
      dataString.includes('thumb') ||
      dataString.includes('continue') ||
      dataString.includes('episode') ||
      dataString.includes('season')
    )
    
    return hasConsumptionData || hasConsumptionStructure
  }

  // Removed: Old passive methods - now using proactive approach

  private async sendRawDataToAgent(viewingData: any, endpoint: string) {
    try {
      console.log('🎬 [TokenDetector] Generating Netflix triplets...')
      
      const triplets: any[] = []
      
      // Generate triplets for Continue Watching (with deduplication)
      const seenTitles = new Set<string>()
      if (viewingData.continueWatching && viewingData.continueWatching.length > 0) {
        viewingData.continueWatching.forEach((item: any) => {
          if (item.title && item.title.trim().length > 0) {
            const title = item.title.trim()
            // Skip duplicates and invalid titles
            if (!seenTitles.has(title) && !title.toLowerCase().includes('voir plus') && !title.toLowerCase().includes('see more')) {
              seenTitles.add(title)
              triplets.push({
                subject: "you",
                predicate: "watch",
                object: title
              })
            }
          }
        })
      }
      
      
      if (triplets.length === 0) {
        console.log('📺 [TokenDetector] No triplets generated - no viewing data found')
        return
      }
      
      console.log(`🎯 [TokenDetector] Generated ${triplets.length} Netflix triplets:`, triplets)
      
      // Store in IndexedDB using STORE_DETECTED_TRIPLETS (same as your system)
      const response = await chrome.runtime.sendMessage({
        type: 'STORE_DETECTED_TRIPLETS',
        triplets: triplets,
        metadata: {
          platform: 'netflix',
          hostname: this.hostname,
          endpoint: endpoint,
          type: 'netflix_viewing_history'
        }
      })
      
      if (response?.success) {
        console.log(`✅ [TokenDetector] Stored ${triplets.length} Netflix triplets in IndexedDB`)
      } else {
        console.log('❌ [TokenDetector] Failed to store triplets:', response?.error)
      }
    } catch (error) {
      console.log('❌ [TokenDetector] Error generating/storing triplets:', error)
    }
  }
}

// Initialize immediately to setup interception as early as possible
console.log('🚀 [TokenDetector] Script loading, initializing immediately...')
new TokenDetector()