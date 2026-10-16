import { certificationService } from "../lib/services"
import type { ContextTripleItem, ObjectAtomData } from "../lib/services"
import type { BatchTripleInput } from "../types/blockchain"
import { useWalletFromStorage } from "./useWalletFromStorage"

/** Thin facade over CertificationService, bound to the stored wallet. */
export const useCreateTripleOnChain = () => {
  const { walletAddress: address } = useWalletFromStorage()

  return {
    createTripleOnChain: (
      predicateName: string,
      objectData: ObjectAtomData,
      customWeight?: bigint
    ) =>
      certificationService.createTripleOnChain(
        address,
        predicateName,
        objectData,
        customWeight
      ),
    createTriplesBatch: (inputs: BatchTripleInput[]) =>
      certificationService.createTriplesBatch(address, inputs),
    createContextTriplesBatch: (contextItems: ContextTripleItem[]) =>
      certificationService.createContextTriplesBatch(address, contextItems)
  }
}
