/**
 * Create "has tag" Triples on Intuition Knowledge Graph
 *
 * Creates two types of triples:
 *   1. [Category] has tag [Topic]     (~88 triples)
 *   2. [Platform] has tag [Category]  (~300 triples, read directly from platform.targetCategories)
 *
 * All atoms (Topics, Categories, Platforms) must exist on-chain first.
 * This script resolves them by label via GraphQL.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node scripts/create-has-tag-triples.mjs
 *
 * Options:
 *   --dry-run     Resolve atoms only, show mapping, don't send transactions
 *   --estimate    Show costs without executing
 *   --batch=N     Batch size (default: 20)
 */

import { createPublicClient, createWalletClient, http, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const GRAPHQL_URL = 'https://mainnet.intuition.sh/v1/graphql'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const HAS_TAG_PREDICATE = '0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.has-tag-cache.json'

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
    name: 'getTripleCost',
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
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'subjectIds', type: 'bytes32[]' },
      { name: 'predicateIds', type: 'bytes32[]' },
      { name: 'objectIds', type: 'bytes32[]' },
      { name: 'assets', type: 'uint256[]' },
      { name: 'curveId', type: 'uint256' },
    ],
    name: 'createTriples',
    outputs: [{ name: 'tripleIds', type: 'bytes32[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
]

// ── Parse taxonomy.ts ──

function parseTaxonomy() {
  const content = readFileSync('src/config/taxonomy.ts', 'utf8')

  const topics = []
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

    topics.push({ id: topic.id, label: topic.label })

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

      categories.push({
        id: catId,
        label: catLabel,
        topicId: topic.id,
        topicLabel: topic.label,
      })

    }
  }

  return { topics, categories }
}

// ── Parse platformCatalog.ts ──

function parsePlatforms() {
  const content = readFileSync('src/config/platformCatalog.ts', 'utf8')
  const platforms = []

  // Split by platform object boundaries for reliable extraction
  const entries = content.split(/\n  {/)
  for (const entry of entries) {
    const idMatch = entry.match(/id:\s*"([^"]+)"/)
    const nameMatch = entry.match(/name:\s*"([^"]+)"/)
    if (!idMatch || !nameMatch) continue

    const catMatch = entry.match(/targetCategories:\s*\[([^\]]*)\]/)
    const categories = catMatch?.[1]
      ?.match(/"([^"]+)"/g)
      ?.map((d) => d.replace(/"/g, '')) || []

    platforms.push({ id: idMatch[1], name: nameMatch[1], categories })
  }
  return platforms
}

// ── GraphQL: resolve atom ID by label ──

async function findAtomByLabel(label) {
  const query = `query FindAtom($label: String!) {
    atoms(where: { label: { _eq: $label } }, limit: 1) {
      id
      label
    }
  }`

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { label } }),
  })

  const json = await res.json()
  return json.data?.atoms?.[0]?.id || null
}

// ── Cache management ──

