# Plan: Intégration Privy pour Chrome Extension

## Problème actuel
Le SDK Privy fait un check `window.location.protocol === 'https:'` qui bloque dans le sidepanel (`chrome-extension://`).

## Solution officielle Privy
Utiliser une **page tab** de l'extension pour l'authentification, qui offre un contexte browser complet permettant les popups OAuth.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIDEPANEL                                │
│  (chrome-extension://xxx/sidepanel.html)                        │
│                                                                  │
│  ┌──────────────────────┐    ┌─────────────────────────────┐   │
│  │ WalletConnectionBtn  │───►│ chrome.tabs.create()        │   │
│  │ "Connect Wallet"     │    │ ouvre tabs/auth.html        │   │
│  └──────────────────────┘    └─────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ useWalletFromStorage │◄── chrome.storage.session             │
│  │ (lecture seule)      │    walletAddress                      │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ chrome.tabs.create()
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TABS/AUTH.HTML                              │
│  (chrome-extension://xxx/tabs/auth.html)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PrivyProvider                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              AuthContent                            │  │   │
│  │  │                                                     │  │   │
│  │  │  useEffect → if (ready && !authenticated) login()  │  │   │
│  │  │                                                     │  │   │
│  │  │  useLogin({ onComplete: () => {                    │  │   │
│  │  │    // Envoyer wallet au background                 │  │   │
│  │  │    chrome.runtime.sendMessage({                    │  │   │
│  │  │      type: 'WALLET_CONNECTED',                     │  │   │
│  │  │      address: user.wallet.address                  │  │   │
│  │  │    })                                              │  │   │
│  │  │    // Fermer le tab                                │  │   │
│  │  │    window.close()                                  │  │   │
│  │  │  }})                                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ chrome.runtime.sendMessage
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKGROUND SCRIPT                           │
│                                                                  │
│  chrome.runtime.onMessage.addListener((message) => {            │
│    if (message.type === 'WALLET_CONNECTED') {                   │
│      chrome.storage.session.set({ walletAddress: message.addr })│
│      init() // Initialize sockets/agents                        │
│    }                                                             │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fichiers à créer/modifier

### 1. CRÉER: `tabs/auth.tsx`
Page Plasmo qui contient le PrivyProvider et déclenche l'auth automatiquement.

```typescript
// tabs/auth.tsx
import { useEffect } from 'react'
import { PrivyProvider, usePrivy, useLogin } from '@privy-io/react-auth'
import { privyConfig } from '../lib/config/privy'

const AuthContent = () => {
  const { authenticated, ready, user } = usePrivy()
  const { login } = useLogin({
    onComplete: (user) => {
      const walletAddress = user.wallet?.address
      if (walletAddress) {
        // Envoyer au background script
        chrome.runtime.sendMessage({
          type: 'WALLET_CONNECTED',
          address: walletAddress
        })
        // Fermer le tab après 1s
        setTimeout(() => window.close(), 1000)
      }
    },
    onError: (error) => {
      console.error('Login error:', error)
    }
  })

  useEffect(() => {
    if (ready && !authenticated) {
      login()
    }
  }, [ready, authenticated])

  if (!ready) return <div>Loading Privy...</div>
  if (authenticated) return <div>Connected! Closing...</div>
  return <div>Opening wallet connection...</div>
}

export default function AuthPage() {
  return (
    <PrivyProvider
      appId={privyConfig.appId}
      clientId={privyConfig.clientId}
      config={privyConfig.config}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: 'white'
      }}>
        <AuthContent />
      </div>
    </PrivyProvider>
  )
}
```

### 2. MODIFIER: `components/ui/THP_WalletConnectionButton.tsx`
Ouvrir le tab auth au lieu d'appeler login() directement.

```typescript
// components/ui/THP_WalletConnectionButton.tsx
import { useState, useEffect } from 'react'
import Iridescence from './Iridescence'

const WalletConnectionButton = ({ disabled = false }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Écouter les changements de wallet depuis chrome.storage.session
  useEffect(() => {
    const checkWallet = async () => {
      const result = await chrome.storage.session.get('walletAddress')
      setWalletAddress(result.walletAddress || null)
      setIsLoading(false)
    }
    checkWallet()

    // Écouter les changements
    const listener = (changes: any, area: string) => {
      if (area === 'session' && changes.walletAddress) {
        setWalletAddress(changes.walletAddress.newValue || null)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const handleConnect = () => {
    // Ouvrir le tab d'authentification Privy
    chrome.tabs.create({
      url: chrome.runtime.getURL('tabs/auth.html')
    })
  }

  const handleDisconnect = async () => {
    await chrome.runtime.sendMessage({ type: 'WALLET_DISCONNECTED' })
  }

  const authenticated = !!walletAddress

  return (
    <div>
      {!authenticated ? (
        <button
          className={`wallet-connect-button ${isLoading ? 'loading' : ''}`}
          onClick={handleConnect}
          disabled={disabled || isLoading}
        >
          {/* ... reste du JSX ... */}
        </button>
      ) : (
        <button className="disconnect-button-3d noselect" onClick={handleDisconnect}>
          Disconnect
        </button>
      )}
    </div>
  )
}

export default WalletConnectionButton
```

### 3. MODIFIER: `sidepanel.tsx`
Supprimer PrivyProvider, utiliser chrome.storage.session pour le wallet.

```typescript
// sidepanel.tsx - SANS PrivyProvider
import { useEffect, useState } from "react"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// ... imports

const SidePanelContent = () => {
  const { currentPage, navigateTo } = useRouter()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Synchroniser avec chrome.storage.session
  useEffect(() => {
    const checkWallet = async () => {
      const result = await chrome.storage.session.get('walletAddress')
      setWalletAddress(result.walletAddress || null)
      setIsLoading(false)
    }
    checkWallet()

    const listener = (changes: any, area: string) => {
      if (area === 'session' && changes.walletAddress) {
        setWalletAddress(changes.walletAddress.newValue || null)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const authenticated = !!walletAddress

  // Navigation automatique
  useEffect(() => {
    if (authenticated && currentPage === 'home') {
      navigateTo('home-connected')
    } else if (!authenticated && currentPage !== 'home') {
      navigateTo('home')
    }
  }, [authenticated, currentPage, navigateTo])

  // ... reste du composant
}

function SidePanel() {
  return (
    // PAS de PrivyProvider ici!
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RouterProvider initialPage="home">
          <SidePanelContent />
        </RouterProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
```

### 4. CRÉER: `hooks/useWalletFromStorage.ts`
Hook réutilisable pour lire le wallet depuis chrome.storage.session.

```typescript
// hooks/useWalletFromStorage.ts
import { useState, useEffect } from 'react'

export const useWalletFromStorage = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const result = await chrome.storage.session.get('walletAddress')
        setWalletAddress(result.walletAddress || null)
      } catch (error) {
        console.error('Error reading wallet from storage:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkWallet()

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'session' && changes.walletAddress) {
        setWalletAddress(changes.walletAddress.newValue || null)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return {
    walletAddress,
    authenticated: !!walletAddress,
    isLoading,
    ready: !isLoading
  }
}
```

### 5. MODIFIER: Composants utilisant `usePrivy`

Remplacer `usePrivy()` par `useWalletFromStorage()` dans:
- `sidepanel.tsx`
- `THP_WalletConnectionButton.tsx`
- `usePrivyWalletSync.ts` (supprimer)
- Tout autre composant utilisant `usePrivy`

---

## Fichiers à supprimer

- `hooks/usePrivyWalletSync.ts` - Plus nécessaire, le tab auth envoie directement au background

---

## Configuration Privy Dashboard

Déjà configuré:
- ✅ Extension ID: `fgggfhnffjffiipdpipbkkceaengpeag`
- ✅ Allowed Origin: `chrome-extension://fgggfhnffjffiipdpipbkkceaengpeag`
- ✅ Client ID: `client-WY6U3b3LFEgbveR2FVgiyTTbRWKCZhy6vEVFzQt9NvZYS`

---

## Ordre d'implémentation

1. ✅ Créer `tabs/auth.tsx`
2. ✅ Créer `hooks/useWalletFromStorage.ts`
3. ✅ Modifier `THP_WalletConnectionButton.tsx`
4. ✅ Modifier `sidepanel.tsx` (supprimer PrivyProvider)
5. ✅ Supprimer `hooks/usePrivyWalletSync.ts`
6. ✅ Mettre à jour autres composants si nécessaire
7. ✅ Build et test

---

## Flux utilisateur final

1. User ouvre le sidepanel Sofia
2. Voit le bouton "Connect Wallet"
3. Clique → Un nouvel onglet s'ouvre avec la page d'auth
4. Privy affiche le modal de connexion MetaMask
5. User connecte son wallet
6. Le tab envoie l'adresse au background, puis se ferme
7. Le sidepanel détecte le changement et affiche HomeConnectedPage
