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

    const { wallet, level, trustCircle, pioneer, explorer, signals, interests, name } = data

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const id = generateId()

    await kv.set(`profile:${id}`, {
      wallet,
      level: level || '1',
      trustCircle: trustCircle || '0',
      pioneer: pioneer || '0',
      explorer: explorer || '0',
      signals: signals || '0',
      interests: interests || '',
      name: name || '',
    }, { ex: 60 * 60 * 24 * 30 }) // expires in 30 days

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    return NextResponse.json({ url: `${baseUrl}/s/${id}` }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Failed to create share link:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
