/**
 * Page restriction utilities
 * Detects pages where content scripts and wallet operations cannot run
 */

import { RESTRICTED_PROTOCOLS, RESTRICTED_DOMAINS, RESTRICTION_MESSAGES } from '../../background/constants'

export interface RestrictionInfo {
  restricted: boolean
  message?: string
}

/**
 * Check if a URL is restricted (wallet bridge won't work, content scripts can't run)
 */
export function isRestrictedUrl(url: string | null): RestrictionInfo {
  if (!url) {
    return { restricted: true, message: 'Aucune page chargée' }
  }

  try {
    const urlObj = new URL(url)

    // Check restricted protocols
    for (const protocol of RESTRICTED_PROTOCOLS) {
      if (urlObj.protocol === protocol) {
        return {
          restricted: true,
          message: RESTRICTION_MESSAGES[protocol] || RESTRICTION_MESSAGES.default
        }
      }
    }

    // Check restricted domains
    for (const domain of RESTRICTED_DOMAINS) {
      if (urlObj.hostname.includes(domain)) {
        // Determine message based on domain type
        const isAdDomain = ['2mdn', 'doubleclick', 'googlesyndication', 'googleadservices',
          'adsrvr', 'adnxs', 'criteo', 'taboola', 'outbrain', 'pubmatic', 'rubicon',
          'disqus', 'ad-srv', 'servenobid'].some(ad => domain.includes(ad))
        const message = isAdDomain ? RESTRICTION_MESSAGES.ad : 'Store d\'extensions'
        return { restricted: true, message }
      }
    }

    return { restricted: false }
  } catch {
    return { restricted: true, message: 'URL invalide' }
  }
}
