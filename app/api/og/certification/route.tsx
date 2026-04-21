import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pageTitle = searchParams.get('pageTitle') || 'Unknown Page'
  const pageUrl = searchParams.get('pageUrl') || ''
  const status = searchParams.get('status') || 'Contributor'
  const rank = parseInt(searchParams.get('rank') || '0', 10)
  const totalCertifiers = parseInt(
    searchParams.get('totalCertifiers') || '0',
    10
  )

  const logoSrc = 'https://sofia-og.vercel.app/sofia-logo.png'

  // Status-dependent colors
  const statusColor =
    status === 'Pioneer'
      ? '#D4A843'
      : status === 'Explorer'
        ? '#6B8AFF'
        : '#a0a0b8'

  const statusBg =
    status === 'Pioneer'
      ? 'rgba(212, 168, 67, 0.12)'
      : status === 'Explorer'
        ? 'rgba(107, 138, 255, 0.10)'
        : 'rgba(255, 255, 255, 0.04)'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#050507',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          padding: '44px 56px',
          position: 'relative',
        }}
      >
        {/* Header: Sofia branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          <img
            src={logoSrc}
            alt="Sofia"
            width={44}
            height={44}
            style={{ borderRadius: '50%' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '12px',
                color: '#555568',
                letterSpacing: '0.5px',
                display: 'flex',
              }}
            >
              SOFIA CERTIFICATION
            </span>
            <span
              style={{
                fontSize: '16px',
                color: '#a0a0b8',
                display: 'flex',
              }}
            >
              {truncateUrl(pageUrl)}
            </span>
          </div>
        </div>

        {/* Page title */}
        <div
          style={{
            display: 'flex',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              lineHeight: 1.2,
            }}
          >
            {pageTitle.length > 60
              ? pageTitle.slice(0, 57) + '...'
              : pageTitle}
          </span>
        </div>

        {/* Status + Rank */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px',
            paddingBottom: '32px',
            borderBottom: '1px solid #14141e',
          }}
        >
          {/* Status badge */}
          <div
            style={{
              padding: '12px 28px',
              background: statusBg,
              border: `1px solid ${statusColor}33`,
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: statusColor,
                letterSpacing: '1px',
                fontWeight: 600,
                marginBottom: '4px',
                display: 'flex',
                textTransform: 'uppercase',
              }}
            >
              {status}
            </span>
            <span
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                lineHeight: 1,
              }}
            >
              #{rank}
            </span>
          </div>

          {/* Certifiers count */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                lineHeight: 1,
              }}
            >
              {totalCertifiers}
            </span>
            <span
              style={{
                fontSize: '16px',
                color: '#a0a0b8',
                display: 'flex',
              }}
            >
              certifiers on this page
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'center',
            color: '#333340',
            fontSize: '13px',
          }}
        >
          sofia.intuition.box
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
