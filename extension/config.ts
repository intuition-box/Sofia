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

// Get URL from Vite environment variable
// Falls back to localhost if variable is not defined
export const SOFIA_SERVER_URL = import.meta.env.VITE_SOFIA_SERVER_URL || "http://localhost:3000"

// Log the URL being used (useful for debugging)
console.log(`[Sofia Config] Using server URL: ${SOFIA_SERVER_URL}`)
