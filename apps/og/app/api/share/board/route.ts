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
      name,
      alphaRank,
      totalAlpha,
      tx,
      intentions,
      pioneer,
      trustVolume,
      poolRank,
      totalPool,
      pnl,
      pnlPercent,
    } = data

    if (!wallet) {
      return NextResponse.json(
        { error: 'wallet is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const id = encodeShare('board', {
      wallet,
      name: name || '',
      alphaRank: String(alphaRank || '0'),
      totalAlpha: String(totalAlpha || '0'),
      tx: String(tx || '0'),
      intentions: String(intentions || '0'),
      pioneer: String(pioneer || '0'),
      trustVolume: trustVolume || '0 T',
      poolRank: poolRank ? String(poolRank) : '',
      totalPool: totalPool ? String(totalPool) : '',
      pnl: pnl || '',
      pnlPercent: pnlPercent || '',
    })

    return NextResponse.json(
      { url: `${PUBLIC_URL}/b/${id}` },
      { status: 201, headers: CORS_HEADERS },
    )
  } catch (error) {
    console.error('Failed to create board share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
