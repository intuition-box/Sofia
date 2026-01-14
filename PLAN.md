# Plan d'Action - Proof of Human Attestor (Bot signe la TX)

## Vue d'Ensemble

Le workflow `human-attestor-workflow` va être modifié pour que le **bot verifie les tokens ET cree le triple on-chain lui-meme** avec ses propres fonds.

**Avantage** : Gratuit pour l'utilisateur, pas de signature requise de sa part.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────┐                                                           │
│  │  EXTENSION   │  1. User clique "Claim Humanity"                          │
│  │              │  2. Recupere les 5 tokens OAuth du storage                │
│  │  5 tokens    │  3. POST vers Mastra API workflow                         │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         │  POST /api/workflows/humanAttestorWorkflow/start-async            │
│         │  { walletAddress, tokens: { youtube, spotify, discord,            │
│         │    twitch, twitter } }                                            │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  MASTRA (TEE Phala) - sofia-mastra                           │           │
│  │                                                               │           │
│  │  human-attestor-workflow.ts                                  │           │
│  │                                                               │           │
│  │  1. Verifie chaque token aupres de l'API                     │           │
│  │     - YouTube  → googleapis.com/youtube/v3/channels          │           │
│  │     - Spotify  → api.spotify.com/v1/me                       │           │
│  │     - Discord  → discord.com/api/users/@me                   │           │
│  │     - Twitch   → api.twitch.tv/helix/users                   │           │
│  │     - Twitter  → api.twitter.com/2/users/me                  │           │
│  │                                                               │           │
│  │  2. Si 5/5 OK:                                               │           │
│  │     - Verifie si user atom existe (sinon le cree)            │           │
│  │     - Verifie si triple existe deja                          │           │
│  │     - BOT_PRIVATE_KEY signe la TX                            │           │
│  │     - Appelle DIRECTEMENT MultiVault (pas de proxy)          │           │
│  │     - receiver = userWalletAddress                           │           │
│  │                                                               │           │
│  │  3. Retourne { success, txHash, blockNumber }                │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  INTUITION MULTIVAULT (appel direct, pas de proxy)            │           │
│  │  - Bot paie le gas + deposit                                 │           │
│  │  - Cree le triple [user_wallet] [is_human] [verified]        │           │
│  │  - USER recoit les shares (gratuit pour lui!)                │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │  EXTENSION   │  4. Recoit { success: true, txHash }                      │
│  │              │  5. Stocke l'attestation localement                       │
│  │  Badge 🏆    │  6. Affiche le badge sur l'avatar                         │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fichier Principal a Modifier

### sofia-mastra/src/mastra/workflows/human-attestor-workflow.ts

**Modifications** :
- Ajouter viem pour interagir avec la blockchain
- Ajouter l'ABI MultiVault (PAS de Sofia proxy)
- Ajouter les constantes (adresses, term IDs)
- Apres verification 5/5, creer l'atom user si besoin, puis le triple

**Constantes necessaires** :
```typescript
import { createPublicClient, createWalletClient, http, parseEther, stringToHex, keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Adresse MultiVault (appel direct, pas de proxy)
const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e' as const;
const RPC_URL = 'https://rpc.intuition.systems';

// Term IDs pre-existants pour [user] [is_human] [verified]
const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248' as const;
const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c' as const;

// Deposit minimum
const MIN_DEPOSIT = 10000000000000000n; // 0.01 TRUST
const CURVE_ID = 1n;
```

**Nouveau output schema** :
```typescript
const outputSchema = z.object({
  success: z.boolean(),
  verified: z.object({
    youtube: z.boolean(),
    spotify: z.boolean(),
    discord: z.boolean(),
    twitch: z.boolean(),
    twitter: z.boolean(),
  }),
  verifiedCount: z.number(),
  // Nouveau: infos de la TX
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  error: z.string().optional(),
});
```

**Logique a ajouter apres verification** :
```typescript
// Apres verification 5/5
if (verifiedCount === 5) {
  const botPrivateKey = process.env.BOT_PRIVATE_KEY;
  if (!botPrivateKey) {
    return { ...verified, error: 'BOT_PRIVATE_KEY not configured' };
  }

  // 1. Creer les clients viem
  const account = privateKeyToAccount(botPrivateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: intuitionChain,
    transport: http(RPC_URL)
  });
  const publicClient = createPublicClient({
    chain: intuitionChain,
    transport: http(RPC_URL)
  });

  // 2. Calculer l'atomId de l'utilisateur
  const userAtomData = stringToHex(walletAddress.toLowerCase());
  const userAtomId = keccak256(userAtomData);

  // 3. Verifier si l'atom existe, sinon le creer (appel DIRECT MultiVault)
  const atomExists = await checkAtomExists(publicClient, userAtomId);
  if (!atomExists) {
    const atomCost = await publicClient.readContract({
      address: MULTIVAULT_ADDRESS,
      abi: MultiVaultAbi,
      functionName: 'getAtomCost'
    });
    const createAtomHash = await walletClient.writeContract({
      address: MULTIVAULT_ADDRESS,
      abi: MultiVaultAbi,
      functionName: 'createAtom',
      args: [walletAddress, userAtomData],  // receiver, atomData
      value: atomCost + MIN_DEPOSIT
    });
    await publicClient.waitForTransactionReceipt({ hash: createAtomHash });
  }

  // 4. Verifier si le triple existe deja
  const tripleId = await publicClient.readContract({
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'calculateTripleId',
    args: [userAtomId, TERM_ID_IS_HUMAN, TERM_ID_VERIFIED]
  });

  const tripleData = await publicClient.readContract({
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'getTriple',
    args: [tripleId]
  });

  if (tripleData[0] !== '0x0000...') {
    return { success: true, verified, verifiedCount, error: 'Triple already exists' };
  }

  // 5. Calculer le cout total (DIRECT MultiVault, pas de fees proxy!)
  const tripleCost = await publicClient.readContract({
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'getTripleCost'
  });
  const totalCost = tripleCost + MIN_DEPOSIT;  // Pas de Sofia fees!

  // 6. Executer createTriple (appel DIRECT MultiVault)
  const txHash = await walletClient.writeContract({
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'createTriple',
    args: [
      walletAddress,           // receiver (l'utilisateur recoit les shares)
      userAtomId,              // subjectId
      TERM_ID_IS_HUMAN,        // predicateId
      TERM_ID_VERIFIED         // objectId
    ],
    value: totalCost
  });

  // 7. Attendre confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    success: true,
    verified,
    verifiedCount,
    txHash,
    blockNumber: Number(receipt.blockNumber)
  };
}
```

