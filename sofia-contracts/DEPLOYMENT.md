# SofiaFeeProxy - Guide de Déploiement

## Résumé

Le **SofiaFeeProxy** est un contrat proxy qui se place entre l'extension Sofia et le MultiVault d'Intuition. Il collecte des fees sur chaque transaction avant de forwarder au MultiVault.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Extension      │────▶│  SofiaFeeProxy   │────▶│   MultiVault    │
│  Sofia          │     │  (collecte fees) │     │   (Intuition)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Gnosis Safe    │
                        │  (fees Sofia)   │
                        └─────────────────┘
```

---

## Configuration des Fees

### Production (Intuition Mainnet)

| Type d'opération | Fee Fixe | Fee % | Exemple |
|------------------|----------|-------|---------|
| Création Atom | 0.1 TRUST | 0% | 0.1 TRUST |
| Création Triple | 0.1 TRUST | 0% | 0.1 TRUST |
| Deposit | 0.1 TRUST | 2% | 0.1 + 2% du montant |

### Local (Hardhat)

| Type d'opération | Fee Fixe | Fee % |
|------------------|----------|-------|
| Création | 0.001 ETH | 0% |
| Deposit | 0.001 ETH | 2% |

---

## Adresses Importantes

### Production

| Composant | Adresse |
|-----------|---------|
| MultiVault (Intuition) | `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` |
| Gnosis Safe (Fee Recipient) | `0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD` |
| SofiaFeeProxy | **À déployer** |

### Local (Hardhat)

| Composant | Adresse |
|-----------|---------|
| MockMultiVault | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| SofiaFeeProxy | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |

---

## Déploiement

### Prérequis

1. **Node.js** v18+
2. **Clé privée** avec du TRUST pour les gas fees
3. **3 adresses admin** pour la gestion des fees

### Configuration `.env`

```env
# Clé privée du deployer
PRIVATE_KEY=0x...

# Admins (peuvent modifier les fees)
ADMIN_1=0x...
ADMIN_2=0x...
ADMIN_3=0x...

# RPC (optionnel)
INTUITION_RPC_URL=https://rpc.intuition.systems
```

### Commandes

```bash
# Installation
cd sofia-contracts
npm install

# Compilation
npm run compile

# Tests
npm test

# Déploiement Local
npm run node                    # Terminal 1: Lancer Hardhat node
npm run deploy:local            # Terminal 2: Déployer MockMultiVault + Proxy

# Déploiement Production
npx hardhat run scripts/deploy.ts --network intuition
```

---

## Intégration Extension

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `chainConfig.prod.ts` | Ajouter `SOFIA_PROXY_ADDRESS` |
| `chainConfig.local.ts` | Adresses locales |
| `chainConfig.ts` | Sélecteur de config |
| `blockchainService.ts` | Toutes les writes passent par le proxy |
| `useCreateAtom.ts` | Utilise `getTotalCreationCost()` |
| `useCreateTripleOnChain.ts` | Utilise `getTotalCreationCost()` |
| `useWeightOnChain.ts` | Utilise `getTotalDepositCost()` |

### Après déploiement

1. Copier l'adresse du SofiaFeeProxy déployé
2. Mettre à jour `chainConfig.prod.ts` :

```typescript
export const SOFIA_PROXY_ADDRESS = "0x...adresse_deployée..."
```

3. Build l'extension :

```bash
cd extension
pnpm build
```

---

## Fonctions du Contrat

### Write (payable)

| Fonction | Description |
|----------|-------------|
| `createAtoms(bytes[], uint256[])` | Créer des atoms |
| `createTriples(bytes32[], bytes32[], bytes32[], uint256[])` | Créer des triples |
| `deposit(address, bytes32, uint256, uint256)` | Déposer sur un vault |
| `depositBatch(...)` | Batch deposits |

### View (helpers)

| Fonction | Description |
|----------|-------------|
| `getTotalCreationCost(count, multiVaultCost)` | Coût total création |
| `getTotalDepositCost(depositAmount)` | Coût total deposit |
| `calculateCreationFee(count)` | Fee Sofia pour création |
| `calculateDepositFee(amount)` | Fee Sofia pour deposit |

### Admin (onlyWhitelistedAdmin)

| Fonction | Description |
|----------|-------------|
| `setCreationFixedFee(uint256)` | Modifier fee création |
| `setDepositFixedFee(uint256)` | Modifier fee deposit fixe |
| `setDepositPercentageFee(uint256)` | Modifier fee deposit % |
| `setFeeRecipient(address)` | Changer Gnosis Safe |
| `setWhitelistedAdmin(address, bool)` | Gérer admins |

---

## Sécurité

### Points clés

- **Pas de fonds stockés** : Tout est forwardé immédiatement
- **Redeem direct** : Les retraits vont directement au MultiVault (pas de fee)
- **3 admins requis** : Séparation des pouvoirs
- **Pas d'upgradeability** : Simplicité, si bug on redéploie

### Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Bug dans le proxy | Redéployer et changer l'adresse dans l'extension |
| Admin compromis | 3 admins distincts avec hardware wallets |
| Gnosis Safe incorrect | Vérifier avant déploiement |

---

## Test Local

### Workflow complet

```bash
# Terminal 1: Hardhat node
cd sofia-contracts
npm run node

# Terminal 2: Déployer
npm run deploy:local
# Note les adresses affichées

# Terminal 3: Monitor events
PROXY_ADDRESS=0x... npx hardhat run scripts/monitor-events.ts --network localhost

# Terminal 4: Extension
cd extension
rm -rf .plasmo build
PLASMO_PUBLIC_NETWORK=local pnpm dev

# Financer le compte MetaMask
npx hardhat run scripts/fund-account.ts --network localhost
```

### Vérification

Les logs du monitor doivent afficher :
- `FEES COLLECTED` avec le montant Sofia
- `TRANSACTION FORWARDED` avec le breakdown
- `MULTIVAULT OPERATION SUCCESS`

---

## Changelog

### v1.0.0
- Déploiement initial
- Fees : 0.1 TRUST fixe + 2% deposits
- Support : createAtoms, createTriples, deposit, depositBatch
