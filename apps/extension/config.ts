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

import { createServiceLogger } from './lib/utils/logger'

const logger = createServiceLogger('Config')

// Mastra API URL for SofIA agents (HTTP REST)
export const MASTRA_API_URL = process.env.PLASMO_PUBLIC_MASTRA_URL || "http://localhost:4111"

logger.debug(`Using Mastra API URL: ${MASTRA_API_URL}`)
