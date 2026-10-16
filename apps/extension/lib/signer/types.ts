import type { Abi, Address, Hash } from "viem"

/**
 * A contract write, chain-agnostic. The signer decides how it reaches the
 * chain (injected wallet popup today, delegated session key tomorrow).
 */
export interface ContractWrite {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
  gas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}

export interface TxSigner {
  kind: "injected" | "delegated"
  /** msg.sender seen by the target contract — use it for simulate/estimate */
  account: Address
  /** The user's wallet — receives shares/positions */
  receiver: Address
  writeContract(request: ContractWrite): Promise<Hash>
}

export type SignerFactory = () => Promise<TxSigner>
