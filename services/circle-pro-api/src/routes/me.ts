// Caller-scoped reads (behind auth). Powers the circle picker in the extension
// and web app: "which circles can I write to?" — sourced from group-api.
import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { getWallet } from '../auth'
import { listCircles } from '../membership'

export const me = new Hono<AppEnv>()

/** GET /me/circles → the circles the caller actively belongs to. */
me.get('/me/circles', async (c) => {
  const wallet = getWallet(c)
  const circles = await listCircles(wallet)
  return c.json({ circles })
})
