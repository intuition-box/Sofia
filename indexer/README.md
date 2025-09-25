# Sofia Indexer

TypeScript indexer to detect triplets created by Sofia extension in the Intuition multivault system.

## Features

- 🔍 **Real-time monitoring** of multivault contract events
- 🏷️ **Sofia signature detection** via IPFS metadata analysis
- 📺 **Detailed console display** of detected Sofia triplets
- 💾 **Local storage** of discovered triplets

## Installation

```bash
cd core/indexer
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Configuration

Create a `.env` file:

```env
# Polling interval (ms)
POLL_INTERVAL_MS=10000

# Starting block
START_BLOCK=latest
```

## How it works

1. **Monitor** `TripleCreated` events from multivault contract
2. **Fetch** IPFS metadata for each new atom
3. **Detect** descriptions containing `| Sofia`
4. **Display** Sofia triplets with full details

### Example output

```
🎯 ===== SOFIA TRIPLE DETECTED =====
📧 TX Hash: 0x1234...
📦 Block: 12345678
⏰ Time: 25/09/2025, 14:30:15
🔗 Triple ID: 0xabc123...
📊 Atoms:
  Subject:   0xdef456...
  Predicate: 0x789ghi...
  Object:    0x012jkl...
📈 Total Sofia triplets: 5
=====================================
```

## Structure

```
core/indexer/
├── src/
│   ├── types.ts          # TypeScript types
│   ├── sofiaIndexer.ts   # Main class
│   └── index.ts          # Entry point
├── config/
│   └── chains.ts         # Blockchain configuration
└── package.json
```

## Development

- Complete types with viem
- Intuition Testnet configuration
- Rich console display
- Robust error handling