/**
 * Topic UI metadata — colors and icons not stored on-chain.
 * Keyed by topic slug (matches TOPIC_ATOM_IDS keys).
 *
 * Colors are a 1:1 port of `proto-explorer/src/data.ts` DOMAIN_COLORS so
 * banners, rings, bars and radar polygons all match the proto palette.
 */

export interface TopicMeta {
  icon: string
  color: string
}

export const TOPIC_META: Record<string, TopicMeta> = {
  "tech-dev":          { icon: "keyboard",   color: "#7bade0" },
  "design-creative":   { icon: "palette",    color: "#d98cb3" },
  "music-audio":       { icon: "music",      color: "#e0896a" },
  "gaming":            { icon: "gamepad",    color: "#a78bdb" },
  "web3-crypto":       { icon: "link",       color: "#6dd4a0" },
  "science":           { icon: "microscope", color: "#5cc4d6" },
  "sport-health":      { icon: "running",    color: "#e4b95a" },
  "video-cinema":      { icon: "film",       color: "#ff9aa2" },
  "entrepreneurship":  { icon: "rocket",     color: "#ffc6b0" },
  "performing-arts":   { icon: "theater",    color: "#c890d9" },
  "nature-environment":{ icon: "leaf",       color: "#8ed1a8" },
  "food-lifestyle":    { icon: "utensils",   color: "#f2c36b" },
  "literature":        { icon: "book",       color: "#9fb6e2" },
  "personal-dev":      { icon: "lotus",      color: "#b5d68f" },
}
