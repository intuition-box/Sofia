import { getOAuthProvider } from "./config"

export interface TokenExchangeResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
}

/**
 * Exchange an OAuth authorization code for an access token.
 * Handles provider-specific quirks (Spotify basic auth, GitHub accept header, etc.)
 */
export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<TokenExchangeResult> {
  const provider = getOAuthProvider(platform)
  if (!provider) {
    throw new Error(`unsupported_platform: ${platform}`)
  }

  if (!provider.clientId || !provider.clientSecret) {
    throw new Error(`missing_credentials: ${platform}`)
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  })

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    ...(provider.tokenRequestHeaders ?? {}),
  }

  if (provider.useBasicAuthHeader) {
    const basic = Buffer.from(
      `${provider.clientId}:${provider.clientSecret}`
    ).toString("base64")
    headers["Authorization"] = `Basic ${basic}`
  } else {
    body.append("client_id", provider.clientId)
    body.append("client_secret", provider.clientSecret)
  }

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers,
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`token_exchange_failed: ${res.status} ${text}`)
  }

  const data = await res.json()

  if (!data.access_token) {
    throw new Error(
      `token_exchange_failed: no access_token in response: ${JSON.stringify(data)}`
    )
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  }
}
