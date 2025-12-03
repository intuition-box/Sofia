# Plan: Sofia Fee Proxy Contract

## Résumé
Créer un smart contract proxy qui prélève des fees sur toutes les transactions vers le MultiVault d'Intuition, avec une interface admin pour les whitelistés.

---

## Spécifications

### Fees Sofia (hybride comme MultiVault)

| Opération | Fee Fixe | Fee % |
|-----------|----------|-------|
| Création (atoms/triples) | 0.1 TRUST | 0% |
| Deposit (shares/upvotes) | 0.1 TRUST | 2% du montant |

**Exemple deposit de 10 TRUST avec 2% fee:**
- Fee fixe: 0.1 TRUST
- Fee %: 0.2 TRUST (2% de 10)
- Total fee Sofia: 0.3 TRUST
- User envoie: 10.3 TRUST
- Déposé au MultiVault: 10 TRUST

### Configuration
- **Multisig (Gnosis Safe)**: `0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD`
- **3 admins whitelistés**: peuvent modifier les fees uniquement
- **Open**: tous les utilisateurs peuvent appeler les fonctions de transaction
- **Pas de redeem**: sécurité MultiVault empêche le proxy

---

## Fonctions du MultiVault à wrapper

### Write (payable) - avec prélèvement de fees
| Fonction | Description |
|----------|-------------|
| `createAtoms(bytes[] data, uint256[] assets)` | Batch création atoms |
| `createTriples(bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets)` | Batch création triples |
| `deposit(address receiver, bytes32 termId, uint256 curveId, uint256 minShares, uint256 depositAmount)` | Deposit simple (signature modifiée) |
| `depositBatch(address receiver, bytes32[] termIds, uint256[] curveIds, uint256[] assets, uint256[] minShares)` | Batch deposits |

### View (passthrough sans fee)
| Fonction | Description |
|----------|-------------|
| `getAtomCost()` | Coût création atom |
| `getTripleCost()` | Coût création triple |
| `calculateAtomId(bytes data)` | Calcul ID atom |
| `calculateTripleId(bytes32 subjectId, bytes32 predicateId, bytes32 objectId)` | Calcul ID triple |
| `getTriple(bytes32 tripleId)` | Get triple data |
| `getShares(address account, bytes32 termId, uint256 curveId)` | Get user shares |
| `isTermCreated(bytes32 id)` | Check existence |
| `previewDeposit(bytes32 termId, uint256 curveId, uint256 assets)` | Preview deposit |

---

## Architecture du Projet

```
sofia-core/sofia-contracts/
├── src/
│   ├── SofiaFeeProxy.sol              # Contrat principal
│   ├── interfaces/
│   │   └── IEthMultiVault.sol         # Interface MultiVault (subset)
│   └── libraries/
│       └── Errors.sol                 # Custom errors
├── test/
│   └── SofiaFeeProxy.t.sol            # Tests Foundry
├── script/
│   └── Deploy.s.sol                   # Script de déploiement
├── foundry.toml                       # Config Foundry
├── package.json                       # Scripts npm
├── .gitignore
├── .env.example
└── README.md
```

---

## Implémentation Détaillée

### 1. Setup du projet

```bash
cd sofia-core
mkdir sofia-contracts && cd sofia-contracts
forge init --no-commit
npm init -y
```

