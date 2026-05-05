---

slug: logbook-19-09

title: Logbook 19/09

authors: [Samuel, Maxime]

---

During this week we consolidated the whole Sofia extension stack. We migrated and refactored our OAuth service to a clean, dedicated structure, securing the integration with YouTube, Spotify and Twitch and making it easier for developers to configure secrets. We improved URL handling and state management, added a complete Pulse agent with its own tab and WebSocket infrastructure, and refined our detection logic to extract  data . On top of that we streamlined background code, unified message handlers, added badge/notification logic and rolled out a new theme extraction agent with bookmark and history import.

<!-- truncate -->

All these changes make Sofia more stable, more modular and more privacy-respectful. Users get smoother connections, faster imports and richer, verifiable triples; developers get a clearer architecture and a simpler way to extend the platform.

On the design side, we implemented the orb on the home page, finalizing the logo and choosing the appropriate font for the whole app.

We also decided to open this "build in public" part by refactoring the landing page and the light paper.

---

## OAuth and URL Management
### OAuth Migration and Refactoring:

- Complete refactoring of the OAuth service with dedicated folder organization
- Secure OAuth support for YouTube, Spotify, and Twitch
- Authorization code flow (YouTube/Spotify) and implicit flow (Twitch)
- External configuration for OAuth secrets
- Template oauth-config.example.ts for developers
- Extraction of user data and generation of triples from OAuth APIs
- Storing triples in IndexedDB via elizaDataService for displaying EchoesTab


### URL Improvements:
- Dynamic URLs during OAuth import
- Echoes tab with clickable links
- Priority system: official links fetched > user profile in case of errors

---

## State and Data Management

### Authentication System:

- Connection/disconnection state with full management
- Synchronous cleanup of all storage and tokens via "clear storage" button
- Automatic token update and verification for OAuth
- Updated Spotify scopes: user-read-private, user-follow-read, user-top-read


### Data Detection:

- Cleaned up Twitter DataDetector to work exclusively with Twitter
- Functional follow/unfollow logic via reading actual DOM data
- Action prediction based on DOM state
- Removed non-functional follower extraction logic

---

## Pulse System

### Pulse Infrastructure:

- Complete Pulse agent with a dedicated tab
- Content script sent to tabs
- WebSocket configuration for message manager and sender
- Constants for loaded channels
- Functional Pulse button in settings page


## Pulse Features:

- Search analysis working properly
- Display in search groups via Pulse Tab
- Resonance system and background gradient
- "Orb to pulse" transition fully operational

---

## Technical Improvements

### Architecture Refactoring:

- Simplified background files and removed code duplication
- websocket.ts: removed import aliases, unified socket configuration
- messageHandlers.ts: generalized handleDataExtraction for bookmarks/history
- messageSenders.ts: merged functions for theme extraction
- tripletProcessor.ts: removed unused idPrefix parameter


### Badges and Notifications System:

- Functional badge count based on storage detection (no longer relying on EchoesTab display)
- Updated message handler


### Advanced Data Extraction:

- Theme extraction system implemented with new agent
- Bookmark analysis
- History import enabled
- Improved parsing in WebSocket with message types

