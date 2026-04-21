/**
 * Check all platform website URLs — verifies they resolve correctly
 * Usage: pnpm node scripts/check-urls.mjs
 */

import { readFileSync } from 'fs'

function parsePlatforms() {
  const content = readFileSync('src/config/platformCatalog.ts', 'utf8')
  const platforms = []
  const idRegex = /id:\s*"([^"]+)"/g
  let match
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1]
    const pos = match.index
    const block = content.substring(pos, pos + 600)
    const nameMatch = block.match(/name:\s*"([^"]+)"/)
    const websiteMatch = block.match(/website:\s*"([^"]+)"/)
    const apiMatch = block.match(/apiBaseUrl:\s*"([^"]+)"/)
    const name = nameMatch?.[1] || id
    let website = websiteMatch?.[1]
    if (!website && apiMatch) {
      try { website = `https://${new URL(apiMatch[1]).hostname}` } catch {}
    }
    if (!website) website = `https://${id}.com`
    platforms.push({ id, name, website })
  }
  return platforms
}

async function checkUrl(url, timeout = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    clearTimeout(timer)
    return { status: res.status, finalUrl: res.url, ok: res.ok }
  } catch (e) {
    clearTimeout(timer)
    // HEAD might be blocked, try GET
    try {
      const controller2 = new AbortController()
      const timer2 = setTimeout(() => controller2.abort(), timeout)
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller2.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      clearTimeout(timer2)
      return { status: res.status, finalUrl: res.url, ok: res.ok }
    } catch (e2) {
      return { status: 0, finalUrl: url, ok: false, error: e2.message?.slice(0, 60) }
    }
  }
}

async function main() {
  const platforms = parsePlatforms()
  console.log(`Checking ${platforms.length} platform URLs...\n`)

  const results = { ok: [], redirect: [], fail: [] }

  // Check 5 at a time
  for (let i = 0; i < platforms.length; i += 5) {
    const batch = platforms.slice(i, i + 5)
    const checks = await Promise.all(
      batch.map(async (p) => {
        const result = await checkUrl(p.website)
        return { ...p, ...result }
      })
    )

    for (const c of checks) {
      const finalHost = c.finalUrl ? new URL(c.finalUrl).hostname : ''
      const origHost = new URL(c.website).hostname

      if (c.error) {
        console.log(`  FAIL  ${c.name.padEnd(25)} ${c.website.padEnd(40)} → ${c.error}`)
        results.fail.push(c)
      } else if (!c.ok) {
        console.log(`  ${c.status}  ${c.name.padEnd(25)} ${c.website.padEnd(40)}`)
        results.fail.push(c)
      } else if (finalHost !== origHost && !finalHost.endsWith(origHost) && !origHost.endsWith(finalHost)) {
        console.log(`  REDIR ${c.name.padEnd(25)} ${c.website.padEnd(40)} → ${c.finalUrl}`)
        results.redirect.push(c)
      } else {
        console.log(`  OK    ${c.name.padEnd(25)} ${c.website}`)
        results.ok.push(c)
      }
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`  OK:       ${results.ok.length}`)
  console.log(`  Redirect: ${results.redirect.length}`)
  console.log(`  Fail:     ${results.fail.length}`)

  if (results.redirect.length > 0) {
    console.log(`\n=== Redirects (check if correct) ===`)
    for (const r of results.redirect) {
      console.log(`  ${r.name.padEnd(25)} ${r.website.padEnd(40)} → ${r.finalUrl}`)
    }
  }

  if (results.fail.length > 0) {
    console.log(`\n=== Failures (need fixing) ===`)
    for (const f of results.fail) {
      console.log(`  ${f.name.padEnd(25)} ${f.website.padEnd(40)} ${f.error || `HTTP ${f.status}`}`)
    }
  }
}

main()
