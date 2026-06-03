---
title: Privacy Policy
description: How the Sofia browser extension collects, uses, stores, and protects your data.
---

_Last updated: June 3, 2026_

Sofia is a browser extension that helps you turn your browsing into a
portable, self-owned reputation on the Intuition protocol. We built it
privacy-first: most of your data never leaves your browser, and nothing is
ever published on-chain without an explicit action from you. This policy
explains exactly what we process, why, and the control you keep over it.

## Who we are

Sofia is developed by the Sofia team (part of the Intuition ecosystem). This
policy covers the Sofia browser extension and the backend services it relies
on for on-chain interactions.

## Data we process

**Browsing activity (stored locally).** When tracking is enabled, the
extension records the URLs you visit, page titles, favicons, and visit
timestamps. This is kept **locally in your browser** (IndexedDB and the
extension's storage) so you can review your activity and choose which pages
to certify on-chain. The extension filters out sensitive
destinations: a large blocklist of URL/domain patterns is excluded and
sensitive query parameters are stripped before anything is stored.

**Wallet and on-chain identity.** When you connect a wallet, your **public
wallet address** is used to read and write on the Intuition protocol. Any
certification you create (a page you mark, a trust/distrust signal, a stake)
is a public, permanent blockchain transaction that you trigger yourself.

**Account information.** Authentication is handled by our provider (Privy).
We receive the basic identifiers needed to sign you in (e.g. a wallet
address, and — if you choose them — an email or Google account identifier).

**Optional connected accounts.** If you choose to connect an external
platform, the access token needed to read your **public** activity there is
stored securely by our backend solely to compute your reputation signals.
This is always optional and initiated by you.

**Local app data.** Settings, bookmarks, search history, and your in-app Gold
balance are stored locally in your browser and are not sold or shared.

## How we use your data

- To provide the core features: keeping a local record of your browsing so
  you can review it and certify pages on-chain, and building your reputation.
- To carry out the on-chain actions you explicitly request.
- To keep the extension working and secure.

We **do not sell your data**, and we **do not use it for advertising**.

## Who we share data with

We share data only as needed to provide the service:

- **Intuition protocol** (public blockchain and its indexer) — for the
  on-chain data you explicitly create.
- **IPFS** — metadata for atoms you create is pinned to a public,
  decentralized network.
- **Privy** — for authentication.

Data published on-chain or to IPFS is, by design, **public and permanent**.
You decide what to publish; the rest stays local.

## Storage and retention

- **Local data** lives in your browser and remains until you clear it, disable
  tracking, or uninstall the extension.
- **On-chain and IPFS data** is public and permanent by nature — it cannot be
  deleted once published.

## Your choices and controls

- **Disable tracking at any time** from the extension settings.
- **Clear your local data** at any time, or remove everything by uninstalling
  the extension.
- **Nothing is published on-chain without your explicit action** — you choose
  what to certify, with whom, and for what purpose.
- Connecting an external account is always optional and reversible.

## Security

We minimize what we collect and protect it in transit and at rest where
applicable. Sensitive URLs and parameters are filtered before storage, the
wallet provider is isolated from page content, and external origins are
validated.

## Children

Sofia is not directed to children and is not intended for use by anyone under
the age required to hold a digital wallet in their jurisdiction.

## Changes to this policy

We may update this policy as the product evolves. Material changes will be
reflected here with a new "Last updated" date.

## Contact

Questions about privacy or your data? Reach us through the
[Sofia Discord](https://discord.gg/sofia3) or open an issue on
[GitHub](https://github.com/intuition-box).