function loadCache() {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  }
  return { atomIds: {}, categoryToTopicTriples: {}, platformToCategoryTriples: {} }
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const estimateOnly = args.includes('--estimate')
  const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '5')
  const limitTriples = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0')

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey && !dryRun && !estimateOnly) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    console.error('Usage: PRIVATE_KEY=0x... node scripts/create-has-tag-triples.mjs')
    process.exit(1)
  }

  const cache = loadCache()
  const { topics, categories } = parseTaxonomy()
  const platforms = parsePlatforms()

  // Build platform → categories mapping (read directly from targetCategories)
  const platformToCategories = new Map()
  for (const platform of platforms) {
    if (platform.categories.length > 0) {
      platformToCategories.set(platform.id, { name: platform.name, categories: platform.categories })
    }
  }

  const totalCatToTopicTriples = categories.length
  let totalPlatToCatTriples = 0
  for (const [, v] of platformToCategories) totalPlatToCatTriples += v.categories.length

  console.log(`\n=== Sofia "has tag" Triple Creator ===`)
  console.log(`[Category] has tag [Topic]:    ${totalCatToTopicTriples}`)
  console.log(`[Platform] has tag [Category]: ${totalPlatToCatTriples}`)
  console.log(`Total triples:                 ${totalCatToTopicTriples + totalPlatToCatTriples}`)
  console.log(`Batch size: ${batchSize}`)
  console.log(`Dry run: ${dryRun}\n`)

  // ── Step 1: Resolve atom IDs from local caches (no GraphQL) ──

  console.log('── Step 1: Resolve atom IDs from local caches ──\n')

  // Load atom IDs from the creation script caches
  const topicCache = existsSync('scripts/.topic-cache.json')
    ? JSON.parse(readFileSync('scripts/.topic-cache.json', 'utf8'))
    : { atomIds: {} }
  const categoryCache = existsSync('scripts/.category-cache.json')
    ? JSON.parse(readFileSync('scripts/.category-cache.json', 'utf8'))
    : { atomIds: {} }
  const platformCache = existsSync('scripts/.platform-cache.json')
    ? JSON.parse(readFileSync('scripts/.platform-cache.json', 'utf8'))
    : { atomIds: {} }

  // Import topic atom IDs
  for (const topic of topics) {
    const key = `topic:${topic.id}`
    const sourceKey = topic.id
    if (topicCache.atomIds[sourceKey]) {
      cache.atomIds[key] = topicCache.atomIds[sourceKey]
      console.log(`  LOADED topic "${topic.label}" → ${cache.atomIds[key]}`)
    } else if (!cache.atomIds[key]) {
      console.error(`  NOT FOUND: topic "${topic.label}" — run create-topic-atoms.mjs first`)
    }
  }

  // Import category atom IDs
  for (const cat of categories) {
    const key = `cat:${cat.id}`
    const sourceKey = cat.id
    if (categoryCache.atomIds[sourceKey]) {
      cache.atomIds[key] = categoryCache.atomIds[sourceKey]
      console.log(`  LOADED category "${cat.label}" → ${cache.atomIds[key]}`)
    } else if (!cache.atomIds[key]) {
      console.error(`  NOT FOUND: category "${cat.label}" — run create-category-atoms.mjs first`)
    }
  }

  // Import platform atom IDs
  for (const [platformId, mapping] of platformToCategories) {
    const key = `platform:${platformId}`
    const sourceKey = `platform:${platformId}`
    if (platformCache.atomIds[sourceKey]) {
      cache.atomIds[key] = platformCache.atomIds[sourceKey]
      console.log(`  LOADED platform "${mapping.name}" → ${cache.atomIds[key]}`)
    } else if (!cache.atomIds[key]) {
      console.error(`  NOT FOUND: platform "${mapping.name}" — run create-platform-atoms.mjs first`)
    }
  }

  saveCache(cache)

  // Check missing
  const missingTopics = topics.filter((t) => !cache.atomIds[`topic:${t.id}`])
  const missingCats = categories.filter((c) => !cache.atomIds[`cat:${c.id}`])
  const missingPlats = [...platformToCategories.entries()].filter(([id]) => !cache.atomIds[`platform:${id}`])

  if (missingTopics.length > 0) console.error(`\n  Missing topics: ${missingTopics.map((t) => t.label).join(', ')}`)
  if (missingCats.length > 0) console.error(`  Missing categories: ${missingCats.map((c) => c.label).join(', ')}`)
  if (missingPlats.length > 0) console.error(`  Missing platforms: ${missingPlats.map(([, v]) => v.name).join(', ')}`)

  if (dryRun) {
    console.log('\n── Dry run — Platform → Category mapping ──\n')
    for (const [platformId, mapping] of platformToCategories) {
      const catLabels = mapping.categories.map((cId) => {
        const cat = categories.find((c) => c.id === cId)
        return cat ? cat.label : cId
      })
      console.log(`  ${mapping.name} → ${catLabels.join(', ')}`)
    }
    console.log('\n── Dry run complete. Atom IDs cached. ──')
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

  const tripleCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTripleCost',
  })

  const balance = await publicClient.getBalance({ address: account.address })

  console.log(`Triple cost: ${formatEther(tripleCost)} TRUST`)
  console.log(`Balance: ${formatEther(balance)} TRUST`)

  // ── Cost estimate ──

  const totalTripleCount = totalCatToTopicTriples + totalPlatToCatTriples
  const triplesMultiVault = tripleCost * BigInt(totalTripleCount)

  const triplesTotalCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalCreationCost',
    args: [0n, 0n, triplesMultiVault],
  })

  console.log(`\n── Cost Estimate ──`)
  console.log(`  Triples: ${totalTripleCount} × ${formatEther(tripleCost)} = ${formatEther(triplesTotalCost)} TRUST`)
  console.log(`  Balance: ${formatEther(balance)} TRUST`)

  if (balance < triplesTotalCost) {
    console.error(`\n  ⚠ NOT ENOUGH TRUST! Need ${formatEther(triplesTotalCost - balance)} more`)
  } else {
    console.log(`  ✓ Enough TRUST (${formatEther(balance - triplesTotalCost)} will remain)`)
  }

  if (estimateOnly) {
    console.log('\n── Estimate only. ──')
    return
  }

  // ── Step 2: Create [Category] has tag [Topic] triples ──

  console.log('\n── Step 2: Create [Category] has tag [Topic] Triples ──\n')

  const catToTopicTriples = []
  for (const cat of categories) {
    const key = `${cat.id}:${cat.topicId}`
    if (cache.categoryToTopicTriples[key]) continue

    const catAtomId = cache.atomIds[`cat:${cat.id}`]
    const topicAtomId = cache.atomIds[`topic:${cat.topicId}`]

    if (!catAtomId) { console.log(`  SKIP ${cat.label} (no category atom)`); continue }
    if (!topicAtomId) { console.log(`  SKIP ${cat.label} → ${cat.topicLabel} (no topic atom)`); continue }

    catToTopicTriples.push({
      key,
      label: `${cat.label} has tag ${cat.topicLabel}`,
      subjectId: catAtomId,
      objectId: topicAtomId,
    })
  }

  console.log(`Triples to create: ${catToTopicTriples.length}`)
  const catTriplesToRun = limitTriples > 0 ? catToTopicTriples.slice(0, limitTriples) : catToTopicTriples
  await createTriplesBatched(catTriplesToRun, cache.categoryToTopicTriples)

  if (limitTriples > 0 && limitTriples <= catToTopicTriples.length) {
    console.log(`\n── Limit reached (${limitTriples}). Stopping. ──`)
    saveCache(cache)
    return
  }

  // ── Step 3: Create [Platform] has tag [Category] triples ──

  console.log('\n── Step 3: Create [Platform] has tag [Category] Triples ──\n')

  const platToCatTriples = []
  for (const [platformId, mapping] of platformToCategories) {
    const platformAtomId = cache.atomIds[`platform:${platformId}`]
    if (!platformAtomId) { console.log(`  SKIP platform ${mapping.name} (no atom)`); continue }

    for (const catId of mapping.categories) {
      const key = `${platformId}:${catId}`
      if (cache.platformToCategoryTriples[key]) continue

      const catAtomId = cache.atomIds[`cat:${catId}`]
      if (!catAtomId) { console.log(`  SKIP ${mapping.name} → ${catId} (no category atom)`); continue }

      const cat = categories.find((c) => c.id === catId)
      platToCatTriples.push({
        key,
        label: `${mapping.name} has tag ${cat?.label || catId}`,
        subjectId: platformAtomId,
        objectId: catAtomId,
      })
    }
  }

  console.log(`Triples to create: ${platToCatTriples.length}`)
  await createTriplesBatched(platToCatTriples, cache.platformToCategoryTriples)

  // ── Summary ──

  console.log('\n=== Summary ===')
  console.log(`[Category] has tag [Topic]:      ${Object.keys(cache.categoryToTopicTriples).length}`)
  console.log(`[Platform] has tag [Category]:   ${Object.keys(cache.platformToCategoryTriples).length}`)
  console.log(`Cache saved to: ${CACHE_FILE}`)

  // ── Batch triple creation helper ──

  async function createTriplesBatched(triples, cacheMap) {
    for (let i = 0; i < triples.length; i += batchSize) {
      // Delay between batches
      if (i > 0) await new Promise((r) => setTimeout(r, 5000))

      const batch = triples.slice(i, i + batchSize)

      const subjectIds = batch.map((t) => t.subjectId)
      const predicateIds = batch.map(() => HAS_TAG_PREDICATE)
      const objectIds = batch.map((t) => t.objectId)
      const deposits = batch.map(() => 0n)

      const multiVaultCost = tripleCost * BigInt(batch.length)
      const totalCost = await publicClient.readContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'getTotalCreationCost',
        args: [0n, 0n, multiVaultCost],
      })

      console.log(`\n  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} triples, cost: ${formatEther(totalCost)} TRUST`)

      try {
        const { result } = await publicClient.simulateContract({
          address: SOFIA_FEE_PROXY,
          abi: PROXY_ABI,
          functionName: 'createTriples',
          args: [account.address, subjectIds, predicateIds, objectIds, deposits, CURVE_ID],
          value: totalCost,
          account,
        })

        const txHash = await walletClient.writeContract({
          address: SOFIA_FEE_PROXY,
          abi: PROXY_ABI,
          functionName: 'createTriples',
          args: [account.address, subjectIds, predicateIds, objectIds, deposits, CURVE_ID],
          value: totalCost,
        })

        console.log(`  TX: ${txHash}`)
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status !== 'success') {
          console.error(`  TX FAILED`)
          continue
        }

        for (let j = 0; j < batch.length; j++) {
          cacheMap[batch[j].key] = result[j]
          console.log(`  CREATED ${batch[j].label} → ${result[j]}`)
        }
        saveCache(cache)
      } catch (e) {
        console.error(`  BATCH FAIL: ${e.message?.slice(0, 200)}`)
        // Fallback: one by one
        for (const triple of batch) {
          if (cacheMap[triple.key]) continue
          await new Promise((r) => setTimeout(r, 3000))
          try {
            const singleCost = await publicClient.readContract({
              address: SOFIA_FEE_PROXY,
              abi: PROXY_ABI,
              functionName: 'getTotalCreationCost',
              args: [0n, 0n, tripleCost],
            })

            const { result } = await publicClient.simulateContract({
              address: SOFIA_FEE_PROXY,
              abi: PROXY_ABI,
              functionName: 'createTriples',
              args: [account.address, [triple.subjectId], [HAS_TAG_PREDICATE], [triple.objectId], [0n], CURVE_ID],
              value: singleCost,
              account,
            })

            const txHash = await walletClient.writeContract({
              address: SOFIA_FEE_PROXY,
              abi: PROXY_ABI,
              functionName: 'createTriples',
              args: [account.address, [triple.subjectId], [HAS_TAG_PREDICATE], [triple.objectId], [0n], CURVE_ID],
              value: singleCost,
            })

            await publicClient.waitForTransactionReceipt({ hash: txHash })
            cacheMap[triple.key] = result[0]
            console.log(`    CREATED ${triple.label}`)
            saveCache(cache)
          } catch (singleErr) {
            if (singleErr.message?.includes('TripleExists') || singleErr.message?.includes('0x4762af7d')) {
              console.log(`    EXISTS ${triple.label}`)
              cacheMap[triple.key] = 'existing'
              saveCache(cache)
            } else {
              console.error(`    FAIL ${triple.label}: ${singleErr.message?.slice(0, 100)}`)
            }
          }
        }
      }
    }
  }
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
