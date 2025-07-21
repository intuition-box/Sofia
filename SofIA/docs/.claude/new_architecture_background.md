background/
├── index.ts                       # Entrée principale (service worker)
├── constants.ts                  # Constantes de config (IDs, intervals, buffer)
├── types.ts                      # Tous les types (Payloads, Data, Behaviors)
├── agent.ts                      # Fonctions liées à l'agent IA
├── websocket.ts                  # WebSocket vers ElizaOS
├── behavior.ts                   # Gestion comportement (audio/vidéo/article)
├── history.ts                    # Gestion historique/navigation
├── messages.ts                   # Dispatcher des messages Chrome
├── utils/
│   ├── delay.ts                  # delayedWrite, wait
│   ├── formatters.ts            # formatDuration, formatTimestamp, trimText
│   ├── url.ts                   # sanitizeUrl, isSensitiveUrl
│   ├── buffer.ts                # flushBuffer, trimBuffer
└── metamask.ts                  # Gestion de la connexion MetaMask 