import { useEffect, useState } from "react"

type AgentResponse = {
    text: string
    thought?: string
    actions?: string[]
}

// ❗️On extrait uniquement les triplets entre backticks `...`
function formatTriplets(message: AgentResponse): string[] {
    if (!message?.text) return []

    // Match tout ce qui est entre `backticks`
    const matches = message.text.match(/`([^`]+)`/g)
    if (!matches) return []

    // Supprime les backticks autour et nettoie l'espace
    return matches.map((m) => m.replace(/`/g, "").trim())
}

export function useAgentMessages() {
    const [rawMessages, setRawMessages] = useState<string[]>([])
    const [triplets, setTriplets] = useState<string[]>([])
    

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080")

        socket.onopen = () => console.log("✅ WebSocket ready (MyGraphPage)")
        socket.onmessage = (event) => {
            try {
                const { type, message } = JSON.parse(event.data)

                if (type === "agent_response" && message?.text) {
                    const formatted = formatTriplets(message)
                    if (formatted.length > 0) {
                        setTriplets((prev) => [...prev, ...formatted])
                    }
                    setRawMessages((prev) => [...prev, message.text])
                }
            } catch (err) {
                console.warn("⚠️ WebSocket message parse failed:", event.data, err)
            }
        }

        return () => socket.close()
    }, [])

    return { rawMessages, triplets }
}
