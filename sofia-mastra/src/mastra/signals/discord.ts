import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch } from "./utils"

const BASE = "https://discord.com/api/v10"

// Discord permission bit for ADMINISTRATOR
const ADMINISTRATOR = 0x8

export const fetchDiscordSignals: SignalFetcher = async (
  token
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }

  const guildsRes = await safeFetch(`${BASE}/users/@me/guilds`, headers)
  const guilds: any[] = await guildsRes.json()

  // Servers where user has ADMINISTRATOR permission
  const adminGuilds = guilds.filter(
    (g) => (Number(g.permissions) & ADMINISTRATOR) !== 0
  )

  return {
    serveurs_specialises: guilds.length,
    roles_obtenus: adminGuilds.length,
  }
}
