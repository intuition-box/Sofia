# Wallet Bridge — Cross-Extension TX Duplication

**Status:** mitigated by user-level workaround. Proper fix proposed but not yet implemented.
**Discovered:** May 2026, while debugging duplicated certifications on mainnet.

## Symptom

When the user has **both the dev and the build version of the Sofia extension installed and enabled simultaneously** in Chrome (`DEV | Sofia BETA` + `Sofia BETA`), every wallet transaction fires **twice**:

- Two consecutive nonces (e.g. 2030, 2031)
- Identical `from`, identical amount
- The first TX usually succeeds, the second reverts on-chain (`MultiVault_AtomExists`, `MultiVault_TripleExists`, etc.)
- User sees N MetaMask popups for what should be 1 operation

Visible in:
- MetaMask transaction queue (`1 of 2`, `1 of 3` prompts where `1 of 1` is expected)
- Intuition portal activity feed (duplicate `deposited X TRUST` events on the same triple/atom)

Affects every wallet write path: cart certification, daily certification quest, vote, follow, redeem — anything that calls `walletClient.writeContract`.

## Root cause

The cause is **not** in the JS application code (sidepanel logs confirm each `writeContract` is called exactly once per operation). The duplication happens in the wallet bridge layer.

### Architecture recap

Communication chain when sidepanel issues a wallet RPC:

```
sidepanel
  ↓ chrome.tabs.sendMessage({type: "WALLET_REQUEST", ...})
walletRelay.ts (ISOLATED world content script, scoped per extension)
  ↓ window.postMessage({type: "SOFIA_WALLET_REQUEST", ...})
walletBridge.ts (MAIN world content script, scoped per page)
  ↓ provider.request({method: "eth_sendTransaction", ...})
MetaMask
```

### Why it doubles

`window.postMessage` is **page-scoped, not extension-scoped**. Every content script running in MAIN world on the page receives every postMessage. When two Sofia extensions are installed:

1. Extension A's `walletRelay` (ISOLATED, only sees A's `chrome.runtime` events) receives the WALLET_REQUEST and forwards it via `window.postMessage`.
2. **Both** Extension A's and Extension B's `walletBridge` (MAIN world) listen to `window.addEventListener("message", ...)`. Both receive the SOFIA_WALLET_REQUEST.
3. Each `walletBridge` calls `provider.request("eth_sendTransaction")` on its own MetaMask connection.
4. MetaMask shows two popups, the user signs both, two TXs hit the chain with consecutive nonces.

The current message protocol carries no extension identifier, so a `walletBridge` cannot distinguish "for me" vs "for the other Sofia install".

### Is this a regression from the monorepo refactor?

The wallet bridge code itself was **not modified** by the monorepo move (commit `a9be2f44`) — `git diff` shows it was a pure file rename, no logic change. The flaw has been latent in the design since the wallet bridge was introduced (`7aaab4d3 feat: add wallet-agnostic provider bridge`).

What may have changed: with the monorepo, the dev/build feedback loop is faster and more accessible, and team members are more likely to keep both extensions loaded for testing. Before, only one extension was typically active at a time, hiding the bug.

So: **not a code regression, but a workflow regression**. The monorepo enabled a usage pattern the bridge was never designed for.

## Current workaround (deployed)

Disable one of the two Sofia extensions at `chrome://extensions/` (toggle off) when testing the other. One click to switch.

## Recommended fix (not yet implemented)

Add an extension-id filter to the wallet bridge so the two installs can coexist.

### Option A — handshake at boot (preferred, no Plasmo internals)

1. `walletRelay` (ISOLATED, has access to `chrome.runtime.id`) sends a one-time handshake via `window.postMessage` at init:
   ```ts
   window.postMessage({ type: "SOFIA_BRIDGE_HANDSHAKE", extensionId: chrome.runtime.id }, location.origin)
   ```
2. `walletBridge` (MAIN) listens for handshakes. On the **first** handshake it receives, it stores the `extensionId` as its own. (Race-free in practice because the relay injects the bridge immediately, and the relay-and-bridge pair from the same extension fire in the same microtask.)
3. `walletRelay` tags every WALLET_REQUEST forwarding with its `extensionId`:
   ```ts
   window.postMessage({ type: "SOFIA_WALLET_REQUEST", requestId, method, params, extensionId: chrome.runtime.id }, "*")
   ```
4. `walletBridge` filters in `handleWalletRequest`:
   ```ts
   if (event.data.extensionId !== myExtensionId) return // not for me
   ```

Symmetric filter on the response side (`SOFIA_WALLET_RESPONSE` and `SOFIA_WALLET_EVENT`).

### Option B — read extension ID from script src

`document.currentScript?.src` at the top of `walletBridge.ts` typically returns `chrome-extension://<EXT_ID>/contents/walletBridge.js` when Plasmo injects via `<script src="...">`. Extract the ID:

```ts
const myExtensionId = (() => {
  const src = (document.currentScript as HTMLScriptElement | null)?.src ?? ""
  return src.match(/chrome-extension:\/\/([^/]+)/)?.[1] ?? ""
})()
```

Pros: no handshake, no race window. Cons: relies on Plasmo's injection method staying synchronous; brittle if Plasmo changes.

### Option C — namespaced message types

Each extension uses message types prefixed with its ID:
- `SOFIA_WALLET_REQUEST_<EXT_ID>` instead of `SOFIA_WALLET_REQUEST`

Bridge listens only to its own typed channel. Same outcome as A/B, no shared listener at all.

## Test plan after fix

With both `DEV | Sofia BETA` and `Sofia BETA` enabled in `chrome://extensions/`:
1. Open the side panel of one extension only.
2. Add an item to cart, click Submit.
3. **Expect:** exactly the right number of MetaMask popups (no duplication).
4. Repeat from the other extension's side panel — same expectation.
5. Verify on Intuition portal that there are no duplicated deposit events on the same triple.
6. Verify no failed TXs (no `AtomExists` / `TripleExists` reverts caused by duplication).

## Related code

- [contents/walletBridge.ts](../contents/walletBridge.ts) — MAIN world, message handler
- [contents/walletRelay.ts](../contents/walletRelay.ts) — ISOLATED world, relay
- [lib/services/walletProvider.ts](../lib/services/walletProvider.ts) — sidepanel side, sends WALLET_REQUEST

## Already shipped (palliative)

- `walletBridge.ts` removes the previous handler before registering (`window.__sofiaWalletBridgeHandler`). Protects against same-extension hot-reload listener accumulation but **does not** address cross-extension duplication.
- `walletRelay.ts` uses a `globalThis` singleton flag to prevent double init in the same context.
