# @sofia/contracts — ⚠ ARCHIVED v1 (kept for v2 future)

**Status (2026-05-15) : ARCHIVED — non déployé en v1.**

Voir [D-017 dans decision log](../../docs/tns/00-decision-log.md) pour le contexte.

## Pourquoi ce code est gardé sans être utilisé

L'architecture **v1 de Sofia Circles** utilise un backend avec hot wallet (`setApprovalForAll` depuis le Safe) pour minter les sous-domaines `<name>.circles.trust`. Pas de contract Solidity déployé en v1.

Ce dossier contient le **scaffold complet** d'un `CirclesFactory.sol` qui serait utilisé en v2 pour décentraliser le minting (l'user signe et paye lui-même). Il est conservé pour :

1. **Migration v2 facilitée** : le code est déjà écrit (skeleton, interfaces, NatSpec, tests Hardhat config, CI). Migration estimée ~2 semaines au lieu de 3-4.
2. **Référence d'architecture** : la spec [03-contract-spec.md](../../docs/tns/03-contract-spec.md) reste valide.
3. **Pas de duplication d'effort** si on revient sur la décision plus tard.

## Migration v1 → v2 (futur)

Quand on décide de migrer :

1. Compléter l'implémentation (Phase 2 du plan original)
2. Internal review sévère (Phase 3)
3. Deploy testnet + validation
4. Sur mainnet :
   - Safe `setApprovalForAll(hotWallet, false)` (révoque le backend)
   - Deploy `CirclesFactory` mainnet
   - Safe `setApprovalForAll(circlesFactory, true)` (approve le contract)
   - Update Explorer pour appeler le contract au lieu de l'API backend

**Les noms déjà mintés restent valides** (subdomain owner = proxy address, pas le hot wallet).

## Stack (si tu veux compiler le scaffold)

- Solidity 0.8.28
- OpenZeppelin v5
- Hardhat 2.19+
- TypeChain ethers-v6

```bash
bun --filter @sofia/contracts compile
bun --filter @sofia/contracts test  # vide en v1, à remplir si migration v2
```

## Fichiers

```
src/
├── CirclesFactory.sol            # Skeleton avec NatSpec, storage, governance, stubs
└── interfaces/
    ├── ITNSRegistry.sol
    ├── IIntuitionFeeProxyFactory.sol
    └── IIntuitionVersionedFeeProxy.sol
```

Pour le détail de la spec : [03-contract-spec.md](../../docs/tns/03-contract-spec.md).
