import { atomService } from "../lib/services/AtomService"
import type { PinnedAtomData } from "../lib/services/AtomService"
import type { AtomIPFSData } from "../types/blockchain"
import { useWalletFromStorage } from "./useWalletFromStorage"

export type { PinnedAtomData } from "../lib/services/AtomService"

export const useCreateAtom = () => {
  const { walletAddress: address } = useWalletFromStorage()

  return {
    ensureProxyApproval: () => atomService.ensureProxyApproval(address),
    pinAtomToIPFS: (atomData: AtomIPFSData) =>
      atomService.pinAtomToIPFS(atomData),
    createAtomsFromPinned: (pinnedAtoms: PinnedAtomData[]) =>
      atomService.createAtomsFromPinned(pinnedAtoms, address),
    createAtomWithMultivault: async (atomData: AtomIPFSData) => {
      const pinned = await atomService.pinAtomToIPFS(atomData)
      return atomService.createAtomDirect(atomData, pinned, address)
    },
    createAtomsBatch: (atomsData: AtomIPFSData[]) =>
      atomService.createAtomsBatch(atomsData, address)
  }
}
