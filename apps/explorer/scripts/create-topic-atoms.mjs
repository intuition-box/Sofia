/**
 * Create Topic Atoms on Intuition (14 top-level topics)
 *
 * Topics are the highest level of Sofia's taxonomy:
 *   Tech & Dev, Web3 & Crypto, Gaming, Design, etc.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node scripts/create-topic-atoms.mjs
 *
 * Options:
 *   --dry-run     Pin to IPFS only, don't send transactions
 *   --estimate    Show costs without executing
 *   --skip-pin    Skip IPFS pinning (use cached pins)
 */

import { createPublicClient, createWalletClient, http, stringToHex, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const GRAPHQL_URL = 'https://mainnet.intuition.sh/v1/graphql'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.topic-cache.json'

// ── 14 Topics with curated descriptions ──

const TOPICS = [
  {
    id: 'tech-dev',
    label: 'Tech & Dev',
    description: 'Everything related to software, code, and technology.',
  },
  {
    id: 'design-creative',
    label: 'Design & Visual Arts',
    description: 'Visual creation, design, and digital arts.',
  },
  {
    id: 'music-audio',
    label: 'Music & Audio',
    description: 'Music, sound, and audio culture.',
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Video games, esports, and gaming culture.',
  },
  {
    id: 'web3-crypto',
    label: 'Web3 & Crypto',
    description: 'Blockchain, crypto, and the decentralized web.',
  },
  {
    id: 'science',
    label: 'Science & Knowledge',
    description: 'Science, research, and academic knowledge.',
  },
  {
    id: 'sport-health',
    label: 'Sport & Health',
    description: 'Sports, fitness, and well-being.',
  },
  {
    id: 'video-cinema',
    label: 'Video & Cinema',
    description: 'Film, video, streaming, and visual storytelling.',
  },
  {
    id: 'entrepreneurship',
    label: 'Entrepreneurship & Business',
    description: 'Business, startups, and professional growth.',
  },
  {
    id: 'performing-arts',
    label: 'Performing Arts',
    description: 'Live performance, theater, and stage arts.',
  },
  {
    id: 'nature-environment',
    label: 'Nature & Environment',
    description: 'Nature, ecology, and the outdoors.',
  },
  {
    id: 'food-lifestyle',
    label: 'Food, Fashion & Lifestyle',
    description: 'Food, fashion, and everyday lifestyle.',
  },
  {
    id: 'literature',
    label: 'Literature & Writing',
    description: 'Reading, writing, and literature.',
  },
  {
    id: 'personal-dev',
    label: 'Personal Development',
    description: 'Self-improvement, mindset, and personal growth.',
  },
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

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey && !dryRun && !estimateOnly) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    process.exit(1)
  }

  const cache = loadCache()

  console.log(`\n=== Sofia Topic Atom Creator ===`)
  console.log(`Topics: ${TOPICS.length}`)
  console.log(`Dry run: ${dryRun}\n`)

  // Show all topics
  for (const t of TOPICS) {
    console.log(`  ${t.label}`)
    console.log(`    → ${t.description}`)
  }
  console.log()

  // ── Step 1: Pin topics to IPFS ──

  if (!skipPin) {
    console.log('── Step 1: Pin to IPFS ──\n')

    for (const topic of TOPICS) {
      const key = `topic:${topic.id}`
      if (cache.pins[key]) {
        console.log(`  CACHED ${topic.label}`)
        continue
      }
      try {
        const uri = await pinThing({
          name: topic.label,
          description: topic.description,
        })
        cache.pins[key] = uri
        console.log(`  PINNED ${topic.label} → ${uri}`)
        saveCache(cache)
      } catch (e) {
        console.error(`  FAIL ${topic.label}: ${e.message}`)
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

  const atomsMultiVault = atomCost * BigInt(TOPICS.length)
  const atomsTotalCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalCreationCost',
    args: [0n, 0n, atomsMultiVault],
  })

  console.log(`\n── Cost Estimate ──`)
  console.log(`  Atoms: ${TOPICS.length} × ${formatEther(atomCost)} = ${formatEther(atomsTotalCost)} TRUST`)
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

  // ── Step 2: Create topic atoms ──

  console.log('\n── Step 2: Create Topic Atoms ──\n')

  const toCreate = TOPICS.filter((t) => cache.pins[`topic:${t.id}`] && !cache.atomIds[t.id])
  console.log(`To create: ${toCreate.length} atoms (${TOPICS.length - toCreate.length} already done)`)

  // All 14 topics in one batch
  if (toCreate.length > 0) {
    const batch = toCreate
    const encodedDataArray = batch.map((t) => stringToHex(cache.pins[`topic:${t.id}`]))
    const depositsArray = batch.map(() => 0n)

    const multiVaultCost = atomCost * BigInt(batch.length)
    const totalCost = await publicClient.readContract({
      address: SOFIA_FEE_PROXY,
      abi: PROXY_ABI,
      functionName: 'getTotalCreationCost',
      args: [0n, 0n, multiVaultCost],
    })

    console.log(`\n  Batch: ${batch.length} atoms, cost: ${formatEther(totalCost)} TRUST`)
    batch.forEach((t) => console.log(`    - ${t.label}`))

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
      } else {
        for (let j = 0; j < batch.length; j++) {
          cache.atomIds[batch[j].id] = atomIds[j]
          console.log(`  CREATED ${batch[j].label} → ${atomIds[j]}`)
        }
        saveCache(cache)
      }
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('AtomExists')) {
        console.log(`  Some atoms exist, falling back to individual creation...`)
        for (const topic of batch) {
          if (cache.atomIds[topic.id]) continue
          const encoded = stringToHex(cache.pins[`topic:${topic.id}`])

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
              cache.atomIds[topic.id] = result[0]
              console.log(`    CREATED ${topic.label} → ${result[0]}`)
            } catch (singleErr) {
              if (singleErr.message?.includes('AtomExists')) {
                cache.atomIds[topic.id] = atomId
                console.log(`    EXISTS ${topic.label} → ${atomId}`)
              } else {
                console.error(`    FAIL ${topic.label}: ${singleErr.message}`)
              }
            }
            saveCache(cache)
          } catch (calcErr) {
            console.error(`    FAIL ${topic.label}: ${calcErr.message}`)
          }
        }
      } else {
        console.error(`  BATCH FAIL: ${msg}`)
      }
    }
  }

  // ── Summary ──

  console.log('\n=== Summary ===')
  console.log(`Topic atoms created: ${Object.keys(cache.atomIds).length}`)
  console.log(`Cache saved to: ${CACHE_FILE}`)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
