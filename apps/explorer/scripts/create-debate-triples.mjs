/**
 * Create Debate Triples — "X is better than Y" + "has tag" topic
 *
 * Creates comparative claims on-chain for each topic's top platforms,
 * then tags each claim with its topic category.
 *
 * Usage:
 *   PRIVATE_KEY=0x... pnpm node scripts/create-debate-triples.mjs
 *
 * Options:
 *   --dry-run     Resolve atoms only, don't send transactions
 *   --estimate    Show costs without executing
 */

import { createPublicClient, createWalletClient, http, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const GRAPHQL_URL = 'https://mainnet.intuition.sh/v1/graphql'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const IS_BETTER_THAN = '0xf44a7305513ada5e0cf0c6010ef12fff8def5cf28335ce6b8191e2eccccf393b'
const HAS_TAG_PREDICATE = '0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.debate-cache.json'

// ── Debate pairs: top 2 platforms per topic ──

const DEBATE_PAIRS = [
  // ── Tech & Dev ──
  { topic: 'tech-dev',           topicLabel: 'Tech & Dev',                a: 'GitHub',       b: 'GitLab',         category: 'tech' },
  // ── Design & Visual Arts ──
  { topic: 'design-creative',    topicLabel: 'Design & Visual Arts',      a: 'Figma',        b: 'Dribbble',       category: 'tech' },
  // ── Music & Audio ──
  { topic: 'music-audio',        topicLabel: 'Music & Audio',             a: 'Spotify',      b: 'Apple Music',    category: 'culture' },
  // ── Gaming ──
  { topic: 'gaming',             topicLabel: 'Gaming',                    a: 'Steam',        b: 'Epic Games',     category: 'culture' },
  // ── Web3 & Crypto ──
  { topic: 'web3-crypto',        topicLabel: 'Web3 & Crypto',             a: 'Uniswap',      b: 'Aave',           category: 'web3' },
  // ── Science & Knowledge ──
  { topic: 'science',            topicLabel: 'Science & Knowledge',       a: 'Google Scholar', b: 'Wikipedia',     category: 'tech' },
  // ── Sport & Health ──
  { topic: 'sport-health',       topicLabel: 'Sport & Health',            a: 'Strava',       b: 'Nike Run Club',  category: 'culture' },
  // ── Video & Cinema ──
  { topic: 'video-cinema',       topicLabel: 'Video & Cinema',            a: 'Netflix',      b: 'Disney+',        category: 'culture' },
  // ── Entrepreneurship & Business ──
  { topic: 'entrepreneurship',   topicLabel: 'Entrepreneurship & Business', a: 'LinkedIn',   b: 'Product Hunt',   category: 'tech' },
  // ── Performing Arts ──
  { topic: 'performing-arts',    topicLabel: 'Performing Arts',           a: 'Instagram',    b: 'TikTok',         category: 'culture' },
  // ── Nature & Environment ──
  { topic: 'nature-environment', topicLabel: 'Nature & Environment',      a: 'AllTrails',    b: 'iNaturalist',    category: 'energy' },
  // ── Food, Fashion & Lifestyle ──
  { topic: 'food-lifestyle',     topicLabel: 'Food, Fashion & Lifestyle', a: 'Pinterest',    b: 'Yelp',           category: 'culture' },
  // ── Literature & Writing ──
  { topic: 'literature',         topicLabel: 'Literature & Writing',      a: 'Medium',       b: 'Goodreads',      category: 'culture' },
  // ── Personal Development ──
  { topic: 'personal-dev',       topicLabel: 'Personal Development',      a: 'Coursera',     b: 'Udemy',          category: 'culture' },
]

// ── Chain definition ──

const intuitionChain = {
  id: 1155,
  name: 'Intuition Mainnet',
  network: 'intuition-mainnet',
  nativeCurrency: { name: 'Trust', symbol: 'TRUST', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer.intuition.systems' } },
}

// ── ABI (only what we need) ──

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
  const atom = json.data?.atoms?.[0]
  return atom?.id || null
}

// ── Cache management ──

function loadCache() {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  }
  return { atoms: {}, claimTriples: {}, tagTriples: {} }
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const estimateOnly = args.includes('--estimate')

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey && !dryRun && !estimateOnly) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    console.error('Usage: PRIVATE_KEY=0x... pnpm node scripts/create-debate-triples.mjs')
    process.exit(1)
  }

  const cache = loadCache()

  console.log('\n=== Sofia Debate Triple Creator ===')
  console.log(`Pairs: ${DEBATE_PAIRS.length}`)
  console.log(`Dry run: ${dryRun}\n`)

  // ── Step 1: Resolve all atom IDs ──

  console.log('── Step 1: Resolve Atom IDs ──\n')

  // Collect unique labels to resolve
  const labelsToResolve = new Set()
  for (const pair of DEBATE_PAIRS) {
    labelsToResolve.add(pair.a)
    labelsToResolve.add(pair.b)
    labelsToResolve.add(pair.topicLabel)
  }

  for (const label of labelsToResolve) {
    if (cache.atoms[label]) {
      console.log(`  CACHED ${label} → ${cache.atoms[label]}`)
      continue
    }

    const atomId = await findAtomByLabel(label)
    if (atomId) {
      cache.atoms[label] = atomId
      console.log(`  FOUND  ${label} → ${atomId}`)
      saveCache(cache)
    } else {
      console.error(`  NOT FOUND: "${label}" — atom must exist on-chain first`)
    }
  }

  // Check all atoms resolved
  const missing = []
  for (const pair of DEBATE_PAIRS) {
    if (!cache.atoms[pair.a]) missing.push(pair.a)
    if (!cache.atoms[pair.b]) missing.push(pair.b)
    if (!cache.atoms[pair.topicLabel]) missing.push(pair.topicLabel)
  }

  if (missing.length > 0) {
    console.error(`\n  Missing atoms: ${[...new Set(missing)].join(', ')}`)
    console.error('  Create these atoms first (run create-platform-atoms.mjs)')
    if (!dryRun) process.exit(1)
  }

  if (dryRun) {
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

  // Each pair = 1 claim triple + 1 tag triple = 2 triples
  const totalTripleCount = DEBATE_PAIRS.length * 2
  const multiVaultCost = tripleCost * BigInt(totalTripleCount)

  const totalCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalCreationCost',
    args: [0n, 0n, multiVaultCost],
  })

  console.log(`\n── Cost Estimate ──`)
  console.log(`  Triples: ${totalTripleCount} (${DEBATE_PAIRS.length} claims + ${DEBATE_PAIRS.length} tags)`)
  console.log(`  Total:   ${formatEther(totalCost)} TRUST`)
  console.log(`  Balance: ${formatEther(balance)} TRUST`)

  if (balance < totalCost) {
    console.error(`\n  ⚠ NOT ENOUGH TRUST! Need ${formatEther(totalCost - balance)} more`)
  } else {
    console.log(`  ✓ Enough TRUST (${formatEther(balance - totalCost)} will remain)`)
  }

  if (estimateOnly) {
    console.log('\n── Estimate only. Run without --estimate to proceed. ──')
    return
  }

  // ── Step 2: Create "is better than" triples ──

  console.log('\n── Step 2: Create "is better than" Triples ──\n')

  for (const pair of DEBATE_PAIRS) {
    const key = `${pair.a}:${pair.b}`
    if (cache.claimTriples[key]) {
      console.log(`  CACHED ${pair.a} is better than ${pair.b} → ${cache.claimTriples[key]}`)
      continue
    }

    const subjectId = cache.atoms[pair.a]
    const objectId = cache.atoms[pair.b]

    if (!subjectId || !objectId) {
      console.log(`  SKIP ${pair.a} vs ${pair.b} (missing atom)`)
      continue
    }

    const singleCost = await publicClient.readContract({
      address: SOFIA_FEE_PROXY,
      abi: PROXY_ABI,
      functionName: 'getTotalCreationCost',
      args: [0n, 0n, tripleCost],
    })

    try {
      const { result } = await publicClient.simulateContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createTriples',
        args: [account.address, [subjectId], [IS_BETTER_THAN], [objectId], [0n], CURVE_ID],
        value: singleCost,
        account,
      })

      const txHash = await walletClient.writeContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createTriples',
        args: [account.address, [subjectId], [IS_BETTER_THAN], [objectId], [0n], CURVE_ID],
        value: singleCost,
      })

      console.log(`  TX: ${txHash}`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      if (receipt.status === 'success') {
        cache.claimTriples[key] = result[0]
        console.log(`  CREATED "${pair.a} is better than ${pair.b}" → ${result[0]}`)
        saveCache(cache)
      } else {
        console.error(`  TX FAILED for ${pair.a} vs ${pair.b}`)
      }
    } catch (e) {
      if (e.message?.includes('TripleExists')) {
        console.log(`  EXISTS "${pair.a} is better than ${pair.b}" (already on-chain)`)
        // We still need the term_id — query it
        const termId = await findTripleTermId(pair.a, pair.b)
        if (termId) {
          cache.claimTriples[key] = termId
          saveCache(cache)
        }
      } else {
        console.error(`  FAIL ${pair.a} vs ${pair.b}: ${e.message?.slice(0, 200)}`)
      }
    }
  }

  // ── Step 3: Create "has tag" triples (claim → topic) ──

  console.log('\n── Step 3: Create "has tag" Triples ──\n')

  for (const pair of DEBATE_PAIRS) {
    const claimKey = `${pair.a}:${pair.b}`
    const tagKey = `tag:${claimKey}:${pair.topic}`

    if (cache.tagTriples[tagKey]) {
      console.log(`  CACHED tag ${pair.a}/${pair.b} → ${pair.topicLabel}`)
      continue
    }

    const claimTermId = cache.claimTriples[claimKey]
    const topicAtomId = cache.atoms[pair.topicLabel]

    if (!claimTermId || !topicAtomId) {
      console.log(`  SKIP tag ${pair.a}/${pair.b} → ${pair.topicLabel} (missing claim or topic atom)`)
      continue
    }

    const singleCost = await publicClient.readContract({
      address: SOFIA_FEE_PROXY,
      abi: PROXY_ABI,
      functionName: 'getTotalCreationCost',
      args: [0n, 0n, tripleCost],
    })

    try {
      const { result } = await publicClient.simulateContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createTriples',
        args: [account.address, [claimTermId], [HAS_TAG_PREDICATE], [topicAtomId], [0n], CURVE_ID],
        value: singleCost,
        account,
      })

      const txHash = await walletClient.writeContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'createTriples',
        args: [account.address, [claimTermId], [HAS_TAG_PREDICATE], [topicAtomId], [0n], CURVE_ID],
        value: singleCost,
      })

      console.log(`  TX: ${txHash}`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      if (receipt.status === 'success') {
        cache.tagTriples[tagKey] = result[0]
        console.log(`  TAGGED "${pair.a} vs ${pair.b}" → ${pair.topicLabel}`)
        saveCache(cache)
      } else {
        console.error(`  TX FAILED for tag ${pair.a}/${pair.b} → ${pair.topicLabel}`)
      }
    } catch (e) {
      if (e.message?.includes('TripleExists')) {
        console.log(`  EXISTS tag ${pair.a}/${pair.b} → ${pair.topicLabel}`)
        cache.tagTriples[tagKey] = 'existing'
        saveCache(cache)
      } else {
        console.error(`  FAIL tag ${pair.a}/${pair.b} → ${pair.topicLabel}: ${e.message?.slice(0, 200)}`)
      }
    }
  }

  // ── Step 4: Output debateConfig entries ──

  console.log('\n── Generated debateConfig.ts entries ──\n')
  console.log('// Add these to SOFIA_CLAIMS in src/config/debateConfig.ts:\n')

  for (const pair of DEBATE_PAIRS) {
    const key = `${pair.a}:${pair.b}`
    const termId = cache.claimTriples[key]
    if (termId && termId !== 'existing') {
      console.log(`  { tripleTermId: "${termId}", subject: "${pair.a}", predicate: "is better than", object: "${pair.b}", category: "${pair.category}" },`)
    }
  }

  // ── Summary ──

  console.log('\n=== Summary ===')
  console.log(`Claims created: ${Object.keys(cache.claimTriples).length}`)
  console.log(`Tags created: ${Object.keys(cache.tagTriples).length}`)
  console.log(`Cache saved to: ${CACHE_FILE}`)
}

// ── Helper: find existing triple term_id via GraphQL ──

async function findTripleTermId(subjectLabel, objectLabel) {
  const query = `query FindTriple($subject: String!, $object: String!) {
    triples(where: {
      subject: { label: { _eq: $subject } },
      predicate_id: { _eq: "${IS_BETTER_THAN}" },
      object: { label: { _eq: $object } }
    }, limit: 1) {
      term_id
    }
  }`

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { subject: subjectLabel, object: objectLabel } }),
  })

  const json = await res.json()
  return json.data?.triples?.[0]?.term_id || null
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
