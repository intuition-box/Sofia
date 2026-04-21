/**
 * Topic UI metadata — colors and icons not stored on-chain.
 * Keyed by topic slug (matches TOPIC_ATOM_IDS keys).
 */

export interface TopicMeta {
  icon: string
  color: string
}

export const TOPIC_META: Record<string, TopicMeta> = {
  "tech-dev": { icon: "keyboard", color: "#4472C4" },
  "design-creative": { icon: "palette", color: "#E06C75" },
  "music-audio": { icon: "music", color: "#61AFEF" },
  "gaming": { icon: "gamepad", color: "#C678DD" },
  "web3-crypto": { icon: "link", color: "#627EEA" },
  "science": { icon: "microscope", color: "#98C379" },
  "sport-health": { icon: "running", color: "#E5C07B" },
  "video-cinema": { icon: "film", color: "#E06C75" },
  "entrepreneurship": { icon: "rocket", color: "#D19A66" },
  "performing-arts": { icon: "theater", color: "#E06C75" },
  "nature-environment": { icon: "leaf", color: "#98C379" },
  "food-lifestyle": { icon: "utensils", color: "#E5C07B" },
  "literature": { icon: "book", color: "#ABB2BF" },
  "personal-dev": { icon: "lotus", color: "#C678DD" },
}