### 2. Interface IEthMultiVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface IEthMultiVault {
    // Write functions
    function createAtoms(bytes[] calldata data, uint256[] calldata assets) external payable returns (bytes32[] memory);
    function createTriples(bytes32[] calldata subjectIds, bytes32[] calldata predicateIds, bytes32[] calldata objectIds, uint256[] calldata assets) external payable returns (bytes32[] memory);
    function deposit(address receiver, bytes32 termId, uint256 curveId, uint256 minShares) external payable returns (uint256);
    function depositBatch(address receiver, bytes32[] calldata termIds, uint256[] calldata curveIds, uint256[] calldata assets, uint256[] calldata minShares) external payable returns (uint256[] memory);

    // View functions
    function getAtomCost() external view returns (uint256);
    function getTripleCost() external view returns (uint256);
    function calculateAtomId(bytes calldata data) external pure returns (bytes32);
    function calculateTripleId(bytes32 subjectId, bytes32 predicateId, bytes32 objectId) external pure returns (bytes32);
    function getTriple(bytes32 tripleId) external view returns (bytes32, bytes32, bytes32);
    function getShares(address account, bytes32 termId, uint256 curveId) external view returns (uint256);
    function isTermCreated(bytes32 id) external view returns (bool);
    function previewDeposit(bytes32 termId, uint256 curveId, uint256 assets) external view returns (uint256, uint256);
}
```

### 3. Errors.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

library Errors {
    error SofiaFeeProxy_NotWhitelistedAdmin();
    error SofiaFeeProxy_InsufficientValue();
    error SofiaFeeProxy_InvalidMultisigAddress();
    error SofiaFeeProxy_InvalidMultiVaultAddress();
    error SofiaFeeProxy_TransferFailed();
    error SofiaFeeProxy_WrongArrayLengths();
    error SofiaFeeProxy_ZeroAddress();
}
```

### 4. SofiaFeeProxy.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IEthMultiVault} from "./interfaces/IEthMultiVault.sol";
import {Errors} from "./libraries/Errors.sol";

