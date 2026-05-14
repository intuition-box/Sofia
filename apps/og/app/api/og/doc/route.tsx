import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const DEFAULT_TITLE = 'Sofia Documentation'
const DEFAULT_SUBTITLE =
  'Sofia turns your browsing into verifiable, blockchain-backed knowledge — privately and on your terms.'
const DEFAULT_EYEBROW = 'DOCUMENTATION'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') || DEFAULT_TITLE
  const subtitle = searchParams.get('subtitle') || DEFAULT_SUBTITLE
  const eyebrow = (searchParams.get('eyebrow') || DEFAULT_EYEBROW).toUpperCase()

  // Self-reference the deployment's origin so the logo loads from whichever
  // domain serves this route (Coolify og.sofia.intuition.box in prod, localhost in dev).
  const logoSrc = `${req.nextUrl.origin}/sofia-logo.png`

  // Design-system dark tokens (theme.css):
  //   bg #0b0a12, card #13121f, border #25223a,
  //   ink #f5f3ff, muted #8f8ca8, accent peach #ffc6b0
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b0a12',
        fontFamily: 'sans-serif',
        color: '#f5f3ff',
        padding: '72px 88px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient peach glow — top right */}
      <div
        style={{
          position: 'absolute',
          top: '-180px',
          right: '-120px',
          width: '620px',
          height: '620px',
          background:
            'radial-gradient(circle, rgba(255, 198, 176, 0.18) 0%, transparent 65%)',
          display: 'flex',
        }}
      />

      {/* Ambient indigo glow — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '-200px',
          left: '-160px',
          width: '560px',
          height: '560px',
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 65%)',
          display: 'flex',
        }}
      />

      {/* Top: Sofia logo + brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          zIndex: 1,
        }}
      >
        <img
          src={logoSrc}
          alt="Sofia"
          width={56}
          height={56}
          style={{ borderRadius: '14px' }}
        />
        <span
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#f5f3ff',
            letterSpacing: '-0.01em',
            display: 'flex',
          }}
        >
          Sofia
        </span>
      </div>

      {/* Middle: eyebrow + title + subtitle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffc6b0',
            letterSpacing: '0.18em',
            display: 'flex',
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: '76px',
            fontWeight: 700,
            color: '#f5f3ff',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            display: 'flex',
            maxWidth: '960px',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: '26px',
            fontWeight: 400,
            color: '#8f8ca8',
            lineHeight: 1.4,
            display: 'flex',
            maxWidth: '880px',
          }}
        >
          {subtitle}
        </span>
      </div>

      {/* Footer: URL + accent rule */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: '20px',
            fontWeight: 500,
            color: '#f5f3ff',
            display: 'flex',
          }}
        >
          doc.sofia.intuition.box
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ffc6b0',
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: '16px',
              color: '#8f8ca8',
              letterSpacing: '0.05em',
              display: 'flex',
            }}
          >
            intuition.box
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
