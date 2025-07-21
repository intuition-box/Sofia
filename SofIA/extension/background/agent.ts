import { SOFIA_IDS } from "./constants";
import type { AgentMessagePayload } from "./types";

export function buildAgentPayload(msg: string): AgentMessagePayload {
  const summary =
    msg.split("\n").find((line) => line.startsWith("Titre:"))?.replace("Titre: ", "").trim() ||
    msg.slice(0, 100) ||
    "(no title)";

  return {
    channel_id: SOFIA_IDS.CHANNEL_ID,
    server_id: SOFIA_IDS.SERVER_ID,
    author_id: SOFIA_IDS.AUTHOR_ID,
    content: summary,
    source_type: "client_chat",
    raw_message: { text: msg },
    metadata: {
      channelType: "DM",
      isDm: true,
      targetUserId: SOFIA_IDS.AGENT_ID,
      agent_id: SOFIA_IDS.AGENT_ID,
      agentName: SOFIA_IDS.AGENT_NAME
    }
  };
}

export async function sendAgentMessage(payload: AgentMessagePayload): Promise<void> {
  console.debug("🧪 Envoi à l'agent :", payload);
  try {
    const response = await fetch("http://localhost:8080/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`❌ API relay error (${response.status}):`, text);
    } else {
      console.debug("✅ Relay response:", text);
    }
  } catch (err) {
    console.error("❌ Erreur proxy relay :", err);
  }
}