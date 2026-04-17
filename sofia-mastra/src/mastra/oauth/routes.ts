import { registerApiRoute } from "@mastra/core/server"
import { getOAuthProvider } from "./config"
import { exchangeCodeForToken } from "./exchange"
import { verifyAndGetUserId, type Platform } from "./verify"

/**
 * OAuth routes for Sofia Explorer frontend.
 *
 * Flow:
 *   1. GET /oauth/:platform/authorize → 302 redirect to provider OAuth page
 *   2. POST /oauth/:platform/callback → exchange code for token, return to frontend
 *
 * The frontend then calls linkSocialWorkflow to create the on-chain triple
 * and store the token encrypted.
 *
 * Note: these are mounted under /oauth/* (not /api/oauth/*) because the /api
 * prefix is reserved by Mastra for auto-generated routes.
 */
export const oauthRoutes = [
  registerApiRoute("/oauth/:platform/authorize", {
    method: "GET",
    handler: async (c) => {
      const platform = c.req.param("platform")
      const redirectUri = c.req.query("redirect_uri")
      const state = c.req.query("state")

      if (!redirectUri || !state) {
        return c.json({ error: "missing_params" }, 400)
      }

      const provider = getOAuthProvider(platform)
      if (!provider) {
        return c.json({ error: "unsupported_platform" }, 404)
      }

      if (!provider.clientId) {
        return c.json({ error: "missing_credentials" }, 500)
      }

      const params = new URLSearchParams({
        client_id: provider.clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: provider.scopes.join(" "),
        state,
        ...(provider.extraAuthParams ?? {}),
      })

      const authorizeUrl = `${provider.authUrl}?${params.toString()}`
      return c.redirect(authorizeUrl, 302)
    },
  }),

  registerApiRoute("/oauth/:platform/callback", {
    method: "POST",
    handler: async (c) => {
      const platform = c.req.param("platform")

      let body: { code?: string; redirectUri?: string }
      try {
        body = await c.req.json()
      } catch {
        return c.json({ success: false, error: "invalid_json" }, 400)
      }

      const { code, redirectUri } = body

      if (!code || !redirectUri) {
        return c.json({ success: false, error: "missing_params" }, 400)
      }

      try {
        // 1. Exchange code for access token
        const tokens = await exchangeCodeForToken(platform, code, redirectUri)

        // 2. Verify token and extract userId
        const verification = await verifyAndGetUserId(
          platform as Platform,
          tokens.accessToken
        )

        if (!verification.valid) {
          return c.json(
            {
              success: false,
              platformId: platform,
              error: verification.error || "verification_failed",
            },
            400
          )
        }

        // 3. Return token + userId to frontend
        // The frontend will call linkSocialWorkflow to store the token and create the on-chain triple
        return c.json({
          success: true,
          platformId: platform,
          userId: verification.userId,
          username: verification.username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[OAuth.callback] ${platform}: ${message}`)
        return c.json(
          {
            success: false,
            platformId: platform,
            error: message,
          },
          500
        )
      }
    },
  }),
]
