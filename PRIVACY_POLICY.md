# Privacy Policy for Sofia BETA

**Last updated: December 2, 2024**

## Overview

Sofia is a browser extension that transforms your browsing activity into structured knowledge on the blockchain. This privacy policy explains how we collect, use, and protect your data.

## Data Collection

Sofia collects the following data, stored **locally** on your device:

### Browsing Data (when tracking is enabled)
- Page URLs and titles
- Browsing patterns and timestamps
- Page metadata (favicon, description)

### Wallet Information
- Ethereum wallet address (via MetaMask connection)
- On-chain transaction history related to Sofia signals

### OAuth Tokens (optional)
- Authentication tokens for connected platforms (YouTube, Spotify, Twitch)
- Used only to enrich your profile, stored locally

## Data Storage

**All data is stored locally** in Chrome's extension storage on your device. Sofia does not maintain external servers that store your personal browsing data.

## Data Sharing

Sofia only transmits data in the following cases:

1. **Intuition Blockchain (Base Sepolia)**: When you explicitly choose to publish signals (triplets), the signal content is written to the public blockchain. This is a user-initiated action.

2. **Local AI Services**: Sofia communicates with local AI services running on your machine (localhost:8080, localhost:11434) for on-device browsing analysis. No data is sent to external AI servers.

3. **IPFS**: Metadata for published signals may be stored on IPFS, a decentralized storage network.

## User Control

You have full control over your data:

- **Toggle Tracking**: Enable or disable browsing tracking at any time in Settings
- **Clear All Data**: Delete all local data, OAuth tokens, and connections via Settings
- **Disconnect Wallet**: Remove MetaMask connection at any time
- **Revoke OAuth**: Disconnect external platform connections individually

## Data Security

- All local data is encrypted using Chrome's built-in storage encryption
- Wallet interactions require explicit user approval via MetaMask
- No passwords or private keys are ever stored by Sofia

## Third-Party Services

Sofia integrates with:

- **MetaMask**: For Ethereum wallet connection and transaction signing
- **Intuition Protocol**: For on-chain knowledge graph interactions
- **OAuth Providers**: YouTube, Spotify, Twitch (optional, user-initiated)

## Children's Privacy

Sofia is not intended for use by children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date.

## Contact

For privacy concerns or questions, please contact us at:
- GitHub Issues: https://github.com/intuition-box/Sofia/issues

---

By using Sofia, you agree to this privacy policy.
