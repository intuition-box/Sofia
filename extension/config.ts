/**
 * Centralized configuration for Sofia extension
 *
 * Server URL is defined via environment variables:
 * - .env.development: http://localhost:3000
 * - .env.production: https://sofia-agent.intuition.box
 *
 * To switch environments:
 * - Development: pnpm dev (uses .env.development)
 * - Production: pnpm build (uses .env.production)
 */

// Get URL from Plasmo environment variable
// Falls back to localhost if variable is not defined
export const SOFIA_SERVER_URL = process.env.PLASMO_PUBLIC_SOFIA_SERVER_URL || "http://localhost:3000"

// Mastra API URL for SofIA agents (HTTP REST)
export const MASTRA_API_URL = process.env.PLASMO_PUBLIC_MASTRA_URL || "http://localhost:4111"

// Log the URLs being used (useful for debugging)
console.log(`[Sofia Config] Using server URL: ${SOFIA_SERVER_URL}`)
console.log(`[Sofia Config] Using Mastra API URL: ${MASTRA_API_URL}`)
