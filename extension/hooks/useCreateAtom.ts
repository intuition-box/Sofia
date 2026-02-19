import { usePinThingMutation } from "@0xsofia/graphql"
import { useWalletFromStorage } from './useWalletFromStorage'
import { atomService } from '../lib/services/AtomService'
import type { AtomIPFSData } from '../types/blockchain'

export type { PinnedAtomData } from '../lib/services/AtomService'

export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const { walletAddress: address } = useWalletFromStorage()

  return {
    ensureProxyApproval: () => atomService.ensureProxyApproval(address),
    pinAtomToIPFS: (atomData: AtomIPFSData) =>
      atomService.pinAtomToIPFS(atomData, pinThing),
    createAtomsFromPinned: (pinnedAtoms: import('../lib/services/AtomService').PinnedAtomData[]) =>
      atomService.createAtomsFromPinned(pinnedAtoms, address),
    createAtomWithMultivault: async (atomData: AtomIPFSData) => {
      const pinned = await atomService.pinAtomToIPFS(atomData, pinThing)
      return atomService.createAtomDirect(atomData, pinned, address)
    },
    createAtomsBatch: (atomsData: AtomIPFSData[]) =>
      atomService.createAtomsBatch(atomsData, address, pinThing)
  }
}