---

## Fichier Extension a Simplifier

### extension/hooks/useClaimHumanity.ts

**Simplifications** :
- Ne plus creer la TX cote extension
- Juste appeler le workflow et recuperer le txHash
- Stocker l'attestation avec le txHash retourne

```typescript
const claimHumanity = async () => {
  setIsClaiming(true);

  try {
    // Recuperer les tokens OAuth
    const tokenResult = await chrome.storage.local.get([...]);

    // Appeler le workflow Mastra (bot cree la TX)
    const response = await fetch(`${MASTRA_API_URL}/api/workflows/humanAttestorWorkflow/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: {
          walletAddress,
          tokens: { youtube, spotify, discord, twitch, twitter }
        }
      })
    });

    const result = await response.json();

    // Attendre le resultat
    const finalResult = await pollForResult(result.runId);

    if (finalResult.success && finalResult.txHash) {
      // Stocker l'attestation
      await chrome.storage.local.set({
        [HUMAN_ATTESTATION_KEY]: {
          txHash: finalResult.txHash,
          blockNumber: finalResult.blockNumber,
          walletAddress,
          claimedAt: Date.now()
        }
      });
      setIsHuman(true);
    }

    return finalResult;
  } finally {
    setIsClaiming(false);
  }
};
```

---

## Pre-requis

### 1. sofia-mastra/.env

Verifier que ces variables sont configurees :
```env
BOT_PRIVATE_KEY=0x...  # Cle privee du bot
TWITCH_CLIENT_ID=...   # Pour verifier les tokens Twitch
```

### 2. Fonds du Bot

Le bot doit avoir :
- ETH pour le gas
- TRUST pour les deposits (~0.01 TRUST par attestation)

Verifier avec :
```bash
cast balance <BOT_ADDRESS> --rpc-url https://rpc.intuition.systems
```

### 3. Approval du Proxy (une seule fois)

Le bot doit approuver le Sofia Proxy :
```bash
cd sofia-mastra && npx ts-node scripts/approve-proxy.ts
```

---

## ABIs Necessaires

Copier les ABIs depuis `extension/ABI/` ou les definir inline :

**SofiaFeeProxy** :
- `createTriples(address, bytes32[], bytes32[], bytes32[], uint256[], uint256) payable`
- `createAtoms(address, bytes[], uint256[], uint256) payable`
- `getTripleCost() view returns (uint256)`
- `getAtomCost() view returns (uint256)`

**MultiVault** :
- `calculateTripleId(bytes32, bytes32, bytes32) view returns (bytes32)`
- `getTriple(bytes32) view returns (bytes32, bytes32, bytes32)`
- `getAtom(bytes32) view returns (bytes)`

---

## Fonctions Utilitaires a Implementer

Tout dans le fichier workflow :

```typescript
// Verifier si un atom existe
async function checkAtomExists(
  publicClient: PublicClient,
  atomId: `0x${string}`
): Promise<boolean> {
  const atomData = await publicClient.readContract({
    address: MULTIVAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'getAtom',
    args: [atomId]
  });
  return atomData !== '0x';
}

// Calculer le cout total avec fees Sofia
async function getTotalCreationCost(
  publicClient: PublicClient,
  depositAmount: bigint
): Promise<bigint> {
  const tripleCost = await publicClient.readContract({
    address: SOFIA_PROXY_ADDRESS,
    abi: SofiaFeeProxyAbi,
    functionName: 'getTripleCost'
  });
  // Sofia fees: 0.1 TRUST fixed + 5% of deposit
  const sofiaFixedFee = parseEther('0.1');
  const sofiaPercentFee = (depositAmount * 5n) / 100n;
  return tripleCost + depositAmount + sofiaFixedFee + sofiaPercentFee;
}
```

---

## Tests

1. **Test local** :
   ```bash
   cd sofia-mastra && pnpm dev
   # Appeler le workflow avec curl ou Postman
   ```

2. **Verifier le triple on-chain** :
   - Via GraphQL Intuition
   - Ou via `cast call` sur le MultiVault

3. **Test E2E** :
   - Connecter 5 OAuth dans l'extension
   - Cliquer "Claim Humanity"
   - Verifier que le badge apparait

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Bot n'a plus de fonds | Alerter si balance < 0.1 ETH |
| Double attestation | Verifier si triple existe avant creation |
| Token OAuth expire pendant la TX | Verifier les 5 tokens AVANT de commencer la TX |
| TX echoue | Retourner l'erreur, user peut re-essayer |
| Bot rate limited | Ajouter un delay entre les attestations si besoin |

---

## Resume

```
User connecte 5 OAuth → Clique "Claim" → Mastra verifie → Bot cree atom + triple → Badge 🏆
                                              ↑
                                        BOT signe la TX
                                        Gratuit pour user
```
