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

    const { pageUrl, pageTitle, status, rank, totalCertifiers } = data

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const id = generateId()

    await kv.set(
      `cert:${id}`,
      {
        pageUrl,
        pageTitle: pageTitle || pageUrl,
        status: status || 'Contributor',
        rank: rank || 0,
        totalCertifiers: totalCertifiers || 0,
      },
      { ex: 60 * 60 * 24 * 30 } // 30 days
    )

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    return NextResponse.json(
      { url: `${baseUrl}/c/${id}` },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Failed to create certification share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
