import type { Metadata } from 'next'
import { kv } from '@vercel/kv'
import { notFound } from 'next/navigation'

interface ProfileData {
  wallet: string
  level: string
  trustCircle: string
  pioneer: string
  explorer: string
  signals: string
  interests: string
  name: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

async function getProfileData(id: string): Promise<ProfileData | null> {
  return kv.get<ProfileData>(`profile:${id}`)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getProfileData(id)
  if (!data) return { title: 'Profile not found' }

  const displayName = data.name || truncateWallet(data.wallet)
  const description = `Level ${data.level} | ${data.signals || '0'} Signals | ${data.trustCircle} Trust Circle | ${data.pioneer} Pioneer | ${data.explorer} Explorer`

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  // OG image still uses query params (only the crawler fetches this, not the user)
  const ogParams = new URLSearchParams()
  ogParams.set('wallet', data.wallet)
  ogParams.set('level', data.level)
  ogParams.set('trustCircle', data.trustCircle)
  ogParams.set('pioneer', data.pioneer)
  ogParams.set('explorer', data.explorer)
  ogParams.set('signals', data.signals || '0')
  if (data.interests) ogParams.set('interests', data.interests)
  if (data.name) ogParams.set('name', data.name)

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

export default async function ShortProfilePage({ params }: PageProps) {
  const { id } = await params
  const data = await getProfileData(id)
  if (!data) notFound()

  const displayName = data.name || truncateWallet(data.wallet)
  const interestList = data.interests
    ? data.interests.split(',').map((item) => {
        const parts = item.split(':')
        return { name: parts[0], level: parts[1] || '1' }
      })
    : []

  const signalsCount = parseInt(data.signals || '0', 10)

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
        {/* Sofia watermark logo */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03, pointerEvents: 'none' }}>
          <img src="/sofia-logo.png" alt="" width={200} height={200} />
        </div>

        {/* Header: Sofia branding + wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <img src="/sofia-logo.png" alt="Sofia" width={40} height={40} style={{ borderRadius: '50%' }} />
          <div>
            <p style={{ fontSize: '12px', color: '#555568', margin: '0 0 2px 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Sofia Wallet Address Stats
            </p>
            <p style={{ fontSize: '16px', color: '#a0a0b8', margin: 0, fontFamily: 'monospace' }}>
              {displayName}
            </p>
          </div>
        </div>

        {/* Level + Signals circle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #14141e',
        }}>
          <p style={{ fontSize: '40px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
            Level {data.level}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              border: '3px solid #6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{signalsCount}</span>
            </div>
            <span style={{ fontSize: '9px', color: '#555568', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Signals</span>
          </div>
        </div>

        {/* Trusted By */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: '8px',
          marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #14141e',
        }}>
          <p style={{ fontSize: '40px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
            {data.trustCircle}
          </p>
          <p style={{ fontSize: '16px', color: '#a0a0b8', margin: 0 }}>
            people trust me
          </p>
        </div>

        {/* Discovery Score */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#555568', margin: '0 0 12px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Discovery Score
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              flex: 1, padding: '14px 16px',
              background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px',
            }}>
              <p style={{ fontSize: '11px', color: '#D4A843', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Pioneer
              </p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.pioneer}</p>
            </div>
            <div style={{
              flex: 1, padding: '14px 16px',
              background: '#0e0e16', border: '1px solid #1a1a2e', borderRadius: '14px',
            }}>
              <p style={{ fontSize: '11px', color: '#6366f1', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Explorer
              </p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{data.explorer}</p>
            </div>
          </div>
        </div>

        {/* Interests */}
        {interestList.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#555568', margin: '0 0 12px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Interests
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {interestList.map((interest) => (
                <span
                  key={interest.name}
                  style={{
                    padding: '6px 14px',
                    background: '#0e0e16',
                    border: '1px solid #1a1a2e',
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: '#b0b0c8',
                  }}
                >
                  {interest.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hidden profile data for Sofia extension content script */}
        <div
          id="sofia-profile-data"
          data-wallet={data.wallet}
          data-name={data.name || ''}
          style={{ display: 'none' }}
        />

        {/* CTA button */}
        <a
          id="sofia-cta"
          href="https://chromewebstore.google.com"
          style={{
            display: 'block', textAlign: 'center',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            borderRadius: '14px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          Get Sofia Extension
        </a>
      </div>

      {/* Footer */}
      <p style={{ color: '#333340', marginTop: '24px', fontSize: '13px' }}>
        sofia.intuition.box
      </p>
    </div>
  )
}
