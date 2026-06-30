/**
 * sim-batch-gas.mjs — Simulated batch-publication gas probe (0 TRUST spent).
 *
 * Ramps batch size N for createAtoms / createTriples / depositBatch and calls
 * estimateContractGas against mainnet RPC with a stateOverride-funded dummy
 * account. No signing, no transaction, no funds required.
 *
 * Goal: find the real breaking point of batch publication.
 *   - MAX_BATCH_SIZE = 150 (hard revert at 151, confirmed empirically)
 *   - block gas limit = 2^50 (never binds: 150 items ≈ tens of millions of gas)
 *   - measured gas: ~146k/atom, ~417k/triple (vs the generous N×1M fallbacks)
 *   - the RPC estimates the whole valid range without choking → the prod
 *     "insufficient funds" is the WALLET falling back to 2^50, fixed by passing
 *     an explicit gas limit (see lib/utils/gasLimit.ts → explicitGasLimit).
 *
 * Run from apps/extension (needs viem from its node_modules):
 *   bun scripts/sim-batch-gas.mjs
 */
import { createPublicClient, http, stringToHex } from 'viem'

const RPC = 'https://rpc.intuition.systems'
const GQL = 'https://mainnet.intuition.sh/v1/graphql'
const PROXY = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c'
const DUMMY = '0x000000000000000000000000000000000000dEaD'
const I_ATOM = '0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b'
const TRUSTS = '0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9'
const CURVE = 1n
const HUGE = 10n ** 30n
const NS = [1, 5, 10, 20, 30, 50, 75, 100, 130, 150, 151]

const abi = [
  { inputs: [{ name: 'receiver', type: 'address' }, { name: 'data', type: 'bytes[]' }, { name: 'assets', type: 'uint256[]' }, { name: 'curveId', type: 'uint256' }], name: 'createAtoms', outputs: [{ type: 'bytes32[]' }], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'receiver', type: 'address' }, { name: 's', type: 'bytes32[]' }, { name: 'p', type: 'bytes32[]' }, { name: 'o', type: 'bytes32[]' }, { name: 'assets', type: 'uint256[]' }, { name: 'curveId', type: 'uint256' }], name: 'createTriples', outputs: [{ type: 'bytes32[]' }], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'receiver', type: 'address' }, { name: 'termIds', type: 'bytes32[]' }, { name: 'curveIds', type: 'uint256[]' }, { name: 'assets', type: 'uint256[]' }, { name: 'minShares', type: 'uint256[]' }], name: 'depositBatch', outputs: [{ type: 'uint256[]' }], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'subjectId', type: 'bytes32' }, { name: 'predicateId', type: 'bytes32' }, { name: 'objectId', type: 'bytes32' }], name: 'calculateTripleId', outputs: [{ type: 'bytes32' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getAtomCost', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getTripleCost', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
]

const client = createPublicClient({ transport: http(RPC) })
const gql = async (q) => (await (await fetch(GQL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q }) })).json()).data
const estimate = (args) => client.estimateContractGas({ ...args, account: DUMMY, stateOverride: [{ address: DUMMY, balance: HUGE }] })
const short = (e) => (e.shortMessage || e.message || '').split('\n')[0].slice(0, 60)

function table(rows) {
  console.log('N\tgas\t\tgas/item\tstatus')
  for (const r of rows) console.log(`${r.N}\t${r.gas ?? '—'}\t${r.gas ? '\t' : ''}${r.perItem ?? '—'}\t${r.status}`)
}

async function rampAtoms() {
  console.log('\n===== createAtoms =====')
  const atomCost = await client.readContract({ address: PROXY, abi, functionName: 'getAtomCost' })
  const seed = Math.floor(Math.random() * 1e9)
  const rows = []
  for (const N of NS) {
    const data = Array.from({ length: N }, (_, i) => stringToHex(`ipfs://sim-${seed}-${N}-${i}`))
    const value = atomCost * BigInt(N)
    try {
      const gas = await estimate({ address: PROXY, abi, functionName: 'createAtoms', args: [DUMMY, data, data.map(() => 0n), CURVE], value })
      rows.push({ N, gas: gas.toString(), perItem: (gas / BigInt(N)).toString(), status: 'OK' })
    } catch (e) { rows.push({ N, status: 'FAIL: ' + short(e) }) }
  }
  table(rows)
}

async function rampTriples() {
  console.log('\n===== createTriples (I | trusts | object) =====')
  const tripleCost = await client.readContract({ address: PROXY, abi, functionName: 'getTripleCost' })
  const d = await gql(`{ atoms(limit:300, order_by:{term_id:asc}){ term_id } }`)
  const objs = d.atoms.map((a) => a.term_id).filter((x) => x && x !== I_ATOM && x !== TRUSTS).slice(0, 250)
  const ids = (await Promise.all(objs.map((o) => client.readContract({ address: PROXY, abi, functionName: 'calculateTripleId', args: [I_ATOM, TRUSTS, o] }).then((id) => ({ o, id })).catch(() => null)))).filter(Boolean)
  const ex = await gql(`{ triples(where:{term_id:{_in:[${ids.map((v) => `"${v.id}"`).join(',')}]}}){ term_id } }`)
  const existing = new Set(ex.triples.map((t) => t.term_id.toLowerCase()))
  const fresh = ids.filter((v) => !existing.has(v.id.toLowerCase()))
  console.log(`(${fresh.length} fresh non-existing triples available)`)
  const rows = []
  for (const N of NS) {
    if (N > fresh.length) { rows.push({ N, status: `SKIP (only ${fresh.length} fresh)` }); continue }
    const o = fresh.slice(0, N).map((v) => v.o)
    const value = tripleCost * BigInt(N)
    try {
      const gas = await estimate({ address: PROXY, abi, functionName: 'createTriples', args: [DUMMY, o.map(() => I_ATOM), o.map(() => TRUSTS), o, o.map(() => 0n), CURVE], value })
      rows.push({ N, gas: gas.toString(), perItem: (gas / BigInt(N)).toString(), status: 'OK' })
    } catch (e) { rows.push({ N, status: 'FAIL: ' + short(e) }) }
  }
  table(rows)
}

async function rampDeposits() {
  // Best-effort: depositBatch has extra preconditions (curve registration /
  // minShares slippage) beyond value, so some terms revert in pure simulation.
  console.log('\n===== depositBatch (existing terms, best-effort) =====')
  const d = await gql(`{ atoms(limit:160, order_by:{term_id:asc}){ term_id } }`)
  const terms = d.atoms.map((a) => a.term_id)
  const asset = 1000000000000000n
  const perItemValue = 300000000000000000n // 0.3 TRUST/item to clear the Sofia fixed fee + 5%
  const rows = []
  for (const N of NS) {
    if (N > terms.length) { rows.push({ N, status: 'SKIP' }); continue }
    const t = terms.slice(0, N)
    try {
      const gas = await estimate({ address: PROXY, abi, functionName: 'depositBatch', args: [DUMMY, t, t.map(() => CURVE), t.map(() => asset), t.map(() => 0n)], value: perItemValue * BigInt(N) })
      rows.push({ N, gas: gas.toString(), perItem: (gas / BigInt(N)).toString(), status: 'OK' })
    } catch (e) { rows.push({ N, status: 'FAIL: ' + short(e) }) }
  }
  table(rows)
}

async function main() {
  console.log(`Simulated batch gas probe — proxy ${PROXY} @ ${RPC}`)
  await rampAtoms()
  await rampTriples()
  await rampDeposits()
  console.log('\nDone. (No transaction sent, no TRUST spent.)')
}
main().catch((e) => console.error('FATAL', e))
