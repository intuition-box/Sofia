import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

class MinimalTokenDetector {
  private hostname: string = window.location.hostname
  private hasExtracted: boolean = false

  constructor() {
    if (this.shouldIgnore()) return
    
    console.log('🔐 [TokenDetector] DOM scraper starting on:', this.hostname)
    
    // Show popup only once per session on Netflix
    if (this.hostname.includes('netflix') && !this.hasExtracted) {
      setTimeout(() => this.showExtractionPopup(), 1000)
    }
  }

  private shouldIgnore(): boolean {
    const ignored = ['chrome-extension', 'localhost']
    return ignored.some(domain => this.hostname.includes(domain))
  }

  private extractNetflixDOM() {
    if (this.hasExtracted || !this.hostname.includes('netflix')) return
    
    console.log('🎬 [TokenDetector] Scraping continue watching from DOM...')
    
    const titles = this.scrapeContinueWatching()
    
    if (titles.length > 0) {
      console.log(`🎯 [TokenDetector] Found ${titles.length} titles`)
      this.sendTriplets(titles)
      this.hasExtracted = true
    }
  }

  private scrapeContinueWatching(): string[] {
    const selectors = [
      '[data-testid="continue-watching"] [aria-label]',
      '[data-list-context="continueWatching"] [title]', 
      '.continueWatching h3, .continueWatching h4'
    ]
    
    const titles = new Set<string>()
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const title = el.getAttribute('aria-label') || 
                     el.getAttribute('title') || 
                     el.textContent?.trim()
                     
        if (title && title.length > 2 && !title.includes('voir plus')) {
          titles.add(title.trim())
        }
      })
    })
    
    return Array.from(titles)
  }

  private sendTriplets(titles: string[]) {
    const triplets = titles.map(title => ({
      subject: "you",
      predicate: "watch",
      object: title
    }))
    
    chrome.runtime.sendMessage({
      type: 'STORE_DETECTED_TRIPLETS',
      triplets,
      metadata: { platform: 'netflix', type: 'dom_scraping' }
    })
    
    console.log(`✅ [TokenDetector] Sent ${triplets.length} triplets`)
  }

  private showExtractionPopup() {
    if (document.getElementById('netflix-extraction-popup')) return

    console.log('🎬 [TokenDetector] Creating Netflix data extraction popup...')

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
        Extract your Netflix viewing history to create triplets for your knowledge graph?
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

    document.body.appendChild(popup)

    const extractBtn = document.getElementById('extract-netflix-btn')
    const cancelBtn = document.getElementById('cancel-extraction-btn')
    const closeBtn = document.getElementById('close-popup')

    const closePopup = () => {
      popup.remove()
      console.log('🎬 [TokenDetector] Popup closed')
    }

    const extractData = () => {
      console.log('🎬 [TokenDetector] User clicked Extract Data')
      closePopup()
      setTimeout(() => this.extractNetflixDOM(), 500)
    }

    extractBtn?.addEventListener('click', extractData)
    cancelBtn?.addEventListener('click', closePopup)
    closeBtn?.addEventListener('click', closePopup)

    // Auto-close after 30 seconds
    setTimeout(() => {
      if (document.getElementById('netflix-extraction-popup')) {
        closePopup()
      }
    }, 30000)
  }
}

new MinimalTokenDetector()