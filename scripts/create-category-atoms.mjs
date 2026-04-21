/**
 * Create Category Atoms on Intuition (88 sub-categories)
 *
 * Categories sit between Topics and Niches in Sofia's taxonomy:
 *   Topic "Web3 & Crypto" → Category "DeFi" → Niches (yield farming, lending, ...)
 *
 * Each category description is auto-generated from its niches.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node scripts/create-category-atoms.mjs
 *
 * Options:
 *   --dry-run     Pin to IPFS only, don't send transactions
 *   --estimate    Show costs without executing
 *   --skip-pin    Skip IPFS pinning (use cached pins)
 *   --batch=N     Batch size (default: 20)
 */

import { createPublicClient, createWalletClient, http, stringToHex, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const GRAPHQL_URL = 'https://mainnet.intuition.sh/v1/graphql'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.category-cache.json'

// ── Chain definition ──

const intuitionChain = {
  id: 1155,
  name: 'Intuition Mainnet',
  network: 'intuition-mainnet',
  nativeCurrency: { name: 'Trust', symbol: 'TRUST', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer.intuition.systems' } },
}

// ── ABI ──

const PROXY_ABI = [
  {
    inputs: [],
    name: 'getAtomCost',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'depositCount', type: 'uint256' },
      { name: 'totalDeposit', type: 'uint256' },
      { name: 'multiVaultCost', type: 'uint256' },
    ],
    name: 'getTotalCreationCost',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'data', type: 'bytes' }],
    name: 'calculateAtomId',
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'assets', type: 'uint256[]' },
      { name: 'curveId', type: 'uint256' },
    ],
    name: 'createAtoms',
    outputs: [{ name: 'atomIds', type: 'bytes32[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
]

// ── Parse taxonomy.ts to extract categories with niches ──

function parseCategories() {
  const content = readFileSync('src/config/taxonomy.ts', 'utf8')
  const categories = []

  const topicRegex = /id:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",\s*\n\s*icon:/g
  let topicMatch
  const topicPositions = []

  while ((topicMatch = topicRegex.exec(content)) !== null) {
    topicPositions.push({
      id: topicMatch[1],
      label: topicMatch[2],
      pos: topicMatch.index,
    })
  }

  for (let i = 0; i < topicPositions.length; i++) {
    const topic = topicPositions[i]
    const start = topic.pos
    const end = i + 1 < topicPositions.length ? topicPositions[i + 1].pos : content.length
    const topicBlock = content.substring(start, end)

    const catRegex = /{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",/g
    let catMatch

    while ((catMatch = catRegex.exec(topicBlock)) !== null) {
      const catId = catMatch[1]
      const catLabel = catMatch[2]
      if (catId === topic.id) continue

      const afterCat = topicBlock.substring(catMatch.index, catMatch.index + 1200)
      // Only match categories (have niches: property), not niches themselves
      const nichesPos = afterCat.indexOf('niches:')
      const closingBracket = afterCat.indexOf(']')
      if (nichesPos === -1 || (closingBracket !== -1 && closingBracket < nichesPos)) continue

      // Extract niche labels
      const nichesSection = afterCat.match(/niches:\s*\[([\s\S]*?)\]\s*,?\s*}/)?.[1]
      const nicheLabels = []
      if (nichesSection) {
        const labelRegex = /label:\s*"([^"]+)"/g
        let labelMatch
        while ((labelMatch = labelRegex.exec(nichesSection)) !== null) {
          nicheLabels.push(labelMatch[1])
        }
      }

      categories.push({
        id: catId,
        label: catLabel,
        topicId: topic.id,
        topicLabel: topic.label,
        nicheLabels,
      })
    }
  }

  return categories
}

// ── Build description from category + niches ──

function buildDescription(cat) {
  const niches = cat.nicheLabels
    .map((n) => n.replace(/\s*\(.*?\)\s*/g, '').trim()) // remove parenthetical
    .slice(0, 5)

  if (niches.length === 0) return `${cat.label} — part of ${cat.topicLabel}.`
  return `${cat.label}: ${niches.join(', ')}.`
}

// ── IPFS Pinning ──

