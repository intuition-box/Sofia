import { useCallback } from "react"
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

                const amount = BigInt("1000000000000000") // 0.001 ETH par défaut

                const balance = await publicClient.getBalance({ address })

                if (balance < amount) {
                    console.warn("Insufficient balance")
                    throw new Error("Insufficient balance")
                }

                console.log("Position creation simplified - direct deposit not implemented yet")
                const txHash = "0x" + Math.random().toString(16).slice(2, 66) // Hash simulé

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