import { createInjectedSigner } from "./injectedSigner"
import type { SignerFactory, TxSigner } from "./types"

export type { ContractWrite, SignerFactory, TxSigner } from "./types"

let factory: SignerFactory = createInjectedSigner

/** Active signer for on-chain writes. Injected wallet by default. */
export const getSigner = (): Promise<TxSigner> => factory()

/** Swap the signer (e.g. delegated session key). Pass null to reset. */
export const setSignerFactory = (next: SignerFactory | null): void => {
  factory = next ?? createInjectedSigner
}
