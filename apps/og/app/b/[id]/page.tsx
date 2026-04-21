import type { Metadata } from 'next'
import { kv } from '@vercel/kv'
import { notFound } from 'next/navigation'

interface BoardData {
  wallet: string
  name: string
  alphaRank: string
  totalAlpha: string
  tx: string
  intentions: string
  pioneer: string
  trustVolume: string
  poolRank: string
  totalPool: string
  pnl: string
  pnlPercent: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

async function getBoardData(id: string): Promise<BoardData | null> {
  return kv.get<BoardData>(`board:${id}`)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getBoardData(id)
  if (!data) return { title: 'Board stats not found' }

  const displayName = data.name || truncateWallet(data.wallet)
  const description = `Alpha Rank #${data.alphaRank} of ${data.totalAlpha} | ${data.tx} TX | ${data.intentions} Intentions | ${data.pioneer} Pioneer | ${data.trustVolume} Trust Volume`

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  const ogParams = new URLSearchParams()
  ogParams.set('wallet', data.wallet)
  if (data.name) ogParams.set('name', data.name)
  ogParams.set('alphaRank', data.alphaRank)
  ogParams.set('totalAlpha', data.totalAlpha)
  ogParams.set('tx', data.tx)
  ogParams.set('intentions', data.intentions)
  ogParams.set('pioneer', data.pioneer)
  ogParams.set('trustVolume', data.trustVolume)
  if (data.poolRank) ogParams.set('poolRank', data.poolRank)
  if (data.totalPool) ogParams.set('totalPool', data.totalPool)
  if (data.pnl) ogParams.set('pnl', data.pnl)
  if (data.pnlPercent) ogParams.set('pnlPercent', data.pnlPercent)

  const ogImageUrl = `${baseUrl}/api/og/board?${ogParams.toString()}`

  return {
    title: `Sofia Board - ${displayName}`,
    description,
    openGraph: {
      title: `Sofia Board - ${displayName}`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Sofia Board - ${displayName}`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ShortBoardPage({ params }: PageProps) {
  const { id } = await params
  const data = await getBoardData(id)
  if (!data) notFound()

  const displayName = data.name || truncateWallet(data.wallet)
  const hasPool = data.poolRank && data.pnl && data.pnlPercent

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050507',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '40px 20px',
      }}
    >
      {/* Main card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'linear-gradient(165deg, #0f1018 0%, #0a0a0f 50%, #08080c 100%)',
          border: '1px solid #1a1a2e',
          borderRadius: '24px',
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Sofia watermark */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03, pointerEvents: 'none' }}>
          <img src="/sofia-logo.png" alt="" width={200} height={200} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <img src="/sofia-logo.png" alt="Sofia" width={40} height={40} style={{ borderRadius: '50%' }} />
          <div>
            <p style={{ fontSize: '12px', color: '#555568', margin: '0 0 2px 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Sofia Board Stats
            </p>
            <p style={{ fontSize: '16px', color: '#a0a0b8', margin: 0, fontFamily: 'monospace' }}>
              {displayName}
            </p>
          </div>
        </div>

        {/* Alpha Rank */}
        <div style={{
          marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #14141e',
        }}>
          <p style={{ fontSize: '11px', color: '#C7866C', margin: '0 0 4px 0', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}>
            Alpha Rank
          </p>
          <p style={{ fontSize: '40px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
            #{data.alphaRank} <span style={{ fontSize: '16px', color: '#555568', fontWeight: 400 }}>of {data.totalAlpha}</span>
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
            <p style={{ fontSize: '11px', color: '#555568', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>TX</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.tx}</p>
          </div>
          <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
            <p style={{ fontSize: '11px', color: '#555568', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Intentions</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.intentions}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
            <p style={{ fontSize: '11px', color: '#D4A843', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Pioneer</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.pioneer}</p>
          </div>
          <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
            <p style={{ fontSize: '11px', color: '#C7866C', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Trust Volume</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.trustVolume}</p>
          </div>
        </div>

        {/* Pool stats */}
        {hasPool && (
          <div style={{ borderTop: '1px solid #14141e', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#555568', margin: '0 0 12px 0', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}>
              Season Pool
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
                <p style={{ fontSize: '11px', color: '#555568', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Rank</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>#{data.poolRank}</p>
              </div>
              <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
                <p style={{ fontSize: '11px', color: data.pnl.startsWith('+') ? '#22c55e' : '#ef4444', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>P&L</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.pnl}</p>
              </div>
              <div style={{ flex: 1, padding: '14px 16px', background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px' }}>
                <p style={{ fontSize: '11px', color: data.pnlPercent.startsWith('+') ? '#22c55e' : '#ef4444', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>P&L %</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.pnlPercent}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA button */}
        <a
          href="https://board-sofia.intuition.box"
          style={{
            display: 'block', textAlign: 'center',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #C7866C, #a0694f)',
            color: '#fff',
            borderRadius: '14px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          View Sofia Board
        </a>
      </div>

      {/* Footer */}
      <p style={{ color: '#333340', marginTop: '24px', fontSize: '13px' }}>
        board-sofia.intuition.box
      </p>
    </div>
  )
}
