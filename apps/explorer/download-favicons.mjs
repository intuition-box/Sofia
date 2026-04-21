import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { get } from 'https'
import { join } from 'path'

// Parse platform catalog to extract id + website/apiBaseUrl
const content = readFileSync('src/config/platformCatalog.ts', 'utf8')

const platforms = []
const regex = /id:\s*"([^"]+)"/g
let match
while ((match = regex.exec(content)) !== null) {
  const id = match[1]
  const pos = match.index
  const block = content.substring(pos, pos + 500)

  // Extract website
  const websiteMatch = block.match(/website:\s*"([^"]+)"/)
  // Extract apiBaseUrl as fallback
  const apiMatch = block.match(/apiBaseUrl:\s*"([^"]+)"/)

  let domain
  if (websiteMatch) {
    try { domain = new URL(websiteMatch[1]).hostname } catch {}
  }
  if (!domain && apiMatch) {
    try { domain = new URL(apiMatch[1]).hostname } catch {}
  }
  if (!domain) {
    domain = `${id}.com`
  }

  platforms.push({ id, domain })
}

console.log(`Found ${platforms.length} platforms`)

const outDir = join('public', 'favicons')
mkdirSync(outDir, { recursive: true })

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = []
    const req = get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.on('data', (chunk) => file.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(file)
        if (buffer.length < 100) {
          return reject(new Error(`Too small (${buffer.length}b) for ${url}`))
        }
        writeFileSync(dest, buffer)
        resolve(buffer.length)
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

// Download in batches of 10
const BATCH = 10
const results = { ok: [], fail: [] }

for (let i = 0; i < platforms.length; i += BATCH) {
  const batch = platforms.slice(i, i + BATCH)
  const promises = batch.map(async ({ id, domain }) => {
    const dest = join(outDir, `${id}.png`)
    if (existsSync(dest)) {
      console.log(`  SKIP ${id} (exists)`)
      results.ok.push(id)
      return
    }
    // Try Google Favicons (best quality)
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    try {
      const size = await download(url, dest)
      console.log(`  OK ${id} (${domain}) → ${size}b`)
      results.ok.push(id)
    } catch (e) {
      console.log(`  FAIL ${id} (${domain}): ${e.message}`)
      results.fail.push(id)
    }
  })
  await Promise.all(promises)
}

console.log(`\nDone: ${results.ok.length} OK, ${results.fail.length} FAIL`)
if (results.fail.length > 0) {
  console.log('Failed:', results.fail.join(', '))
}
