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

    const { pageUrl, pageTitle, status, rank, totalCertifiers } = data

    if (!pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const id = encodeShare('cert', {
      pageUrl,
      pageTitle: pageTitle || pageUrl,
      status: status || 'Contributor',
      rank: rank || 0,
      totalCertifiers: totalCertifiers || 0,
    })

    return NextResponse.json(
      { url: `${PUBLIC_URL}/c/${id}` },
      { headers: CORS_HEADERS },
    )
  } catch (error) {
    console.error('Failed to create certification share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}
