// circle-pro-api base URL. Plasmo inlines PLASMO_PUBLIC_* at build time; the
// `||` fallback covers an empty build-arg (not just undefined).
export const CIRCLE_PRO_API_URL =
  process.env.PLASMO_PUBLIC_CIRCLE_PRO_API_URL ||
  "https://circle-pro-api.sofia.intuition.box"
