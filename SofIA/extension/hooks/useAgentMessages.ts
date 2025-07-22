import { useEffect, useState } from "react";

type AgentResponse = {
    text: string;
    thought?: string;
    actions?: string[];
};

function extractTripletsFromText(text: string): string[] {
    const tripletSection = text.split("🧩 Triplets :")[1]?.split("🧠 Session")[0] || "";
    return tripletSection
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

function extractSession(text: string): string | null {
    const match = text.match(/🧠 Session\s*:\s*(.+)/);
    return match ? match[1].trim() : null;
}

function extractIntention(text: string): string | null {
    const match = text.match(/🎯 Intention\s*:\s*(.+)/);
    return match ? match[1].trim() : null;
}

export function useAgentMessages() {
    const [triplets, setTriplets] = useState<string[]>([]);
    const [session, setSession] = useState<string | null>(null);
    const [intention, setIntention] = useState<string | null>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");

        socket.onopen = () => console.log("✅ WebSocket connecté");

        socket.onmessage = (event) => {
            const parsed = JSON.parse(event.data) as { type: string; message: AgentResponse };

            if (parsed.type === "agent_response" && parsed.message?.text) {
                const { text } = parsed.message;

                // Extraction des triplets
                const newTriplets = extractTripletsFromText(text);
                setTriplets((prev) => [...prev, ...newTriplets]);

                // Extraction de la session et de l'intention
                const sess = extractSession(text);
                if (sess) setSession(sess);

                const intent = extractIntention(text);
                if (intent) setIntention(intent);
            }
        };

        socket.onerror = (err) => {
            console.error("❌ Erreur WebSocket :", err);
        };

        socket.onclose = () => {
            console.warn("🔌 WebSocket fermé.");
        };

        return () => socket.close();
    }, []);

    return { triplets, session, intention };
}
