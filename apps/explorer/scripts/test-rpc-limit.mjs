/**
 * Test RPC rate limits on Intuition mainnet
 * Sends bursts of getBlockNumber calls and detects 429 errors
 *
 * Usage: node scripts/test-rpc-limit.mjs
 */

const RPC_URL = 'https://rpc.intuition.systems'

async function rpcCall(id) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id }),
  })
  return { id, status: res.status, ok: res.ok }
}

async function testBurst(count, label) {
  const start = Date.now()
  const promises = Array.from({ length: count }, (_, i) => rpcCall(i))
  const results = await Promise.all(promises)
  const elapsed = Date.now() - start

  const ok = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  const statuses = [...new Set(results.map((r) => r.status))]

  console.log(`  ${label}: ${count} calls in ${elapsed}ms → ${ok} ok, ${failed} failed (statuses: ${statuses.join(', ')})`)
  return { ok, failed, elapsed }
}

async function main() {
  console.log(`\n=== RPC Rate Limit Test ===`)
  console.log(`Endpoint: ${RPC_URL}\n`)

  // Test increasing burst sizes
  const bursts = [1, 5, 10, 20, 30, 50, 75, 100]

  for (const count of bursts) {
    const { failed } = await testBurst(count, `Burst ${String(count).padStart(3)}`)

    if (failed > 0) {
      console.log(`\n  ⚠ Rate limit hit at ${count} concurrent calls`)
      console.log(`  Safe limit: ~${count - 1} concurrent calls\n`)

      // Test sequential with delay to find min delay
      console.log('── Testing minimum delay between calls ──\n')
      for (const delay of [100, 200, 500, 1000]) {
        let ok = 0
        let fail = 0
        for (let i = 0; i < 20; i++) {
          const res = await rpcCall(i)
          if (res.ok) ok++; else fail++
          await new Promise((r) => setTimeout(r, delay))
        }
        console.log(`  20 calls @ ${delay}ms delay → ${ok} ok, ${fail} failed`)
        if (fail === 0) {
          console.log(`  ✓ ${delay}ms delay is safe\n`)
          break
        }
      }
      return
    }

    // Small pause between burst tests
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\n  ✓ No rate limit hit up to 100 concurrent calls\n`)
}

main().catch(console.error)
