import type { Metadata } from 'next'
import { kv } from '@vercel/kv'
import { notFound } from 'next/navigation'

interface CertificationData {
  pageUrl: string
  pageTitle: string
  status: string
  rank: number
  totalCertifiers: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    const display = host + path
    return display.length > 50 ? display.slice(0, 47) + '...' : display
  } catch {
    return url.length > 50 ? url.slice(0, 47) + '...' : url
  }
}

async function getCertData(id: string): Promise<CertificationData | null> {
  return kv.get<CertificationData>(`cert:${id}`)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getCertData(id)
  if (!data) return { title: 'Certification not found' }

  const title = `${data.status} #${data.rank} — ${data.pageTitle}`
  const description = `Certified "${data.pageTitle}" as ${data.status} #${data.rank} among ${data.totalCertifiers} certifiers on Sofia`

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  const ogParams = new URLSearchParams()
  ogParams.set('pageUrl', data.pageUrl)
  ogParams.set('pageTitle', data.pageTitle)
  ogParams.set('status', data.status)
  ogParams.set('rank', String(data.rank))
  ogParams.set('totalCertifiers', String(data.totalCertifiers))

  const ogImageUrl = `${baseUrl}/api/og/certification?${ogParams.toString()}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function CertificationPage({ params }: PageProps) {
  const { id } = await params
  const data = await getCertData(id)
  if (!data) notFound()

  const statusColor =
    data.status === 'Pioneer'
      ? '#D4A843'
      : data.status === 'Explorer'
        ? '#6B8AFF'
        : '#a0a0b8'

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
          background:
            'linear-gradient(165deg, #0f1018 0%, #0a0a0f 50%, #08080c 100%)',
          border: '1px solid #1a1a2e',
          borderRadius: '24px',
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Sofia watermark */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.03,
            pointerEvents: 'none',
          }}
        >
          <img src="/sofia-logo.png" alt="" width={200} height={200} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <img
            src="/sofia-logo.png"
            alt="Sofia"
            width={40}
            height={40}
            style={{ borderRadius: '50%' }}
          />
          <div>
            <p
              style={{
                fontSize: '12px',
                color: '#555568',
                margin: '0 0 2px 0',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Sofia Certification
            </p>
            <p
              style={{
                fontSize: '14px',
                color: '#a0a0b8',
                margin: 0,
                fontFamily: 'monospace',
              }}
            >
              {truncateUrl(data.pageUrl)}
            </p>
          </div>
        </div>

        {/* Page title */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 24px 0',
            lineHeight: 1.3,
          }}
        >
          {data.pageTitle}
        </h1>

        {/* Status + Rank */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid #14141e',
          }}
        >
          <div
            style={{
              padding: '12px 24px',
              background: '#0e0e16',
              border: '1px solid #1a1a2e',
              borderRadius: '14px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: statusColor,
                margin: '0 0 4px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
              }}
            >
              {data.status}
            </p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1,
              }}
            >
              #{data.rank}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {data.totalCertifiers}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: '#a0a0b8',
                margin: '4px 0 0 0',
              }}
            >
              certifiers on this page
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://chromewebstore.google.com"
          style={{
            display: 'block',
            textAlign: 'center',
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
