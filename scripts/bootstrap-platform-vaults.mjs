/**
 * Bootstrap Platform Atom Vaults
 *
 * Deposits a fixed amount of TRUST into each platform atom vault
 * to seed initial liquidity and resolve the cold start problem.
 *
 * Reads PRIVATE_KEY from .env file automatically.
 *
 * Usage:
 *   node scripts/bootstrap-platform-vaults.mjs
 *
 * Options:
 *   --dry-run       Show what would be deposited, don't send transactions
 *   --amount=N      Amount of TRUST per platform (default: 2)
 *   --batch=N       Batch size (default: 10)
 *   --limit=N       Only process first N platforms (for testing)
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, existsSync } from 'fs'

// Load .env file
function loadEnv() {
  if (!existsSync('.env')) return
  const content = readFileSync('.env', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv()

// ── Config ──

const RPC_URL = 'https://rpc.intuition.systems'
const SOFIA_FEE_PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const CURVE_ID = 1n
const CACHE_FILE = 'scripts/.platform-cache.json'

// ── Chain ──

const intuitionChain = {
  id: 1155,
  name: 'Intuition Mainnet',
  network: 'intuition-mainnet',
  nativeCurrency: { name: 'Trust', symbol: 'TRUST', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
}

// ── ABI ──

const PROXY_ABI = [
  {
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'termId', type: 'bytes32' },
      { name: 'curveId', type: 'uint256' },
      { name: 'minShares', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'termIds', type: 'bytes32[]' },
      { name: 'curveIds', type: 'uint256[]' },
      { name: 'assets', type: 'uint256[]' },
      { name: 'minShares', type: 'uint256[]' },
    ],
    name: 'depositBatch',
    outputs: [{ name: 'shares', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'depositAmount', type: 'uint256' }],
    name: 'getTotalDepositCost',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'depositCount', type: 'uint256' },
      { name: 'totalDeposit', type: 'uint256' },
    ],
    name: 'calculateDepositFee',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const amountTrust = parseFloat(args.find((a) => a.startsWith('--amount='))?.split('=')[1] || '2')
  const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '10')
  const limit = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0')

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey && !dryRun) {
    console.error('ERROR: Set PRIVATE_KEY environment variable (0x...)')
    process.exit(1)
  }

  // Load platform atom IDs from cache
  if (!existsSync(CACHE_FILE)) {
    console.error('ERROR: Platform cache not found. Run create-platform-atoms.mjs first.')
    process.exit(1)
  }

  const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  let platformEntries = Object.entries(cache.atomIds || {})
    .map(([key, termId]) => ({
      slug: key.replace('platform:', ''),
      termId,
    }))

  if (limit > 0) platformEntries = platformEntries.slice(0, limit)

  const amountWei = parseEther(String(amountTrust))

  console.log(`\n=== Bootstrap Platform Vaults ===`)
  console.log(`Platforms: ${platformEntries.length}`)
  console.log(`Amount per platform: ${amountTrust} TRUST`)
  console.log(`Total needed: ${amountTrust * platformEntries.length} TRUST`)
  console.log(`Batch size: ${batchSize}`)
  console.log(`Dry run: ${dryRun}\n`)

  if (dryRun) {
    for (const { slug, termId } of platformEntries) {
      console.log(`  ${slug} → ${termId} (${amountTrust} TRUST)`)
    }
    console.log(`\n── Dry run complete. ──`)
    return
  }

  // Setup clients
  const account = privateKeyToAccount(privateKey)
  console.log(`Wallet: ${account.address}`)

  const publicClient = createPublicClient({
    chain: intuitionChain,
    transport: http(RPC_URL),
  })

  const walletClient = createWalletClient({
    account,
    chain: intuitionChain,
    transport: http(RPC_URL),
  })

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Balance: ${formatEther(balance)} TRUST`)

  // Use contract's calculateDepositFee for accurate fee calculation
  const totalDepositAll = amountWei * BigInt(platformEntries.length)
  const totalFee = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'calculateDepositFee',
    args: [BigInt(platformEntries.length), totalDepositAll],
  })

  const totalCost = totalDepositAll + totalFee

  console.log(`\nTotal deposit: ${formatEther(totalDepositAll)} TRUST`)
  console.log(`Total fee: ${formatEther(totalFee)} TRUST`)
  console.log(`Total cost: ${formatEther(totalCost)} TRUST`)

  if (balance < totalCost) {
    console.error(`\n  NOT ENOUGH TRUST! Need ${formatEther(totalCost - balance)} more`)
    process.exit(1)
  }

  console.log(`  Enough TRUST (${formatEther(balance - totalCost)} will remain)\n`)

  // Use single deposit (more reliable) then try batch
  let deposited = 0

  // Get cost for single deposit via contract
  const singleCost = await publicClient.readContract({
    address: SOFIA_FEE_PROXY,
    abi: PROXY_ABI,
    functionName: 'getTotalDepositCost',
    args: [amountWei],
  })

  console.log(`Cost per single deposit: ${formatEther(singleCost)} TRUST\n`)

  for (let i = 0; i < platformEntries.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 2000))

    const p = platformEntries[i]
    console.log(`[${i + 1}/${platformEntries.length}] ${p.slug} (${p.termId})`)

    try {
      const txHash = await walletClient.writeContract({
        address: SOFIA_FEE_PROXY,
        abi: PROXY_ABI,
        functionName: 'deposit',
        args: [account.address, p.termId, CURVE_ID, 0n],
        value: singleCost,
      })

      console.log(`  TX: ${txHash}`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      if (receipt.status === 'success') {
        deposited++
        console.log(`  OK`)
      } else {
        console.error(`  TX FAILED`)
      }
    } catch (e) {
      console.error(`  FAIL: ${e.message?.slice(0, 200)}`)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Deposited: ${deposited}/${platformEntries.length}`)
  console.log(`Amount per platform: ${amountTrust} TRUST`)
  console.log(`Total deposited: ${amountTrust * deposited} TRUST`)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
