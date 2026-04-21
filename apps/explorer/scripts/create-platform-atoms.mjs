/**
 * Create Platform Atoms on Intuition (atoms only, no triples)
 *
 * For each of the 142 platforms:
 *   1. Pins the favicon PNG to IPFS (via Pinata)
 *   2. Pins metadata to IPFS (via Intuition pinThing) with name, description, image, url
 *   3. Creates the atom on-chain
 *
 * Requires:
 *   PRIVATE_KEY=0x...     Wallet private key (not needed for --dry-run)
 *   PINATA_JWT=...        Pinata API JWT for image pinning (https://app.pinata.cloud/developers/api-keys)
 *
 * Usage:
 *   PRIVATE_KEY=0x... PINATA_JWT=... node scripts/create-platform-atoms.mjs
 *
 * Options:
 *   --dry-run     Pin images + metadata to IPFS only, don't send transactions
 *   --estimate    Show costs without executing
 *   --skip-pin    Skip all IPFS pinning (use cached pins)
 *   --repin       Force re-pin metadata (clears cached pins, keeps image pins)
 *   --batch=N     Batch size for createAtoms (default: 20)
 */

import { createPublicClient, createWalletClient, http, stringToHex, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { basename } from 'path'
import { PLATFORM_DESCRIPTIONS } from './atom-descriptions.mjs'

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const GRAPHQL_URL = 'https://mainnet.intuition.sh/v1/graphql'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.platform-cache.json'
const FAVICONS_DIR = 'public/favicons'
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs'

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

// ── Parse platform catalog ──

function parsePlatforms() {
  const content = readFileSync('src/config/platformCatalog.ts', 'utf8')
  const platforms = []
  const idRegex = /id:\s*"([^"]+)"/g
  let match

  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1]
    const pos = match.index
    const block = content.substring(pos, pos + 1000)

    const nameMatch = block.match(/name:\s*"([^"]+)"/)
    const websiteMatch = block.match(/website:\s*"([^"]+)"/)
    const apiMatch = block.match(/apiBaseUrl:\s*"([^"]+)"/)
    const dataPointsMatch = block.match(/dataPoints:\s*\[([\s\S]*?)\]/)

    const name = nameMatch?.[1]
    if (!name) continue

    let website = websiteMatch?.[1]
    if (!website && apiMatch) {
      try { website = `https://${new URL(apiMatch[1]).hostname}` } catch {}
    }
    if (!website) website = `https://${id}.com`

    // Extract dataPoints as clean list
    const dataPoints = dataPointsMatch?.[1]
      ?.match(/"([^"]+)"/g)
      ?.map((d) => d.replace(/"/g, '').replace(/-/g, ' ')) || []

    // Check if local favicon exists
    const faviconPath = `${FAVICONS_DIR}/${id}.png`
    const hasFavicon = existsSync(faviconPath)

    platforms.push({ id, name, website, dataPoints, hasFavicon, faviconPath })
  }
  return platforms
}

// ── Build description from platform data ──

function buildDescription(platform) {
  const { id, name } = platform

  // Use real hand-written descriptions from atom-descriptions.mjs
  if (PLATFORM_DESCRIPTIONS[id]) {
    return PLATFORM_DESCRIPTIONS[id]
  }

  // Fallback: just the name (no more "Signals: ..." junk)
  console.warn(`  ⚠ No description for "${id}" — using name only`)
  return name
}

// ── Pin image to IPFS via Pinata ──

