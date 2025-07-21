import { SOFIA_IDS } from "./constants"
import type { AgentMessagePayload } from "./types"

export function buildAgentPayload(msg: string): AgentMessagePayload {
  const summary =
    msg.split("\n").find((line) => line.startsWith("Titre:"))?.replace("Titre: ", "").trim() ||
    msg.slice(0, 100) ||
    "(no title)"

  // Extraction des infos clés
  const extract = (label: string): string | null => {
    const line = msg.split("\n").find((line) => line.startsWith(label))
    return line?.replace(label, "").trim() || null
  }

  const sanitizedUrl = extract("URL: ")
  const description = extract("Description:")
  const keywords = extract("Mots-clés:")
  const h1 = extract("H1:")
  const visits = extract("Visites:")
  const behaviorBlock = msg.split("Comportement:")[1]?.trim()

  const behavior = behaviorBlock
    ? {
      videoPlayed: behaviorBlock.includes("Vidéo regardée"),
      videoDuration: parseFloat(behaviorBlock.match(/Vidéo regardée \(([\d.]+)s\)/)?.[1] || "0"),
      audioPlayed: behaviorBlock.includes("Audio écouté"),
      audioDuration: parseFloat(behaviorBlock.match(/Audio écouté \(([\d.]+)s\)/)?.[1] || "0"),
      articleRead: behaviorBlock.includes("Article lu"),
      articleTitle: behaviorBlock.match(/Article lu\s*:\s*"(.+?)"/)?.[1] || null,
      articleReadTime: parseFloat(behaviorBlock.match(/\(([\d.]+)s\)/)?.[1] || "0")
    }
    : undefined

  // ➕ Génère un résumé simple de metadata à inclure dans le champ `content`
  const metaSummary = [
    ` ${sanitizedUrl}`,
    description ? ` ${description}` : null,
    keywords ? ` ${keywords}` : null,
    h1 ? ` ${h1}` : null,
    visits ? ` ${visits}` : null,
    behaviorBlock ? ` Comportement:\n${behaviorBlock}` : null
  ]
    .filter(Boolean)
    .join("\n")

  const content = `Résumé de navigation: ${summary}\n\n${metaSummary}\n\n Données brutes:\n${msg}`

  return {
    channel_id: SOFIA_IDS.CHANNEL_ID,
    server_id: SOFIA_IDS.SERVER_ID,
    author_id: SOFIA_IDS.AUTHOR_ID,
    content, // ✅ Contient msg + résumé metadata
    source_type: "client_chat",
    raw_message: { text: msg }, 
    metadata: {
      channelType: "DM",
      isDm: true,
      targetUserId: SOFIA_IDS.AGENT_ID,
      agent_id: SOFIA_IDS.AGENT_ID,
      agentName: SOFIA_IDS.AGENT_NAME,
      url: sanitizedUrl,
      description,
      keywords,
      h1,
      visits,
      behavior
    }
  }
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