async function pinThing({ name, description }) {
  const query = `mutation PinThing($name: String!, $description: String, $image: String, $url: String) {
    pinThing(thing: { name: $name, description: $description, image: $image, url: $url }) {
      uri
    }
  }`

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { name, description: description || '', image: '', url: '' },
    }),
  })

  const json = await res.json()
  if (json.errors) throw new Error(`Pin failed for ${name}: ${JSON.stringify(json.errors)}`)
  const uri = json.data?.pinThing?.uri
  if (!uri) throw new Error(`No URI returned for ${name}`)
  return uri
}

// ── Cache management ──

function loadCache() {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  }
  return { pins: {}, atomIds: {} }
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const estimateOnly = args.includes('--estimate')
  const skipPin = args.includes('--skip-pin')
  const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '20')

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey && !dryRun && !estimateOnly) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    process.exit(1)
  }

  const cache = loadCache()
  const categories = parseCategories()

  console.log(`\n=== Sofia Category Atom Creator ===`)
  console.log(`Categories: ${categories.length}`)
  console.log(`Batch size: ${batchSize}`)
  console.log(`Dry run: ${dryRun}\n`)

  // Preview all categories with descriptions
  const byTopic = new Map()
  for (const cat of categories) {
    if (!byTopic.has(cat.topicLabel)) byTopic.set(cat.topicLabel, [])
    byTopic.get(cat.topicLabel).push(cat)
  }
  for (const [topic, cats] of byTopic) {
    console.log(`  ${topic}:`)
    for (const cat of cats) {
      console.log(`    ${cat.label}`)
      console.log(`      → "${buildDescription(cat)}"`)
    }
  }
  console.log()

  // ── Step 1: Pin categories to IPFS ──

  if (!skipPin) {
    console.log('── Step 1: Pin to IPFS ──\n')

    for (const cat of categories) {
      const key = `cat:${cat.id}`
      if (cache.pins[key]) {
        console.log(`  CACHED ${cat.label}`)
        continue
      }

      const description = buildDescription(cat)

      try {
        const uri = await pinThing({
          name: cat.label,
          description,
        })
        cache.pins[key] = uri
        console.log(`  PINNED ${cat.label}`)
        console.log(`         "${description}"`)
        console.log(`         → ${uri}`)
        saveCache(cache)
      } catch (e) {
        console.error(`  FAIL ${cat.label}: ${e.message}`)
      }
    }

    console.log(`\nPinned: ${Object.keys(cache.pins).length} total`)
  }

  if (dryRun) {
    console.log('\n── Dry run complete. Pins cached. ──')
    saveCache(cache)
    return
  }

  // ── Setup viem clients ──

  const account = privateKeyToAccount(privateKey)
  console.log(`\nWallet: ${account.address}`)

  const publicClient = createPublicClient({
    chain: intuitionChain,
    transport: http(RPC_URL),
  })

  const walletClient = createWalletClient({
    account,
    chain: intuitionChain,
    transport: http(RPC_URL),
  })

  const atomCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getAtomCost',
  })

  const balance = await publicClient.getBalance({ address: account.address })

  console.log(`Atom cost: ${formatEther(atomCost)} TRUST`)
  console.log(`Balance: ${formatEther(balance)} TRUST`)

  // ── Cost estimate ──

  const atomsMultiVault = atomCost * BigInt(categories.length)
  const atomsTotalCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalCreationCost',
    args: [0n, 0n, atomsMultiVault],
  })

  console.log(`\n── Cost Estimate ──`)
  console.log(`  Atoms: ${categories.length} × ${formatEther(atomCost)} = ${formatEther(atomsTotalCost)} TRUST`)
  console.log(`  Balance: ${formatEther(balance)} TRUST`)

  if (balance < atomsTotalCost) {
    console.error(`\n  ⚠ NOT ENOUGH TRUST! Need ${formatEther(atomsTotalCost - balance)} more`)
  } else {
    console.log(`  ✓ Enough TRUST (${formatEther(balance - atomsTotalCost)} will remain)`)
  }

  if (estimateOnly) {
    console.log('\n── Estimate only. ──')
    return
  }

  // ── Step 2: Create category atoms ──

  console.log('\n── Step 2: Create Category Atoms ──\n')

  const toCreate = categories.filter((c) => cache.pins[`cat:${c.id}`] && !cache.atomIds[c.id])
  console.log(`To create: ${toCreate.length} atoms (${categories.length - toCreate.length} already done)`)

  for (let i = 0; i < toCreate.length; i += batchSize) {
    const batch = toCreate.slice(i, i + batchSize)
    const encodedDataArray = batch.map((c) => stringToHex(cache.pins[`cat:${c.id}`]))
    const depositsArray = batch.map(() => 0n)

    const multiVaultCost = atomCost * BigInt(batch.length)
    const totalCost = await publicClient.readContract({
      address: SOFIA_FEE_PROXY,
      abi: PROXY_ABI,
      functionName: 'getTotalCreationCost',
      args: [0n, 0n, multiVaultCost],
    })

    console.log(`\n  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} atoms, cost: ${formatEther(totalCost)} TRUST`)
    batch.forEach((c) => console.log(`    - ${c.label} (${c.topicLabel})`))

    try {
      const { result } = await publicClient.simulateContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createAtoms',
        args: [account.address, encodedDataArray, depositsArray, CURVE_ID],
        value: totalCost,
        account,
      })

      const atomIds = result

      const txHash = await walletClient.writeContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createAtoms',
        args: [account.address, encodedDataArray, depositsArray, CURVE_ID],
        value: totalCost,
      })

      console.log(`  TX: ${txHash}`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      if (receipt.status !== 'success') {
        console.error(`  TX FAILED: ${receipt.status}`)
        continue
      }

      for (let j = 0; j < batch.length; j++) {
        cache.atomIds[batch[j].id] = atomIds[j]
        console.log(`  CREATED ${batch[j].label} → ${atomIds[j]}`)
      }
      saveCache(cache)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('AtomExists')) {
        console.log(`  Some atoms exist, falling back to individual creation...`)
        for (const cat of batch) {
          if (cache.atomIds[cat.id]) continue
          const encoded = stringToHex(cache.pins[`cat:${cat.id}`])

          try {
            const atomId = await publicClient.readContract({
              address: SOFIA_FEE_PROXY,
              abi: PROXY_ABI,
              functionName: 'calculateAtomId',
              args: [encoded],
            })

            const singleCost = await publicClient.readContract({
              address: SOFIA_FEE_PROXY,
              abi: PROXY_ABI,
              functionName: 'getTotalCreationCost',
              args: [0n, 0n, atomCost],
            })

            try {
              const { result } = await publicClient.simulateContract({
                address: SOFIA_FEE_PROXY,
                abi: PROXY_ABI,
                functionName: 'createAtoms',
                args: [account.address, [encoded], [0n], CURVE_ID],
                value: singleCost,
                account,
              })

              const txHash = await walletClient.writeContract({
                address: SOFIA_FEE_PROXY,
                abi: PROXY_ABI,
                functionName: 'createAtoms',
                args: [account.address, [encoded], [0n], CURVE_ID],
                value: singleCost,
              })

              await publicClient.waitForTransactionReceipt({ hash: txHash })
              cache.atomIds[cat.id] = result[0]
              console.log(`    CREATED ${cat.label} → ${result[0]}`)
            } catch (singleErr) {
              if (singleErr.message?.includes('AtomExists')) {
                cache.atomIds[cat.id] = atomId
                console.log(`    EXISTS ${cat.label} → ${atomId}`)
              } else {
                console.error(`    FAIL ${cat.label}: ${singleErr.message}`)
              }
            }
            saveCache(cache)
          } catch (calcErr) {
            console.error(`    FAIL ${cat.label}: ${calcErr.message}`)
          }
        }
      } else {
        console.error(`  BATCH FAIL: ${msg.slice(0, 200)}`)
      }
    }
  }

  // ── Summary ──

  console.log('\n=== Summary ===')
  console.log(`Category atoms created: ${Object.keys(cache.atomIds).length}`)
  console.log(`Cache saved to: ${CACHE_FILE}`)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
