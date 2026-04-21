import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const { wallet, name, alphaRank, totalAlpha, tx, intentions, pioneer, trustVolume, poolRank, totalPool, pnl, pnlPercent } = data

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const id = generateId()

    await kv.set(`board:${id}`, {
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
    }, { ex: 60 * 60 * 24 * 30 }) // expires in 30 days

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    return NextResponse.json({ url: `${baseUrl}/b/${id}` }, { status: 201, headers: CORS_HEADERS })
  } catch (error) {
    console.error('Failed to create board share link:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
