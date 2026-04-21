/**
 * Social & identity-related types
 */

export interface DiscordProfile {
  id: string
  username: string
  global_name?: string
  avatar?: string
  verified?: boolean
}
