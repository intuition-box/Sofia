---

slug: logbook-19-12

title: Logbook 19/12

authors: [Samuel, Maxime]

---

This week was dedicated to core infrastructure migration, authentication hardening, and on-chain verification foundations. We completed the migration of the extension authentication system to Privy, removing internal session wallets in favor of a secure external HTTPS flow. In parallel, the stack was fully migrated from ElizaOS to Mastra, improving modularity, performance, and agent orchestration while simplifying networking through an HTTP-based architecture. OAuth flows were secured via an external landing page backed by Cloudflare Workers, and the first version of our on-chain Proof of Human attestation system was implemented with gas abstraction for users.

<!-- truncate -->

## Privy Authentication Migration

Migration of the extension authentication system to Privy:

- Integration of PrivyProvider with Wagmi
- External redirection to Sofia's website for authentication (HTTPS context required)
- Authentication flow: Extension → External Auth Page → Privy Auth → Wallet Connected → Return to Extension

## MCP Server Integration + Loader

Chatbot connectivity and UX improvements:

- Connection of the chatbot to the Intuition MCP Server
- Sofia logo animation implemented as a loading state
- Extension of the Trust / Distrust system with new predicates

## ElizaOS → Mastra Migration

Complete migration of the chatbot stack:

- Mastra framework setup with GaiaNet as LLM provider
- MCP integration for GraphQL queries
- Messaging migration from WebSocket → HTTP
- Deployment on Phala TEE
- Release v0.1.2 with Mastra fully enabled

## OAuth Landing Page

Security-focused OAuth refactor:

- Migration of OAuth logic to an external landing page
- Implementation of sofia-api on Cloudflare Workers for secure token exchange
- OAuth support for YouTube, Spotify, Discord, Twitter, Twitch
- Client secrets stored securely in Cloudflare

## Proof of Human System

Initial implementation of an on-chain Proof of Human attestation flow:

- "Proof of Human" quest unlocked after connecting all 5 OAuth platforms
- Attestation logic implemented as a Mastra Tool running on Phala TEE
- Gas abstraction: the bot pays transaction fees, free for users
- On-chain triple created: [I] → [am_human] → [verified]

### UI updates

- Gold "Claim Humanity" button
- Verified Human badge after claim
