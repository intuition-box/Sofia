import { OG_BASE_URL } from '@/config'
import { TOPIC_BY_ID } from '@/config/taxonomy'
import type { TopicScore } from '@/types/reputation'

// ── Types ──

export interface ShareProfileParams {
  walletAddress: string
  topicScores: TopicScore[]
  connectedCount: number
  totalCertifications: number
}

export interface OgParams {
  wallet: string
  name: string
  level: string
  signals: string
  interests: string
  trustCircle: string
  pioneer: string
  explorer: string
}

// ── Pure helpers ──

export function formatDisplayName(walletAddress: string): string {
  return walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
}

export function formatInterests(topicScores: TopicScore[]): string {
  if (!topicScores) return ''
  return topicScores
    .map((d) => {
      const label = TOPIC_BY_ID.get(d.topicId)?.label ?? d.topicId
      return `${label}:${d.score}`
    })
    .join(',')
}

export function calculateLevel(topicScores: TopicScore[]): number {
  if (!topicScores || topicScores.length === 0) return 0
  return Math.round(
    topicScores.reduce((s, d) => s + d.score, 0) / topicScores.length,
  )
}

export function buildOgParams(params: ShareProfileParams): OgParams {
  const displayName = formatDisplayName(params.walletAddress)
  const level = calculateLevel(params.topicScores)
  const interests = formatInterests(params.topicScores)

  return {
    wallet: params.walletAddress,
    name: displayName,
    level: String(level),
    signals: String(params.connectedCount),
    interests,
    trustCircle: String(params.totalCertifications),
    pioneer: '0',
    explorer: '0',
  }
}

export function buildOgImageUrl(params: ShareProfileParams): string {
  const ogParams = new URLSearchParams(Object.entries(buildOgParams(params)))
  return `${OG_BASE_URL}/api/og?${ogParams.toString()}`
}

// ── Async operations ──

export async function createShareLink(
  params: ShareProfileParams,
): Promise<string> {
  const displayName = formatDisplayName(params.walletAddress)
  const level = calculateLevel(params.topicScores)
  const interests = formatInterests(params.topicScores)

  const res = await fetch(`${OG_BASE_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: params.walletAddress,
      name: displayName,
      level,
      signals: params.connectedCount,
      interests,
      trustCircle: params.totalCertifications,
      pioneer: 0,
      explorer: 0,
    }),
  })

  if (!res.ok) throw new Error('Failed to create share link')

  const { url } = await res.json()
  return url as string
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

export function buildTwitterShareUrl(shareUrl: string): string {
  const text = encodeURIComponent(
    'Check out my behavioral reputation profile on Sofia!',
  )
  return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`
}
