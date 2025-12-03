# Sofia Fee Proxy Contract

Smart contract proxy for Intuition MultiVault with fee collection for the Sofia application.

## Overview

The SofiaFeeProxy contract acts as a proxy between Sofia users and the Intuition MultiVault contract. It collects fees on transactions (atom/triple creation and deposits) and forwards them to a Gnosis Safe multisig.

## Fee Structure

| Operation | Fixed Fee | Percentage Fee |
|-----------|-----------|----------------|
| Create Atoms | 0.1 TRUST | 0% |
| Create Triples | 0.1 TRUST | 0% |
| Deposit | 0.1 TRUST | 2% |

### Example

For a 10 TRUST deposit:
- Fixed fee: 0.1 TRUST
- Percentage fee: 0.2 TRUST (2% of 10)
- **Total fee: 0.3 TRUST**
- User sends: 10.3 TRUST
- Deposited to MultiVault: 10 TRUST

## Architecture

```
sofia-contracts/
├── src/
│   ├── SofiaFeeProxy.sol          # Main contract
│   ├── interfaces/
│   │   └── IEthMultiVault.sol     # MultiVault interface
│   └── libraries/
│       └── Errors.sol             # Custom errors
├── test/
│   └── SofiaFeeProxy.t.sol        # Tests
├── script/
│   └── Deploy.s.sol               # Deployment scripts
├── foundry.toml
└── README.md
```

## Installation

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install
```

## Build

```bash
forge build
```

## Test

```bash
# Run all tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_DepositCollectsFees -vvv

# Run tests with gas report
forge test --gas-report
```

## Local Deployment (Anvil)

```bash
# Start local node
anvil

# In another terminal, deploy
forge script script/Deploy.s.sol:DeployLocalScript --rpc-url http://127.0.0.1:8545 --broadcast
```

## Testnet Deployment (Base Sepolia)

1. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

2. Fill in the environment variables:
```
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
ADMIN_1=0x...
ADMIN_2=0x...
ADMIN_3=0x...
```

3. Deploy:
```bash
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
```

## Mainnet Deployment (Base)

```bash
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_RPC_URL --broadcast --verify
```

## Contract Addresses

| Network | Address |
|---------|---------|
| Base Sepolia | TBD |
| Base Mainnet | TBD |

## Admin Functions

Only whitelisted admins can call these functions:

- `setCreationFixedFee(uint256)` - Update creation fee
- `setDepositFixedFee(uint256)` - Update deposit fixed fee
- `setDepositPercentageFee(uint256)` - Update deposit percentage (base 10000)
- `setFeeRecipient(address)` - Update fee recipient
- `setWhitelistedAdmin(address, bool)` - Add/remove admins

## Security Considerations

- No upgradeability (immutable contract)
- Fees are transferred directly to multisig (no accumulation)
- Maximum fee percentage capped at 100%
- Zero address checks on critical parameters

## License

MIT
