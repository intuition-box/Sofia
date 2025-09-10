const OAUTH_SERVER_URL = "http://localhost:3001"

// Fonction pour générer un code verifier pour PKCE (X/Twitter)
const generateCodeVerifier = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Fonction pour générer le code challenge pour PKCE
const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Fonction pour gérer OAuth Discord
export async function handleDiscordOAuth(clientId: string, sendResponse: (response: any) => void) {
  try {
    const extensionId = chrome.runtime.id
    const redirectUri = `https://${extensionId}.chromiumapp.org/`
    
    const authUrl = `https://discord.com/api/oauth2/authorize?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email'
    })

    // Écouter les changements d'onglets pour capturer la redirection
    const handleTabUpdate = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.url && changeInfo.url.startsWith(redirectUri)) {
        const url = new URL(changeInfo.url)
        const code = url.searchParams.get('code')
        
        if (code) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate)
          chrome.tabs.remove(tabId)
          
          try {
            // Échanger le code contre les données utilisateur
            const response = await fetch(`${OAUTH_SERVER_URL}/auth/discord/exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, redirectUri })
            })

            const data = await response.json()
            
            if (data.success) {
              // Stocker les données utilisateur
              await chrome.storage.local.set({ "discord-user": data.user })
              sendResponse({ success: true, user: data.user })
            } else {
              sendResponse({ success: false, error: data.error })
            }
          } catch (error) {
            sendResponse({ success: false, error: error.message })
          }
        }
      }
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdate)
    
    // Créer l'onglet d'authentification
    chrome.tabs.create({ url: authUrl })
    
  } catch (error) {
    sendResponse({ success: false, error: error.message })
  }
}

// Fonction pour gérer OAuth X/Twitter
export async function handleXOAuth(clientId: string, sendResponse: (response: any) => void) {
  try {
    const extensionId = chrome.runtime.id
    const redirectUri = `https://${extensionId}.chromiumapp.org/`
    
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    // Stocker le code verifier pour plus tard
    await chrome.storage.local.set({ 'x-code-verifier': codeVerifier })

    const authUrl = `https://x.com/i/oauth2/authorize?` + new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'users.read tweet.read follows.read',
      state: 'state',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    // Écouter les changements d'onglets pour capturer la redirection
    const handleTabUpdate = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.url && changeInfo.url.startsWith(redirectUri)) {
        const url = new URL(changeInfo.url)
        const code = url.searchParams.get('code')
        
        if (code) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate)
          chrome.tabs.remove(tabId)
          
          try {
            // Récupérer le code verifier stocké
            const result = await chrome.storage.local.get('x-code-verifier')
            const storedCodeVerifier = result['x-code-verifier']
            
            // Échanger le code contre les données utilisateur
            const response = await fetch(`${OAUTH_SERVER_URL}/auth/x/exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, codeVerifier: storedCodeVerifier, redirectUri })
            })

            const data = await response.json()
            
            if (data.success) {
              // Stocker les données utilisateur et le token d'accès, puis nettoyer le code verifier
              await chrome.storage.local.set({ 
                "x-user": data.user,
                "x-access-token": data.access_token
              })
              await chrome.storage.local.remove('x-code-verifier')
              sendResponse({ success: true, user: data.user })
            } else {
              sendResponse({ success: false, error: data.error })
            }
          } catch (error) {
            sendResponse({ success: false, error: error.message })
          }
        }
      }
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdate)
    
    // Créer l'onglet d'authentification
    chrome.tabs.create({ url: authUrl })
    
  } catch (error) {
    sendResponse({ success: false, error: error.message })
  }
}