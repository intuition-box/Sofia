const OAUTH_SERVER_URL = "http://localhost:3001"

// Function to generate verifier code for PKCE (X/Twitter)
const generateCodeVerifier = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Function to generate challenge code for PKCE
const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Function to handle Discord OAuth
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

    // Listen for tab changes to capture redirection
    const handleTabUpdate = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.url && changeInfo.url.startsWith(redirectUri)) {
        const url = new URL(changeInfo.url)
        const code = url.searchParams.get('code')
        
        if (code) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate)
          chrome.tabs.remove(tabId)
          
          try {
            // Exchange code for user data
            const response = await fetch(`${OAUTH_SERVER_URL}/auth/discord/exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, redirectUri })
            })

            const data = await response.json()
            
            if (data.success) {
              // Store user data
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
    
    // Create authentication tab
    chrome.tabs.create({ url: authUrl })
    
  } catch (error) {
    sendResponse({ success: false, error: error.message })
  }
}

// Function to handle X/Twitter OAuth
export async function handleXOAuth(clientId: string, sendResponse: (response: any) => void) {
  try {
    const extensionId = chrome.runtime.id
    const redirectUri = `https://${extensionId}.chromiumapp.org/`
    
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    // Stock code for later
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

    // Listen for tab changes to capture redirection
    const handleTabUpdate = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.url && changeInfo.url.startsWith(redirectUri)) {
        const url = new URL(changeInfo.url)
        const code = url.searchParams.get('code')
        
        if (code) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate)
          chrome.tabs.remove(tabId)
          
          try {
            // Retrieve stored code 
            
            const result = await chrome.storage.local.get('x-code-verifier')
            const storedCodeVerifier = result['x-code-verifier']
            
            // Exchange code for user data
            const response = await fetch(`${OAUTH_SERVER_URL}/auth/x/exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, codeVerifier: storedCodeVerifier, redirectUri })
            })

            const data = await response.json()
            
            if (data.success) {
              // Store user data and access token, then clean up code verifier
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
    
    // Create authentication tab
    chrome.tabs.create({ url: authUrl })
    
  } catch (error) {
    sendResponse({ success: false, error: error.message })
  }
}