# OAuth Module Architecture

Modular OAuth implementation 

## 📁 Structure

```
oauth/
├── index.ts                     # Main service orchestrator (~100 lines)
├── types/
│   └── interfaces.ts            # Type definitions and enums
├── core/                        # Core business logic
│   ├── OAuthFlowManager.ts      # OAuth flows (auth code, implicit)
│   ├── TokenManager.ts          # Token storage, refresh, validation
│   ├── PlatformDataFetcher.ts   # API data fetching + incremental sync
│   ├── TripletExtractor.ts      # Data transformation to triplets
│   ├── SyncManager.ts           # Sync status and incremental logic
│   └── MessageHandler.ts        # Chrome extension message handling
└── platforms/
    └── PlatformRegistry.ts      # Platform configs and triplet rules
```


