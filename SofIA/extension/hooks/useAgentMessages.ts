import { useEffect, useState } from "react"

type AgentResponse = {
    text: string
    thought?: string
    actions?: string[]
}

function formatTriplets(message: AgentResponse): string[] {
    if (!message?.text) return []

    const triplets: string[] = []
    const { text, thought, actions } = message

    const urlMatch = text.match(/URL: (https?:\/\/[^\n]+)/)
    const titleMatch = text.match(/Titre: (.+)/)

    if (urlMatch) triplets.push(`🧠 You → visited → ${urlMatch[1]}`)
    if (titleMatch) triplets.push(`📖 You → saw → "${titleMatch[1]}"`)
    if (thought) triplets.push(`💭 SofIA → thought → "${thought}"`)
    actions?.forEach((a) => triplets.push(`🤖 SofIA → action → ${a}`))

    return triplets
}

export function useAgentMessages() {
    const [rawMessages, setRawMessages] = useState<string[]>([])
    const [triplets, setTriplets] = useState<string[]>([])

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080")

        socket.onopen = () => console.log("✅ WebSocket ready (MyGraphPage)")
        socket.onmessage = (event) => {
            const { type, message } = JSON.parse(event.data)

            if (type === "agent_response") {
                const formatted = formatTriplets(message)
                setTriplets((prev) => [...prev, ...formatted])
                setRawMessages((prev) => [...prev, message?.text ?? "(vide)"])
            }
        }

        return () => socket.close()
    }, [])

    return { rawMessages, triplets }
}
