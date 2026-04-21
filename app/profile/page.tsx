import type { Metadata } from 'next'

interface ProfilePageProps {
  searchParams: Promise<{
    wallet?: string
    level?: string
    trustCircle?: string
    pioneer?: string
    explorer?: string
    interests?: string
    name?: string
  }>
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export async function generateMetadata({ searchParams }: ProfilePageProps): Promise<Metadata> {
  const params = await searchParams
  const wallet = params.wallet || '0x0000...0000'
  const level = params.level || '1'
  const trustCircle = params.trustCircle || '0'
  const pioneer = params.pioneer || '0'
  const explorer = params.explorer || '0'
  const interests = params.interests || ''
  const displayName = params.name || truncateWallet(wallet)

  const description = `Level ${level} | ${trustCircle} Trust Circle | ${pioneer} Pioneer | ${explorer} Explorer`

  // Forward all params to OG image route
  const ogParams = new URLSearchParams()
  if (params.wallet) ogParams.set('wallet', params.wallet)
  if (params.level) ogParams.set('level', params.level)
  if (params.trustCircle) ogParams.set('trustCircle', params.trustCircle)
  if (params.pioneer) ogParams.set('pioneer', params.pioneer)
  if (params.explorer) ogParams.set('explorer', params.explorer)
  if (params.interests) ogParams.set('interests', params.interests)
  if (params.name) ogParams.set('name', params.name)

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
  const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`

  return {
    title: `Sofia Profile - ${displayName}`,
    description,
    openGraph: {
      title: `Sofia Profile - ${displayName}`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Sofia Profile - ${displayName}`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams
  const wallet = params.wallet || '0x0000...0000'
  const level = params.level || '1'
  const trustCircle = params.trustCircle || '0'
  const pioneer = params.pioneer || '0'
  const explorer = params.explorer || '0'
  const interests = params.interests || ''
  const displayName = params.name || truncateWallet(wallet)

  const interestList = interests
    ? interests.split(',').map((item) => {
        const parts = item.split(':')
        return { name: parts[0], level: parts[1] || '1' }
      })
    : []

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
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
        <span style={{ fontSize: '32px', fontWeight: 700 }}>Sofia</span>
      </div>

      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{displayName}</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '24px', color: '#6b7280', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>Level <strong style={{ color: '#fff' }}>{level}</strong></span>
        <span><strong style={{ color: '#fff' }}>{trustCircle}</strong> people in my trust circle</span>
        <span style={{ color: '#FFD700' }}>Pioneer <strong>{pioneer}</strong></span>
        <span style={{ color: '#3B82F6' }}>Explorer <strong>{explorer}</strong></span>
      </div>

      {interestList.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
          {interestList.map((interest) => (
            <span
              key={interest.name}
              style={{
                padding: '8px 16px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '20px',
                fontSize: '14px',
              }}
            >
              {interest.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: '48px' }}>
        <a
          href="https://chromewebstore.google.com"
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #8276ED, #F6427B, #FFBF33)',
            color: '#fff',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Get Sofia Extension
        </a>
      </div>

      <p style={{ color: '#4b5563', marginTop: '32px', fontSize: '14px' }}>
        sofia.intuition.box
      </p>
    </div>
  )
}
