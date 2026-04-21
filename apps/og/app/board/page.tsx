import type { Metadata } from 'next'

interface BoardPageProps {
  searchParams: Promise<{
    wallet?: string
    name?: string
    alphaRank?: string
    totalAlpha?: string
    tx?: string
    intentions?: string
    pioneer?: string
    trustVolume?: string
    poolRank?: string
    totalPool?: string
    pnl?: string
    pnlPercent?: string
  }>
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export async function generateMetadata({ searchParams }: BoardPageProps): Promise<Metadata> {
  const params = await searchParams
  const wallet = params.wallet || '0x0000...0000'
  const displayName = params.name || truncateWallet(wallet)
  const alphaRank = params.alphaRank || '0'
  const totalAlpha = params.totalAlpha || '0'
  const tx = params.tx || '0'
  const intentions = params.intentions || '0'
  const pioneer = params.pioneer || '0'
  const trustVolume = params.trustVolume || '0 T'

  const description = `Alpha Rank #${alphaRank} of ${totalAlpha} | ${tx} TX | ${intentions} Intentions | ${pioneer} Pioneer | ${trustVolume} Trust Volume`

  const ogParams = new URLSearchParams()
  if (params.wallet) ogParams.set('wallet', params.wallet)
  if (params.name) ogParams.set('name', params.name)
  if (params.alphaRank) ogParams.set('alphaRank', params.alphaRank)
  if (params.totalAlpha) ogParams.set('totalAlpha', params.totalAlpha)
  if (params.tx) ogParams.set('tx', params.tx)
  if (params.intentions) ogParams.set('intentions', params.intentions)
  if (params.pioneer) ogParams.set('pioneer', params.pioneer)
  if (params.trustVolume) ogParams.set('trustVolume', params.trustVolume)
  if (params.poolRank) ogParams.set('poolRank', params.poolRank)
  if (params.totalPool) ogParams.set('totalPool', params.totalPool)
  if (params.pnl) ogParams.set('pnl', params.pnl)
  if (params.pnlPercent) ogParams.set('pnlPercent', params.pnlPercent)

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
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

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams
  const wallet = params.wallet || '0x0000...0000'
  const displayName = params.name || truncateWallet(wallet)
  const hasPool = params.poolRank && params.pnl && params.pnlPercent

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
        fontFamily: 'system-ui, sans-serif',
        padding: '40px 20px',
      }}
    >
      {/* Sofia branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <img src="/sofia-logo.png" alt="Sofia" width={56} height={56} style={{ borderRadius: '50%' }} />
        <span style={{ fontSize: '32px', fontWeight: 700 }}>Sofia Board</span>
      </div>

      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{displayName}</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '24px', color: '#6b7280', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>Alpha Rank <strong style={{ color: '#C7866C' }}>#{params.alphaRank || '0'}</strong> of {params.totalAlpha || '0'}</span>
        <span><strong style={{ color: '#fff' }}>{params.tx || '0'}</strong> TX</span>
        <span><strong style={{ color: '#fff' }}>{params.intentions || '0'}</strong> Intentions</span>
        <span style={{ color: '#D4A843' }}>Pioneer <strong>{params.pioneer || '0'}</strong></span>
        <span>Trust Volume <strong style={{ color: '#fff' }}>{params.trustVolume || '0 T'}</strong></span>
      </div>

      {hasPool && (
        <div style={{ display: 'flex', gap: '24px', color: '#6b7280', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Pool Rank <strong style={{ color: '#fff' }}>#{params.poolRank}</strong></span>
          <span>P&L <strong style={{ color: params.pnl!.startsWith('+') ? '#22c55e' : '#ef4444' }}>{params.pnl}</strong></span>
          <span>P&L % <strong style={{ color: params.pnlPercent!.startsWith('+') ? '#22c55e' : '#ef4444' }}>{params.pnlPercent}</strong></span>
        </div>
      )}

      <div style={{ marginTop: '48px' }}>
        <a
          href="https://board-sofia.intuition.box"
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #C7866C, #a0694f)',
            color: '#fff',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          View Sofia Board
        </a>
      </div>

      <p style={{ color: '#4b5563', marginTop: '32px', fontSize: '14px' }}>
        board-sofia.intuition.box
      </p>
    </div>
  )
}
