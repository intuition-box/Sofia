---

slug: logbook-26-09

title: Logbook 26/09

authors: [Samuel, Maxime]

---

During this week we pushed SofIA’s architecture further, laying the groundwork for the indexer and cleaning up our core stack. We improved gas fee handling and contract interaction, refactored our hooks and state management to be fully modular, and optimized batch atom creation to avoid duplicate blockchain transactions.

On top of that we restored the profile page, refined the Signal tab, improved CSS and integrated OAuth securely with YouTube, Spotify and Twitch. Our new theme-extraction agent now supports bookmark and history import with chunked processing for better memory usage.

All these changes make SofIA lighter, faster and easier to extend. Users benefit from smoother interfaces, quicker imports and clearer TRUST metrics; developers get a cleaner, more predictable API and message bus.

<!-- truncate -->

## Indexer & Core Infrastructure  
- Started implementing the indexer  
- Fixed IPFS calculation  
- General repository cleanup  

## Follow Function
- Starting to create follow function on account tab
- Create Trust Circle tab on profile page to see which account you're following

## Blockchain & Transactions  
- Configured maxGasFee for transaction execution  
- Managed gas fees and enforced EIP-1559 for local signing  
- Split MetaMask client from public HTTP client for contract reads  
- Fixed TypeScript errors and RPC failures  

## Architecture & Hooks  
- Simplified hook architecture by removing local states  
- Fixed TypeScript typing issues  
- Optimized batch atom creation logic to avoid duplicate blockchain transactions  
- Fully refactored type and message management  
- Applied modular architecture to all hooks  

## State Management  
- Centralized messages into messageBus  
- Removed local states — now handled by components  
- Simplified remaining hooks  
- Streamlined IndexedDB methods  

## UI/UX Improvements   
- Fixed display issues  
- General CSS architecture improvements  
- Improve social logo on account tab
- Finalize the logo
- Create trust circle Tab

## OAuth & Social Integration  
- Secured OAuth service for YouTube, Spotify, and Twitch  
- Extracted user data and generated triples  
- Externalized OAuth configuration (not committed)  

## Data Processing  
- Implemented theme extraction logic with new agent  
- Enabled import of history and bookmarks  
- Introduced chunk-based processing for memory optimization  
- Replaced parallel storage with sequential storage  

## Performance & Optimization  
- Removed dead code and optimized overall performance  
- Centralized constants and services  
- Simplified message handlers  
- Improved WebSocket architecture  
