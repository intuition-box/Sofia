/**
 * Minimal MetaMask Delegation Framework encoding (no SDK in the extension:
 * the kit is ~3 MB and uses dynamic imports, which MV3 service workers reject).
 * Byte-for-byte identical to @metamask/smart-accounts-kit for the single-call
 * root-delegation case we use.
 */

import {
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  type Abi,
  type Address,
  type Hex
} from "viem"

export interface Caveat {
  enforcer: Address
  terms: Hex
  args: Hex
}

export interface SignedDelegation {
  delegate: Address
  delegator: Address
  authority: Hex
  caveats: Caveat[]
  salt: bigint
  signature: Hex
}

/** JSON-safe form (bigint salt as decimal string) for messaging/storage */
export type SerializedDelegation = Omit<SignedDelegation, "salt"> & {
  salt: string
}

export const serializeDelegation = (
  d: SignedDelegation
): SerializedDelegation => ({ ...d, salt: d.salt.toString() })

export const deserializeDelegation = (
  d: SerializedDelegation
): SignedDelegation => ({ ...d, salt: BigInt(d.salt) })

const DELEGATION_TUPLE = {
  type: "tuple",
  components: [
    { name: "delegate", type: "address" },
    { name: "delegator", type: "address" },
    { name: "authority", type: "bytes32" },
    {
      name: "caveats",
      type: "tuple[]",
      components: [
        { name: "enforcer", type: "address" },
        { name: "terms", type: "bytes" },
        { name: "args", type: "bytes" }
      ]
    },
    { name: "salt", type: "uint256" },
    { name: "signature", type: "bytes" }
  ]
} as const

const DELEGATION_MANAGER_ABI = [
  {
    type: "function",
    name: "redeemDelegations",
    inputs: [
      { name: "_permissionContexts", type: "bytes[]" },
      { name: "_modes", type: "bytes32[]" },
      { name: "_executionCallDatas", type: "bytes[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "disabledDelegations",
    inputs: [{ name: "delegationHash", type: "bytes32" }],
    outputs: [{ name: "isDisabled", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDelegationHash",
    inputs: [{ name: "_input", ...DELEGATION_TUPLE }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "pure"
  }
] as const

// Widened to `Abi` (same trick as MultiVaultAbiTyped): the literal ABI makes
// viem's write/estimate generics recurse past TS limits in this project.
export const DelegationManagerAbi: Abi = DELEGATION_MANAGER_ABI

/** ExecutionMode.SingleDefault — one call, revert on failure */
const SINGLE_DEFAULT_MODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const

export interface DelegatedCall {
  target: Address
  value: bigint
  callData: Hex
}

const DELEGATION_ARRAY = [{ ...DELEGATION_TUPLE, type: "tuple[]" }] as const

/** Permission context = abi-encoded Delegation[] (leaf first) */
export const encodePermissionContext = (delegation: SignedDelegation): Hex =>
  encodeAbiParameters(DELEGATION_ARRAY, [[delegation]])

/** Decode a permission context (e.g. one granted by MetaMask via ERC-7715) */
export function decodePermissionContext(context: Hex): SignedDelegation[] {
  const [delegations] = decodeAbiParameters(DELEGATION_ARRAY, context)
  return delegations.map((d) => ({
    delegate: d.delegate,
    delegator: d.delegator,
    authority: d.authority,
    caveats: d.caveats.map((c) => ({
      enforcer: c.enforcer,
      terms: c.terms,
      args: c.args
    })),
    salt: d.salt,
    signature: d.signature
  }))
}

/**
 * redeemDelegations args executing `call` as the delegator, authorised by a
 * permission context (one delegation, or a chain granted by the wallet).
 */
export function buildRedeemArgsFromContext(
  permissionContext: Hex,
  call: DelegatedCall
): readonly [Hex[], Hex[], Hex[]] {
  const executionCallData = encodePacked(
    ["address", "uint256", "bytes"],
    [call.target, call.value, call.callData]
  )
  return [[permissionContext], [SINGLE_DEFAULT_MODE], [executionCallData]]
}

/** Same, for a single root delegation */
export const buildRedeemArgs = (
  delegation: SignedDelegation,
  call: DelegatedCall
): readonly [Hex[], Hex[], Hex[]] =>
  buildRedeemArgsFromContext(encodePermissionContext(delegation), call)

/** Calldata for DelegationManager.redeemDelegations (see buildRedeemArgs) */
export const encodeRedeemDelegations = (
  delegation: SignedDelegation,
  call: DelegatedCall
): Hex =>
  encodeFunctionData({
    abi: DELEGATION_MANAGER_ABI,
    functionName: "redeemDelegations",
    args: buildRedeemArgs(delegation, call)
  })