/// @title SofiaFeeProxy
/// @notice Proxy contract for MultiVault with fee collection for Sofia app
/// @author Sofia Team
contract SofiaFeeProxy {
    // ============ Storage ============

    IEthMultiVault public immutable ethMultiVault;
    address public feeRecipient;

    // Fee structure
    uint256 public creationFixedFee;      // 0.1 TRUST = 10^17 wei
    uint256 public depositFixedFee;       // 0.1 TRUST = 10^17 wei
    uint256 public depositPercentageFee;  // 200 = 2% (base 10000)
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(address => bool) public whitelistedAdmins;

    // ============ Events ============

    event FeeRecipientUpdated(address indexed newRecipient);
    event CreationFixedFeeUpdated(uint256 newFee);
    event DepositFixedFeeUpdated(uint256 newFee);
    event DepositPercentageFeeUpdated(uint256 newFee);
    event AdminWhitelistUpdated(address indexed admin, bool status);
    event FeesCollected(address indexed user, uint256 amount, string operation);

    // ============ Modifiers ============

    modifier onlyWhitelistedAdmin() {
        if (!whitelistedAdmins[msg.sender]) {
            revert Errors.SofiaFeeProxy_NotWhitelistedAdmin();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        address _ethMultiVault,
        address _feeRecipient,
        uint256 _creationFixedFee,
        uint256 _depositFixedFee,
        uint256 _depositPercentageFee,
        address[] memory _initialAdmins
    ) {
        if (_ethMultiVault == address(0)) revert Errors.SofiaFeeProxy_InvalidMultiVaultAddress();
        if (_feeRecipient == address(0)) revert Errors.SofiaFeeProxy_InvalidMultisigAddress();

        ethMultiVault = IEthMultiVault(_ethMultiVault);
        feeRecipient = _feeRecipient;
        creationFixedFee = _creationFixedFee;
        depositFixedFee = _depositFixedFee;
        depositPercentageFee = _depositPercentageFee;

        for (uint256 i = 0; i < _initialAdmins.length; i++) {
            if (_initialAdmins[i] != address(0)) {
                whitelistedAdmins[_initialAdmins[i]] = true;
                emit AdminWhitelistUpdated(_initialAdmins[i], true);
            }
        }
    }

    // ============ Fee Calculation ============

    /// @notice Calculate Sofia fee for a deposit
    function calculateDepositFee(uint256 depositAmount) public view returns (uint256) {
        uint256 percentageFee = (depositAmount * depositPercentageFee) / FEE_DENOMINATOR;
        return depositFixedFee + percentageFee;
    }

    /// @notice Calculate Sofia fee for creation operations
    function calculateCreationFee(uint256 count) public view returns (uint256) {
        return creationFixedFee * count;
    }

    /// @notice Helper for frontend - get total cost for deposit
    function getTotalDepositCost(uint256 depositAmount) external view returns (uint256) {
        return depositAmount + calculateDepositFee(depositAmount);
    }

    /// @notice Helper for frontend - get total cost for creation
    function getTotalCreationCost(uint256 count, uint256 multiVaultCost) external view returns (uint256) {
        return multiVaultCost + calculateCreationFee(count);
    }

    // ============ Admin Functions ============

    function setCreationFixedFee(uint256 newFee) external onlyWhitelistedAdmin {
        creationFixedFee = newFee;
        emit CreationFixedFeeUpdated(newFee);
    }

    function setDepositFixedFee(uint256 newFee) external onlyWhitelistedAdmin {
        depositFixedFee = newFee;
        emit DepositFixedFeeUpdated(newFee);
    }

    function setDepositPercentageFee(uint256 newFee) external onlyWhitelistedAdmin {
        depositPercentageFee = newFee;
        emit DepositPercentageFeeUpdated(newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyWhitelistedAdmin {
        if (newRecipient == address(0)) revert Errors.SofiaFeeProxy_ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function setWhitelistedAdmin(address admin, bool status) external onlyWhitelistedAdmin {
        if (admin == address(0)) revert Errors.SofiaFeeProxy_ZeroAddress();
        whitelistedAdmins[admin] = status;
        emit AdminWhitelistUpdated(admin, status);
    }

    // ============ Proxy Functions (Payable) ============

    /// @notice Create atoms with Sofia fee
    function createAtoms(bytes[] calldata data, uint256[] calldata assets)
        external payable returns (bytes32[] memory)
    {
        uint256 sofiaFee = calculateCreationFee(data.length);
        uint256 multiVaultCost = _sumArray(assets);

        if (msg.value < sofiaFee + multiVaultCost) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "createAtoms");

        return ethMultiVault.createAtoms{value: multiVaultCost}(data, assets);
    }

    /// @notice Create triples with Sofia fee
    function createTriples(
        bytes32[] calldata subjectIds,
        bytes32[] calldata predicateIds,
        bytes32[] calldata objectIds,
        uint256[] calldata assets
    ) external payable returns (bytes32[] memory) {
        uint256 sofiaFee = calculateCreationFee(subjectIds.length);
        uint256 multiVaultCost = _sumArray(assets);

        if (msg.value < sofiaFee + multiVaultCost) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "createTriples");

        return ethMultiVault.createTriples{value: multiVaultCost}(subjectIds, predicateIds, objectIds, assets);
    }

    /// @notice Deposit with Sofia fee (Option B: user specifies deposit amount)
    /// @param receiver Address receiving shares
    /// @param termId Vault ID (atom or triple)
    /// @param curveId Curve ID (1 or 2)
    /// @param minShares Minimum expected shares
    /// @param depositAmount Exact amount to deposit to MultiVault
    function deposit(
        address receiver,
        bytes32 termId,
        uint256 curveId,
        uint256 minShares,
        uint256 depositAmount
    ) external payable returns (uint256) {
        uint256 sofiaFee = calculateDepositFee(depositAmount);
        uint256 totalRequired = depositAmount + sofiaFee;

        if (msg.value < totalRequired) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "deposit");

        return ethMultiVault.deposit{value: depositAmount}(receiver, termId, curveId, minShares);
    }

    /// @notice Batch deposit with Sofia fees
    function depositBatch(
        address receiver,
        bytes32[] calldata termIds,
        uint256[] calldata curveIds,
        uint256[] calldata assets,
        uint256[] calldata minShares
    ) external payable returns (uint256[] memory) {
        if (termIds.length != assets.length) revert Errors.SofiaFeeProxy_WrongArrayLengths();

        uint256 totalDeposit = _sumArray(assets);
        uint256 sofiaFee = depositFixedFee * termIds.length + (totalDeposit * depositPercentageFee) / FEE_DENOMINATOR;
        uint256 totalRequired = totalDeposit + sofiaFee;

        if (msg.value < totalRequired) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "depositBatch");

        return ethMultiVault.depositBatch{value: totalDeposit}(receiver, termIds, curveIds, assets, minShares);
    }

    // ============ View Functions (Passthrough) ============

    function getAtomCost() external view returns (uint256) {
        return ethMultiVault.getAtomCost();
    }

    function getTripleCost() external view returns (uint256) {
        return ethMultiVault.getTripleCost();
    }

    function calculateAtomId(bytes calldata data) external pure returns (bytes32) {
        return keccak256(data);
    }

    function calculateTripleId(bytes32 subjectId, bytes32 predicateId, bytes32 objectId) external view returns (bytes32) {
        return ethMultiVault.calculateTripleId(subjectId, predicateId, objectId);
    }

    function getTriple(bytes32 tripleId) external view returns (bytes32, bytes32, bytes32) {
        return ethMultiVault.getTriple(tripleId);
    }

    function getShares(address account, bytes32 termId, uint256 curveId) external view returns (uint256) {
        return ethMultiVault.getShares(account, termId, curveId);
    }

    function isTermCreated(bytes32 id) external view returns (bool) {
        return ethMultiVault.isTermCreated(id);
    }

    function previewDeposit(bytes32 termId, uint256 curveId, uint256 assets) external view returns (uint256, uint256) {
        return ethMultiVault.previewDeposit(termId, curveId, assets);
    }

    // ============ Internal Functions ============

    function _transferFee(uint256 amount) internal {
        if (amount > 0) {
            (bool success, ) = feeRecipient.call{value: amount}("");
            if (!success) revert Errors.SofiaFeeProxy_TransferFailed();
        }
    }

    function _sumArray(uint256[] calldata arr) internal pure returns (uint256 sum) {
        for (uint256 i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
    }
}
```

---

## Tests Foundry

### test/SofiaFeeProxy.t.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/SofiaFeeProxy.sol";
import "../src/interfaces/IEthMultiVault.sol";

contract SofiaFeeProxyTest is Test {
    SofiaFeeProxy public proxy;
    address public multisig = address(0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD);
    address public multiVault;
    address public admin1 = address(0x1);
    address public admin2 = address(0x2);
    address public admin3 = address(0x3);
    address public user = address(0x4);

    uint256 constant CREATION_FEE = 0.1 ether;
    uint256 constant DEPOSIT_FEE = 0.1 ether;
    uint256 constant DEPOSIT_PERCENTAGE = 200; // 2%

    function setUp() public {
        // Fork mainnet or use mock
        multiVault = address(new MockMultiVault());

        address[] memory admins = new address[](3);
        admins[0] = admin1;
        admins[1] = admin2;
        admins[2] = admin3;

        proxy = new SofiaFeeProxy(
            multiVault,
            multisig,
            CREATION_FEE,
            DEPOSIT_FEE,
            DEPOSIT_PERCENTAGE,
            admins
        );

        vm.deal(user, 100 ether);
    }

    function test_Initialization() public {
        assertEq(address(proxy.ethMultiVault()), multiVault);
        assertEq(proxy.feeRecipient(), multisig);
        assertEq(proxy.creationFixedFee(), CREATION_FEE);
        assertEq(proxy.depositFixedFee(), DEPOSIT_FEE);
        assertEq(proxy.depositPercentageFee(), DEPOSIT_PERCENTAGE);
        assertTrue(proxy.whitelistedAdmins(admin1));
        assertTrue(proxy.whitelistedAdmins(admin2));
        assertTrue(proxy.whitelistedAdmins(admin3));
    }

    function test_CalculateDepositFee() public {
        uint256 depositAmount = 10 ether;
        uint256 expectedFee = DEPOSIT_FEE + (depositAmount * DEPOSIT_PERCENTAGE / 10000);
        assertEq(proxy.calculateDepositFee(depositAmount), expectedFee);
    }

    function test_CalculateCreationFee() public {
        uint256 count = 5;
        assertEq(proxy.calculateCreationFee(count), CREATION_FEE * count);
    }

    function test_AdminCanSetFees() public {
        vm.prank(admin1);
        proxy.setCreationFixedFee(0.2 ether);
        assertEq(proxy.creationFixedFee(), 0.2 ether);
    }

    function test_NonAdminCannotSetFees() public {
        vm.prank(user);
        vm.expectRevert(Errors.SofiaFeeProxy_NotWhitelistedAdmin.selector);
        proxy.setCreationFixedFee(0.2 ether);
    }

    function test_FeeTransferToMultisig() public {
        uint256 initialBalance = multisig.balance;
        uint256 depositAmount = 10 ether;
        uint256 sofiaFee = proxy.calculateDepositFee(depositAmount);

        vm.prank(user);
        proxy.deposit{value: depositAmount + sofiaFee}(
            user,
            bytes32(0),
            1,
            0,
            depositAmount
        );

        assertEq(multisig.balance, initialBalance + sofiaFee);
    }
}

// Mock contract for testing
contract MockMultiVault is IEthMultiVault {
    function createAtoms(bytes[] calldata, uint256[] calldata) external payable returns (bytes32[] memory) {
        bytes32[] memory ids = new bytes32[](1);
        ids[0] = bytes32(uint256(1));
        return ids;
    }

    function createTriples(bytes32[] calldata, bytes32[] calldata, bytes32[] calldata, uint256[] calldata) external payable returns (bytes32[] memory) {
        bytes32[] memory ids = new bytes32[](1);
        ids[0] = bytes32(uint256(1));
        return ids;
    }

    function deposit(address, bytes32, uint256, uint256) external payable returns (uint256) {
        return msg.value;
    }

    function depositBatch(address, bytes32[] calldata, uint256[] calldata, uint256[] calldata, uint256[] calldata) external payable returns (uint256[] memory) {
        uint256[] memory shares = new uint256[](1);
        shares[0] = msg.value;
        return shares;
    }

    function getAtomCost() external pure returns (uint256) { return 0.001 ether; }
    function getTripleCost() external pure returns (uint256) { return 0.001 ether; }
    function calculateAtomId(bytes calldata data) external pure returns (bytes32) { return keccak256(data); }
    function calculateTripleId(bytes32 s, bytes32 p, bytes32 o) external pure returns (bytes32) { return keccak256(abi.encodePacked(s, p, o)); }
    function getTriple(bytes32) external pure returns (bytes32, bytes32, bytes32) { return (bytes32(0), bytes32(0), bytes32(0)); }
    function getShares(address, bytes32, uint256) external pure returns (uint256) { return 0; }
    function isTermCreated(bytes32) external pure returns (bool) { return false; }
    function previewDeposit(bytes32, uint256, uint256 assets) external pure returns (uint256, uint256) { return (assets, assets); }
}
```

---

## Script de Déploiement

### script/Deploy.s.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Script.sol";
import "../src/SofiaFeeProxy.sol";

contract DeployScript is Script {
    // Base Mainnet MultiVault
    address constant MULTIVAULT_BASE = 0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e;
    // Base Sepolia MultiVault (for testing)
    address constant MULTIVAULT_BASE_SEPOLIA = 0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91;

    // Gnosis Safe
    address constant GNOSIS_SAFE = 0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD;

    // Initial fees
    uint256 constant CREATION_FEE = 0.1 ether;    // 0.1 TRUST
    uint256 constant DEPOSIT_FEE = 0.1 ether;     // 0.1 TRUST
    uint256 constant DEPOSIT_PERCENTAGE = 200;    // 2%

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get admin addresses from env
        address admin1 = vm.envAddress("ADMIN_1");
        address admin2 = vm.envAddress("ADMIN_2");
        address admin3 = vm.envAddress("ADMIN_3");

        address[] memory admins = new address[](3);
        admins[0] = admin1;
        admins[1] = admin2;
        admins[2] = admin3;

        // Choose MultiVault based on chain
        address multiVault = block.chainid == 8453 ? MULTIVAULT_BASE : MULTIVAULT_BASE_SEPOLIA;

        vm.startBroadcast(deployerPrivateKey);

        SofiaFeeProxy proxy = new SofiaFeeProxy(
            multiVault,
            GNOSIS_SAFE,
            CREATION_FEE,
            DEPOSIT_FEE,
            DEPOSIT_PERCENTAGE,
            admins
        );

        console.log("SofiaFeeProxy deployed at:", address(proxy));

        vm.stopBroadcast();
    }
}
```

---

## Configuration Foundry

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.21"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
hardhat = "http://127.0.0.1:8545"
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"
base = "${BASE_RPC_URL}"

[etherscan]
base_sepolia = { key = "${BASESCAN_API_KEY}" }
base = { key = "${BASESCAN_API_KEY}" }
```

