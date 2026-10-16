import { getStoredWalletAddress } from "../utils/walletStorage"
import { createDelegatedSigner } from "./delegatedSigner"
import { createInjectedSigner } from "./injectedSigner"
import { sessionStore } from "./sessionStore"
import type { SignerFactory, TxSigner } from "./types"

export type { ContractWrite, SignerFactory, TxSigner } from "./types"
export {
  serializeDelegation,
  deserializeDelegation,
  type SerializedDelegation,
  type SignedDelegation
} from "./delegation"
export { DelegationError } from "./delegatedSigner"
export {
  sessionStore,
  SESSION_KEY_PREFIX,
  type DelegatedSession,
  type PendingSession
} from "./sessionStore"

/**
 * Delegated session for the connected wallet when one is active,
 * otherwise the injected wallet (one popup per transaction).
 */
const resolveSigner: SignerFactory = async () => {
  const wallet = await getStoredWalletAddress()
  const session = wallet ? await sessionStore.getActive(wallet) : null
  return session ? createDelegatedSigner(session) : createInjectedSigner()
}

let factory: SignerFactory = resolveSigner

/** Active signer for on-chain writes. */
export const getSigner = (): Promise<TxSigner> => factory()

/** Override the signer resolution (tests, previews). Pass null to reset. */
export const setSignerFactory = (next: SignerFactory | null): void => {
  factory = next ?? resolveSigner
}
