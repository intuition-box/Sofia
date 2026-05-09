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

(à compléter après les commits)
