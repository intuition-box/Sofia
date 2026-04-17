import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince } from "./utils"

const BASE = "https://discord.com/api/v10"

// Discord permission bits
const ADMINISTRATOR = 0x8n
const MANAGE_GUILD = 0x20n
const MANAGE_CHANNELS = 0x10n
const MANAGE_ROLES = 0x10000000n
const MOD_MASK = MANAGE_GUILD | MANAGE_CHANNELS | MANAGE_ROLES

// Discord epoch
const DISCORD_EPOCH_MS = 1420070400000n

function snowflakeToDate(id: string): Date | null {
  try {
    const ms = (BigInt(id) >> 22n) + DISCORD_EPOCH_MS
    return new Date(Number(ms))
  } catch {
    return null
  }
}

export const fetchDiscordSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = { Authorization: `Bearer ${token}` }
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Primary — guilds list
  const guildsRes = await safeFetch(`${BASE}/users/@me/guilds`, headers)
  const guilds: any[] = await guildsRes.json()

  let adminGuilds = 0
  let moderatorGuilds = 0
  let ownedGuilds = 0

  for (const g of guilds) {
    const perms = (() => {
      try { return BigInt(g.permissions ?? "0") } catch { return 0n }
    })()
    if ((perms & ADMINISTRATOR) !== 0n) adminGuilds++
    if ((perms & MOD_MASK) !== 0n) moderatorGuilds++
    if (g.owner === true) ownedGuilds++
  }

  // Account age from /users/@me snowflake
  const anciennete_mois = await safe(
    async () => {
      const meRes = await safeFetch(`${BASE}/users/@me`, headers)
      const me = await meRes.json()
      if (!me.id) return 0
      const createdAt = snowflakeToDate(String(me.id))
      return createdAt ? monthsSince(createdAt.toISOString()) : 0
    },
    0,
    "discord_account_age"
  )

  return {
    serveurs_specialises: guilds.length,
    roles_obtenus: adminGuilds,
    moderator_guilds: moderatorGuilds,
    owned_guilds: ownedGuilds,
    anciennete_mois,
  }
}