async function pinImageToIPFS(filePath, fileName, pinataJwt) {
  const fileBuffer = readFileSync(filePath)
  const blob = new Blob([fileBuffer], { type: 'image/png' })

  const formData = new FormData()
  formData.append('file', blob, fileName)
  formData.append('pinataMetadata', JSON.stringify({ name: fileName }))

  const res = await fetch(PINATA_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata upload failed (${res.status}): ${text}`)
  }

  const json = await res.json()
  return `${IPFS_GATEWAY}/${json.IpfsHash}`
}

// ── Pin metadata to IPFS via Intuition ──

async function pinThing({ name, description, image, url }) {
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
      variables: { name, description: description || '', image: image || '', url: url || '' },
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
  return { imagePins: {}, pins: {}, atomIds: {} }
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
  const repin = args.includes('--repin')
  const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '5')
  const limit = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0')
  const onlyIds = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',') || []

  const privateKey = process.env.PRIVATE_KEY
  const pinataJwt = process.env.PINATA_JWT

  if (!privateKey && !dryRun && !estimateOnly) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    process.exit(1)
  }

  if (!pinataJwt && !skipPin) {
    console.error('ERROR: Set PINATA_JWT environment variable for image pinning')
    console.error('Get a free key at https://app.pinata.cloud/developers/api-keys')
    console.error('Or use --skip-pin to skip image pinning (uses cached pins)')
    process.exit(1)
  }

  const cache = loadCache()
  let platforms = parsePlatforms()
  if (onlyIds.length > 0) platforms = platforms.filter((p) => onlyIds.includes(p.id))
  else if (limit > 0) platforms = platforms.slice(0, limit)

  // Convert old ipfs:// image pins to gateway URLs
  for (const [id, uri] of Object.entries(cache.imagePins)) {
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '')
      cache.imagePins[id] = `${IPFS_GATEWAY}/${hash}`
    }
  }

  // --repin: clear metadata pins + atom IDs (keep image pins)
  if (repin) {
    if (onlyIds.length > 0) {
      console.log(`── Repin mode: clearing pins + atom IDs for ${onlyIds.join(', ')} ──\n`)
      for (const id of onlyIds) {
        delete cache.pins[`platform:${id}`]
        delete cache.atomIds[`platform:${id}`]
      }
    } else {
      console.log('── Repin mode: clearing ALL cached metadata pins + atom IDs ──\n')
      cache.pins = {}
      cache.atomIds = {}
    }
    saveCache(cache)
  }

  console.log(`\n=== Sofia Platform Atom Creator ===`)
  console.log(`Platforms: ${platforms.length}`)
  console.log(`With favicon: ${platforms.filter((p) => p.hasFavicon).length}`)
  console.log(`Batch size: ${batchSize}`)
  console.log(`Dry run: ${dryRun}`)
  console.log(`Repin: ${repin}\n`)

  // ── Step 1: Pin favicons to IPFS via Pinata ──

  if (!skipPin) {
    console.log('── Step 1: Pin favicons to IPFS (Pinata) ──\n')

    for (const p of platforms) {
      if (cache.imagePins[p.id]) {
        console.log(`  CACHED ${p.name} → ${cache.imagePins[p.id]}`)
        continue
      }

      if (!p.hasFavicon) {
        console.log(`  SKIP ${p.name} (no favicon at ${p.faviconPath})`)
        continue
      }

      try {
        const ipfsUri = await pinImageToIPFS(p.faviconPath, `${p.id}.png`, pinataJwt)
        cache.imagePins[p.id] = ipfsUri
        console.log(`  PINNED ${p.name} → ${ipfsUri}`)
        saveCache(cache)
      } catch (e) {
        console.error(`  FAIL ${p.name}: ${e.message}`)
      }
    }

    console.log(`\nFavicons pinned: ${Object.keys(cache.imagePins).length}`)

    // ── Step 2: Pin platform metadata to IPFS (Intuition) ──

    console.log('\n── Step 2: Pin platform metadata to IPFS ──\n')

    for (const p of platforms) {
      const key = `platform:${p.id}`
      if (cache.pins[key]) {
        console.log(`  CACHED ${p.name}`)
        continue
      }

      const description = buildDescription(p)
      const imageUri = cache.imagePins[p.id] || ''

      try {
        const uri = await pinThing({
          name: p.name,
          description,
          image: imageUri,
          url: p.website,
        })
        cache.pins[key] = uri
        console.log(`  PINNED ${p.name}`)
        console.log(`         desc: "${description}"`)
        console.log(`         img:  ${imageUri || '(none)'}`)
        console.log(`         uri:  ${uri}`)
        saveCache(cache)
      } catch (e) {
        console.error(`  FAIL ${p.name}: ${e.message}`)
      }
    }

    console.log(`\nMetadata pinned: ${Object.keys(cache.pins).length}`)
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

  const totalAtoms = platforms.length
  const atomsMultiVault = atomCost * BigInt(totalAtoms)

  const atomsTotalCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalCreationCost',
    args: [0n, 0n, atomsMultiVault],
  })

  console.log(`\n── Cost Estimate ──`)
  console.log(`  Atoms: ${totalAtoms} × ${formatEther(atomCost)} = ${formatEther(atomsTotalCost)} TRUST`)
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

  // ── Step 3: Create platform atoms on-chain ──

  console.log('\n── Step 3: Create Platform Atoms ──\n')

  const allItems = platforms.map((p) => ({ key: `platform:${p.id}`, name: p.name }))
  const toCreate = allItems.filter((item) => cache.pins[item.key] && !cache.atomIds[item.key])

  console.log(`To create: ${toCreate.length} atoms (${allItems.length - toCreate.length} already done)`)

  for (let i = 0; i < toCreate.length; i += batchSize) {
    // Delay between batches to avoid RPC rate limits
    if (i > 0) await new Promise((r) => setTimeout(r, 5000))

    const batch = toCreate.slice(i, i + batchSize)
    const encodedDataArray = batch.map((item) => stringToHex(cache.pins[item.key]))
    const depositsArray = batch.map(() => 0n)

    const multiVaultCost = atomCost * BigInt(batch.length)
    const totalCost = await publicClient.readContract({
      address: SOFIA_FEE_PROXY,
      abi: PROXY_ABI,
      functionName: 'getTotalCreationCost',
      args: [0n, 0n, multiVaultCost],
    })

    console.log(`\n  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} atoms, cost: ${formatEther(totalCost)} TRUST`)
    batch.forEach((item) => console.log(`    - ${item.name}`))

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
        cache.atomIds[batch[j].key] = atomIds[j]
        console.log(`  CREATED ${batch[j].name} → ${atomIds[j]}`)
      }
      saveCache(cache)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('AtomExists') || msg.includes('0xb4856ebc')) {
        console.log(`  Some atoms exist, falling back to individual creation...`)
        for (const item of batch) {
          if (cache.atomIds[item.key]) continue
          const encoded = stringToHex(cache.pins[item.key])

          // Delay between individual RPC calls to avoid 429 rate limits
          await new Promise((r) => setTimeout(r, 3000))

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
              cache.atomIds[item.key] = result[0]
              console.log(`    CREATED ${item.name} → ${result[0]}`)
            } catch (singleErr) {
              if (singleErr.message?.includes('AtomExists') || singleErr.message?.includes('0xb4856ebc')) {
                cache.atomIds[item.key] = atomId
                console.log(`    EXISTS ${item.name} → ${atomId}`)
              } else {
                console.error(`    FAIL ${item.name}: ${singleErr.message}`)
              }
            }
            saveCache(cache)
          } catch (calcErr) {
            console.error(`    FAIL ${item.name}: ${calcErr.message}`)
          }
        }
      } else {
        console.error(`  BATCH FAIL: ${msg}`)
      }
    }
  }

  // ── Summary ──

  console.log('\n=== Summary ===')
  console.log(`Favicons pinned: ${Object.keys(cache.imagePins).length}`)
  console.log(`Metadata pinned: ${Object.keys(cache.pins).length}`)
  console.log(`Platform atoms created: ${Object.keys(cache.atomIds).length}`)
  console.log(`Cache saved to: ${CACHE_FILE}`)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
