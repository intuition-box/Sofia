import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const wallet = searchParams.get('wallet') || '0x0000...0000'
  const name = searchParams.get('name') || ''
  const alphaRank = parseInt(searchParams.get('alphaRank') || '0', 10)
  const intentions = searchParams.get('intentions') || '0'
  const pioneer = searchParams.get('pioneer') || '0'
  const pnl = searchParams.get('pnl') || '+0 T'
  const pnlPercent = searchParams.get('pnlPercent') || '+0%'

  const displayName = name || (wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet)
  const isPositive = pnlPercent.startsWith('+')
  const glowColor = isPositive ? '#22c55e' : '#ef4444'

  const logoSrc = 'https://sofia-og.vercel.app/sofia-logo.png'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050507',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow — top-left green */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '80px',
            width: '500px',
            height: '400px',
            background: `radial-gradient(ellipse, ${glowColor}18 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        {/* Ambient glow — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '100px',
            width: '500px',
            height: '350px',
            background: `radial-gradient(ellipse, ${glowColor}10 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* 3D Card wrapper — simulated perspective via skew */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '820px',
            height: '440px',
            position: 'relative',
          }}
        >
          {/* Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(145deg, #111116 0%, #0a0a0f 50%, #080810 100%)',
              borderRadius: '32px',
              border: '1px solid #1e1e2a',
              padding: '40px 48px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Left edge green glow (simulates 3D lighting) */}
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '4px',
                height: '100%',
                background: `linear-gradient(to bottom, ${glowColor}60, ${glowColor}20, transparent)`,
                borderRadius: '32px 0 0 32px',
                display: 'flex',
              }}
            />
            {/* Top edge subtle glow */}
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '60%',
                height: '3px',
                background: `linear-gradient(to right, ${glowColor}40, transparent)`,
                borderRadius: '32px 32px 0 0',
                display: 'flex',
              }}
            />

            {/* Header row: logo + rank badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              {/* Sofia branding */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={logoSrc}
                  alt="Sofia"
                  width={44}
                  height={44}
                  style={{ borderRadius: '50%' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', display: 'flex' }}>
                    Sofia
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#666680', display: 'flex', fontFamily: 'monospace' }}>
                    {displayName}
                  </span>
                </div>
              </div>

              {/* Alpha rank badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #2a2a4a, #1a1a3a)',
                  border: '1px solid #3a3a5a',
                  borderRadius: '50px',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex' }}>
                  #{alphaRank} Alpha
                </span>
              </div>
            </div>

            {/* Hero stat: P&L % */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '120px',
                  fontWeight: 700,
                  color: glowColor,
                  lineHeight: 1,
                  display: 'flex',
                  letterSpacing: '-2px',
                }}
              >
                {pnlPercent}
              </span>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 500,
                  color: '#666680',
                  display: 'flex',
                }}
              >
                P&L
              </span>
            </div>

            {/* Sub stat: P&L in Trust */}
            <span
              style={{
                fontSize: '40px',
                fontWeight: 600,
                color: isPositive ? '#22c55e90' : '#ef444490',
                display: 'flex',
                letterSpacing: '-0.5px',
              }}
            >
              {pnl}
            </span>

            {/* Spacer */}
            <div style={{ flex: 1, display: 'flex' }} />

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', color: '#555568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>
                  Intentions
                </span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', display: 'flex' }}>
                  {intentions}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>
                  Pioneer
                </span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', display: 'flex' }}>
                  {pioneer}
                </span>
              </div>
            </div>

            {/* Footer inside card */}
            <span
              style={{
                fontSize: '16px',
                color: '#333345',
                display: 'flex',
                letterSpacing: '1px',
              }}
            >
              board-sofia.intuition.box
            </span>
          </div>

          {/* Floor shadow / reflection */}
          <div
            style={{
              display: 'flex',
              width: '90%',
              height: '30px',
              margin: '0 auto',
              background: `radial-gradient(ellipse, ${glowColor}15 0%, transparent 70%)`,
              borderRadius: '50%',
              marginTop: '-5px',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
