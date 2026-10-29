import { NextRequest, NextResponse } from 'next/server'
import { encodeShare, PUBLIC_URL, shareLinksEnabled } from '@/lib/shareLink'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(req: NextRequest) {
  if (!shareLinksEnabled())
    return NextResponse.json(
      { error: 'Share links are not configured' },
      { status: 503, headers: CORS_HEADERS },
    )
  try {
    const data = await req.json()

    const {
      wallet,
      level,
      trustCircle,
      pioneer,
      explorer,
      signals,
      interests,
      name,
    } = data

    if (!wallet) {
      return NextResponse.json(
        { error: 'wallet is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const id = encodeShare('profile', {
      wallet,
      level: level || '1',
      trustCircle: trustCircle || '0',
      pioneer: pioneer || '0',
      explorer: explorer || '0',
      signals: signals || '0',
      interests: interests || '',
      name: name || '',
    })

    return NextResponse.json(
      { url: `${PUBLIC_URL}/s/${id}` },
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    console.error('Failed to create share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