### .env.example

```bash
PRIVATE_KEY=
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=

ADMIN_1=0x...
ADMIN_2=0x...
ADMIN_3=0x...
```

---

## Intégration Extension Sofia

Après déploiement, modifier ces fichiers dans l'extension:

### 1. chainConfig.ts
```typescript
export const SOFIA_FEE_PROXY_ADDRESS = "0x..."; // Adresse déployée
```

### 2. blockchainService.ts
```typescript
// Remplacer MULTIVAULT_CONTRACT_ADDRESS par SOFIA_FEE_PROXY_ADDRESS
// Mettre à jour les appels deposit() avec le nouveau paramètre depositAmount
```

### 3. Créer ABI/SofiaFeeProxy.ts
Générer l'ABI depuis le contrat compilé.

---

## Ordre d'exécution

- [ ] 1. Créer le repo `sofia-contracts` dans `sofia-core/`
- [ ] 2. Setup Foundry + fichiers de config
- [ ] 3. Créer `src/interfaces/IEthMultiVault.sol`
- [ ] 4. Créer `src/libraries/Errors.sol`
- [ ] 5. Créer `src/SofiaFeeProxy.sol`
- [ ] 6. Écrire les tests `test/SofiaFeeProxy.t.sol`
- [ ] 7. Tester sur Hardhat local: `forge test`
- [ ] 8. Déployer sur Base Sepolia
- [ ] 9. Vérifier le contrat sur Basescan
- [ ] 10. Intégrer dans l'extension Sofia
- [ ] 11. Déployer sur Base Mainnet (production)

---

## Notes importantes

- **Pas d'upgradeability** pour simplifier (peut être ajouté plus tard avec proxy pattern)
- **Fees envoyés directement** au multisig (pas d'accumulation dans le contrat)
- **Le contrat ne garde pas d'ETH** - tout est forwardé ou renvoyé
- Les fonctions view sont des **passthrough** sans modification
- La signature de `deposit()` diffère du MultiVault original (ajout de `depositAmount`)
- Les admins peuvent modifier les fees mais NE PEUVENT PAS appeler les fonctions payantes en tant qu'admin

---

## Commandes utiles

```bash
# Compiler
forge build

# Tester
forge test -vvv

# Tester avec fork
forge test --fork-url $BASE_SEPOLIA_RPC_URL -vvv

# Déployer sur testnet
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify

# Déployer sur mainnet
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```
