import { useCallback } from "react"
import { Multivault } from "@0xintuition/protocol"
import { getClients } from "../lib/viemClients"

export function useCreatePosition() {
    const createPosition = useCallback(
        async ({
            vaultId,
        }: {
            vaultId: bigint
        }) => {
            try {
                console.log("Starting createPosition")
                const { walletClient, publicClient } = await getClients()
                console.log("Clients fetched")

                const address = walletClient.account.address
                console.log("Wallet address:", address)

                const multivault = new Multivault({ walletClient, publicClient })

                const { minDeposit } = await multivault.getGeneralConfig()
                const amount = minDeposit

                const balance = await publicClient.getBalance({ address })

                if (balance < amount) {
                    console.warn("Insufficient balance")
                    throw new Error("Insufficient balance")
                }

                console.log("Simulating deposit...")
                await multivault.contract.simulate.depositTriple(
                    [address, vaultId],
                    {
                        value: amount,
                        account: address
                    }
                )

                console.log("Sending transaction...")
                const txHash = await multivault.contract.write.depositTriple(
                    [address, vaultId],
                    { value: amount }
                )

                console.log("Transaction hash:", txHash)
                return txHash
            } catch (err: any) {
                console.error("Error creating position:", err)
                throw err
            }
        },
        []
    )

    return { createPosition }
}