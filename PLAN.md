# Plan d'Action - Proof of Human Attestor

## Vue d'Ensemble

Créer un système d'attestation "Proof of Human" qui :
1. Vérifie que l'utilisateur a connecté 5 plateformes OAuth
2. Crée un triple on-chain `[I] [is_human] [verified]`
3. Le BOT paie les gas (gratuit pour l'utilisateur)

**Solution choisie** : Ajouter un Tool Mastra sur ta machine TEE Phala existante.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────┐                                                           │
│  │  EXTENSION   │  1. User clique "Claim Humanity"                          │
│  │              │  2. Récupère les 5 tokens OAuth du storage                │
│  │  5 tokens    │  3. POST vers Mastra API                                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         │  POST /api/tools/human-attestor                                   │
│         │  { walletAddress, tokens: { youtube, spotify, discord,            │
│         │    twitch, twitter } }                                            │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  MASTRA (TEE Phala) - sofia-mastra                           │           │
│  │                                                               │           │
│  │  human-attestor Tool (PAS d'IA, juste du code)               │           │
│  │                                                               │           │
│  │  1. Vérifie chaque token auprès de l'API                     │           │
│  │     - YouTube  → googleapis.com/oauth2/v3/userinfo           │           │
│  │     - Spotify  → api.spotify.com/v1/me                       │           │
│  │     - Discord  → discord.com/api/users/@me                   │           │
│  │     - Twitch   → api.twitch.tv/helix/users                   │           │
│  │     - Twitter  → token présent = valide                      │           │
│  │                                                               │           │
│  │  2. Si 5/5 OK:                                               │           │
│  │     - BOT_PRIVATE_KEY signe la TX (sécurisé dans TEE)        │           │
│  │     - Appelle Sofia Proxy → createTriples()                  │           │
│  │     - receiver = userWalletAddress                           │           │
│  │                                                               │           │
│  │  3. Retourne { success, txHash }                             │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  SOFIA PROXY FEE CONTRACT                                     │           │
│  │  - Bot paie les gas + fees                                   │           │
│  │  - Forward à Intuition MultiVault                            │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  INTUITION MULTIVAULT                                         │           │
│  │  - Crée le triple [I] [is_human] [verified]                  │           │
│  │  - USER reçoit les shares (gratuit pour lui!)                │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │  EXTENSION   │  4. Reçoit { success: true, txHash }                      │
│  │              │  5. Marque la quest comme complétée                       │
│  │  Badge 🏆    │  6. Affiche le badge doré sur l'avatar                    │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Avantages de cette architecture

| Aspect | Bénéfice |
|--------|----------|
| **Sécurité** | BOT_PRIVATE_KEY dans TEE (personne ne peut le voir) |
| **Simplicité** | Pas de nouveau serveur, utilise Mastra existant |
| **UX** | Gratuit pour l'utilisateur (bot paie) |
| **Pas d'IA** | C'est juste un Tool, pas besoin de LLM |

---

## Fichiers à Créer/Modifier

### 1. Mastra - Nouveau Tool

| Fichier | Action | Description |
|---------|--------|-------------|
| `sofia-mastra/src/mastra/tools/human-attestor.ts` | **CRÉER** | Tool de vérification + attestation |
| `sofia-mastra/src/mastra/index.ts` | **MODIFIER** | Enregistrer le tool |
| `sofia-mastra/.env` | **MODIFIER** | Ajouter BOT_PRIVATE_KEY, SOFIA_PROXY_ADDRESS |

### 2. Extension - Hook et UI

| Fichier | Action | Description |
|---------|--------|-------------|
| `extension/hooks/useClaimHumanity.ts` | **MODIFIER** | Appeler Mastra API |
| `extension/components/pages/profile-tabs/AccountTab.tsx` | **MODIFIER** | Bouton "Claim Humanity" |
| `extension/components/styles/AccountTab.css` | **MODIFIER** | Style du bouton |
| `extension/hooks/useQuestSystem.ts` | ✅ **FAIT** | Quest proof-of-human ajoutée |

---

## Implémentation Détaillée

### Phase 1 : Mastra Tool

**Fichier** : `sofia-mastra/src/mastra/tools/human-attestor.ts`

```typescript
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { ethers } from 'ethers';

// Schema d'entrée
const inputSchema = z.object({
  walletAddress: z.string(),
  tokens: z.object({
    youtube: z.string().optional(),
    spotify: z.string().optional(),
    discord: z.string().optional(),
    twitch: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

// Fonctions de vérification
async function verifyYouTubeToken(token: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

async function verifySpotifyToken(token: string) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

async function verifyDiscordToken(token: string) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

async function verifyTwitchToken(token: string) {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!
    }
  });
  return res.ok;
}

// Tool Mastra
export const humanAttestorTool = createTool({
  id: 'human-attestor',
  description: 'Verify OAuth tokens and create human attestation on-chain',
  inputSchema,

  execute: async ({ context }) => {
    const { walletAddress, tokens } = context;

    // 1. Vérifier les 5 tokens en parallèle
    const [youtube, spotify, discord, twitch, twitter] = await Promise.all([
      tokens.youtube ? verifyYouTubeToken(tokens.youtube) : false,
      tokens.spotify ? verifySpotifyToken(tokens.spotify) : false,
      tokens.discord ? verifyDiscordToken(tokens.discord) : false,
      tokens.twitch ? verifyTwitchToken(tokens.twitch) : false,
      !!tokens.twitter, // Twitter: token présent = valide
    ]);

    const verified = { youtube, spotify, discord, twitch, twitter };
    const verifiedCount = Object.values(verified).filter(Boolean).length;

    console.log(`[HumanAttestor] Verified ${verifiedCount}/5 for ${walletAddress}`);

    // 2. Si pas 5/5, retourner erreur
    if (verifiedCount < 5) {
      return {
        success: false,
        verified,
        verifiedCount,
        error: `Only ${verifiedCount}/5 platforms verified`,
      };
    }

    // 3. Créer l'attestation on-chain
    try {
      const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
      const botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY!, provider);

      // ABI minimal pour createTriples
      const sofiaProxyAbi = [
        'function createTriples(address receiver, bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets, uint256 curveId) payable returns (bytes32[])',
        'function getTripleCost() view returns (uint256)',
      ];

      const sofiaProxy = new ethers.Contract(
        process.env.SOFIA_PROXY_ADDRESS!,
        sofiaProxyAbi,
        botWallet
      );

      // IDs des atoms (à configurer)
      const subjectId = process.env.ATOM_ID_I!;           // "I"
      const predicateId = process.env.ATOM_ID_IS_HUMAN!;  // "is_human"
      const objectId = process.env.ATOM_ID_VERIFIED!;     // "verified"

      // Calculer le coût
      const tripleCost = await sofiaProxy.getTripleCost();
      const depositAmount = ethers.parseEther('0.001');
      const totalCost = tripleCost + depositAmount;

      // Créer le triple
      const tx = await sofiaProxy.createTriples(
        walletAddress,  // receiver = user
        [subjectId],
        [predicateId],
        [objectId],
        [depositAmount],
        1n,  // curveId
        { value: totalCost }
      );

      const receipt = await tx.wait();

      console.log(`[HumanAttestor] TX confirmed: ${tx.hash}`);

      return {
        success: true,
        verified,
        verifiedCount,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };

    } catch (error) {
      console.error('[HumanAttestor] TX error:', error);
      return {
        success: false,
        verified,
        verifiedCount,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  },
});
```

### Phase 2 : Enregistrer le Tool dans Mastra

**Fichier** : `sofia-mastra/src/mastra/index.ts`

```typescript
import { humanAttestorTool } from './tools/human-attestor';

export const mastra = new Mastra({
  // ... config existante
  tools: { humanAttestorTool },  // Ajouter cette ligne
});
```

### Phase 3 : Variables d'environnement

**Fichier** : `sofia-mastra/.env`

```env
# Ajouter ces variables
BOT_PRIVATE_KEY=0x...              # Clé privée du bot attestor
SOFIA_PROXY_ADDRESS=0x...          # Adresse du Sofia Proxy Fee
RPC_ENDPOINT=https://testnet.rpc.intuition.systems
TWITCH_CLIENT_ID=...               # Pour vérifier les tokens Twitch

# Atom IDs (à récupérer sur Intuition)
ATOM_ID_I=0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b
ATOM_ID_IS_HUMAN=0x...             # À créer ou récupérer
ATOM_ID_VERIFIED=0x...             # À créer ou récupérer
```

### Phase 4 : Extension - useClaimHumanity

**Fichier** : `extension/hooks/useClaimHumanity.ts`

```typescript
const MASTRA_API_URL = process.env.PLASMO_PUBLIC_MASTRA_URL || 'https://mastra.sofia.xyz';

export const useClaimHumanity = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const { walletAddress } = useWalletFromStorage();

  const claimHumanity = async () => {
    setIsClaiming(true);

    try {
      // 1. Récupérer les 5 tokens
      const result = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_discord',
        'oauth_token_twitch',
        'oauth_token_twitter',
      ]);

      // 2. Appeler Mastra Tool
      const response = await fetch(`${MASTRA_API_URL}/api/tools/human-attestor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          tokens: {
            youtube: result.oauth_token_youtube,
            spotify: result.oauth_token_spotify,
            discord: result.oauth_token_discord,
            twitch: result.oauth_token_twitch,
            twitter: result.oauth_token_twitter,
          }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Attestation failed');
      }

      // 3. Stocker l'attestation
      await chrome.storage.local.set({
        human_attestation: {
          txHash: data.txHash,
          claimedAt: Date.now(),
          walletAddress,
        }
      });

      return data;

    } finally {
      setIsClaiming(false);
    }
  };

  return { claimHumanity, isClaiming };
};
```

### Phase 5 : Bouton dans AccountTab

**Fichier** : `extension/components/pages/profile-tabs/AccountTab.tsx`

Ajouter dans la section quests :

```tsx
{quest.id === 'proof-of-human' && quest.claimable && (
  <button
    className="claim-humanity-button"
    onClick={async () => {
      const result = await claimHumanity();
      if (result.success) {
        markQuestCompleted('proof-of-human');
      }
    }}
    disabled={isClaiming}
  >
    {isClaiming ? 'Claiming...' : '🧬 Claim Humanity'}
  </button>
)}
```

---

## Ordre d'Implémentation

### Étape 1 : Mastra Tool
- [ ] Créer `sofia-mastra/src/mastra/tools/human-attestor.ts`
- [ ] Modifier `sofia-mastra/src/mastra/index.ts` pour enregistrer le tool
- [ ] Ajouter les variables d'environnement
- [ ] Tester localement avec `mastra dev`

### Étape 2 : Extension
- [ ] Modifier `useClaimHumanity.ts`
- [ ] Ajouter le bouton dans `AccountTab.tsx`
- [ ] Ajouter les styles CSS
- [ ] Tester le flux complet

### Étape 3 : Déploiement
- [ ] Déployer Mastra sur Phala
- [ ] Financer le bot wallet
- [ ] Tester en production

### Étape 4 : Badge Visuel (optionnel)
- [ ] Cercle doré autour de l'avatar
- [ ] Badge "✓ Human"

---

## Sécurité

| Aspect | Protection |
|--------|------------|
| **Clé privée** | Stockée dans TEE Phala (inaccessible) |
| **Tokens OAuth** | Vérifiés auprès des APIs officielles |
| **Rate limiting** | 1 attestation par wallet (vérifier on-chain si existe déjà) |
| **CORS** | Restreindre aux origines autorisées |

---

## Coûts

- **Gas** : ~0.001-0.01 TRUST par attestation (payé par le bot)
- **Hosting** : Déjà inclus dans Phala (sofia-mastra existant)

---

## Résumé

```
User connecte 5 OAuth → Clique "Claim" → Mastra vérifie → Bot crée TX → Badge 🏆
                                              ↑
                                        TEE sécurisé
                                        Gratuit pour user
```
