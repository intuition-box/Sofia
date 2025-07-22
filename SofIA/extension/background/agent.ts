import { SOFIA_IDS } from "./constants"
import type { AgentMessagePayload } from "./types"
import { sendMessageToAgent } from "./websocket"

export function buildAgentPayload(msg: string): AgentMessagePayload {
  const extract = (label: string): string | null => {
    const line = msg.split("\n").find((line) => line.startsWith(label))
    return line?.replace(label, "").trim() || null
  }

  const url = extract("URL:")
  const title = extract("Titre:")
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

  //  Texte lisible envoyé à l'agent
  const textLines = [
    title ? `Titre: ${title}` : null,
    url ? `URL: ${url}` : null,
    h1 ? `H1: ${h1}` : null,
    visits ? `Visites: ${visits}` : null,
    behaviorBlock ? `Comportement:\n${behaviorBlock}` : null
  ].filter(Boolean)

  const text = textLines.join("\n")

  return {
    channel_id: SOFIA_IDS.CHANNEL_ID,
    server_id: SOFIA_IDS.SERVER_ID,
    author_id: SOFIA_IDS.AUTHOR_ID,
    content: text, // contenu brut pour audit/log
    source_type: "client_chat",
    raw_message: {
      text 
    },
    metadata: {
      channelType: "DM",
      isDm: true,
      targetUserId: SOFIA_IDS.AGENT_ID,
      agent_id: SOFIA_IDS.AGENT_ID,
      agentName: SOFIA_IDS.AGENT_NAME,
      url,
      description,
      keywords,
      h1,
      visits,
      behavior
    }
  }
}
export function sendAgentMessage(payload: AgentMessagePayload): void {
  const msg = payload.raw_message?.text

  if (!msg || typeof msg !== "string") {
    console.warn("⚠️ Le message à envoyer est vide ou invalide.")
    return
  }

  sendMessageToAgent(msg)
}
