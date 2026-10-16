import { formatEther } from 'viem'

/** Format a bigint wei value into a human-readable TRUST token string */
export function formatTrust(wei: bigint): string {
  const num = parseFloat(formatEther(wei))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k T'
  if (num >= 1) return num.toFixed(2) + ' T'
  return num.toFixed(4) + ' T'
}

/** Signed TRUST change (position value − deposited), e.g. "+0.0123 T" /
 *  "−1.20 T". Takes a raw signed bigint string or bigint. */
export function formatTrustChange(raw: string | bigint): string {
  const wei = typeof raw === 'bigint' ? raw : BigInt(raw || '0')
  if (wei === 0n) return '0 T'
  const sign = wei > 0n ? '+' : '−'
  return sign + formatTrust(wei > 0n ? wei : -wei)
}

/** Extract hostname from a URL, stripping www. prefix */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
  }
}

/** Decode %20 and normalize tag labels */
export function cleanLabel(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw.replace(/%20/g, ' ')
  }
}

/** Relative time string from an ISO timestamp */
export function timeAgo(timestamp: string): string {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
