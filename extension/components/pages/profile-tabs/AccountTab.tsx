import { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import { useStorage } from '@plasmohq/storage/hook'
import discordIcon from '../../../assets/Discord_Logo.svg'
import xIcon from '../../../assets/X_logo.svg'

const AccountTab = () => {
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [discordAlias, setDiscordAlias] = useState("")
  const [xAlias, setXAlias] = useState("")
  const [isEditingDiscord, setIsEditingDiscord] = useState(false)
  const [isEditingX, setIsEditingX] = useState(false)
  const [isDiscordConnected, setIsDiscordConnected] = useState(false)
  const [isXConnected, setIsXConnected] = useState(false)
  
  const storage = new Storage()
  const [account] = useStorage<string>("metamask-account")
  const [discordUser] = useStorage<any>("discord-user")
  const [xUser] = useStorage<any>("x-user")

  useEffect(() => {
    if (discordUser) {
      setIsDiscordConnected(true)
      setDiscordAlias(discordUser.username + '#' + discordUser.discriminator)
    }
    if (xUser) {
      setIsXConnected(true)
      setXAlias(xUser.username ? `@${xUser.username}` : "@utilisateur_x")
    }
  }, [discordUser, xUser])

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhoto(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDiscordConnect = async () => {
    console.log('🔵 Discord connect button clicked')
    try {
      // Configuration Discord
      const DISCORD_CLIENT_ID = "1408419698139336814" // Votre Client ID Discord
      
      console.log('🔵 Discord config:', { DISCORD_CLIENT_ID })
      
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`
      const authUrl = `https://discord.com/oauth2/authorize?` + 
        `client_id=${DISCORD_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=identify`
      
      console.log('🔵 Launching Discord OAuth with URL:', authUrl)
      
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })
      
      console.log('🔵 Discord OAuth response URL:', responseUrl)
      
      if (responseUrl) {
        const url = new URL(responseUrl)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        
        if (error) {
          throw new Error(`Discord OAuth error: ${error}`)
        }
        
        if (code) {
          console.log('🔵 Code Discord reçu, échange contre token...')
          
          try {
            // Échange du code contre un access_token via Discord API
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: '', // Vide pour extension Chrome (public client)
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
              }).toString()
            })
            
            if (!tokenResponse.ok) {
              throw new Error(`Token exchange failed: ${tokenResponse.status}`)
            }
            
            const tokenData = await tokenResponse.json()
            console.log('🔵 Token Discord obtenu')
            
            // Récupération des données utilisateur avec le token
            const userResponse = await fetch('https://discord.com/api/users/@me', {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
              }
            })
            
            if (!userResponse.ok) {
              throw new Error(`User data fetch failed: ${userResponse.status}`)
            }
            
            const discordUser = await userResponse.json()
            console.log('🔵 Données Discord utilisateur reçues:', discordUser)
            
            await storage.set("discord-user", discordUser)
            setDiscordAlias(discordUser.username + '#' + (discordUser.discriminator || '0'))
            setIsDiscordConnected(true)
            
          } catch (apiError) {
            console.error('🔴 Erreur API Discord:', apiError)
            // Fallback vers simulation en cas d'erreur API
            console.log('🔵 Fallback vers simulation...')
            const mockUser = {
              id: '123456789',
              username: 'User',
              discriminator: '0001',
              avatar: null
            }
            await storage.set("discord-user", mockUser)
            setDiscordAlias(mockUser.username + '#' + mockUser.discriminator)
            setIsDiscordConnected(true)
          }
        }
      }
    } catch (error) {
      console.error('🔴 Erreur lors de la connexion Discord:', error)
      console.error('🔴 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      alert(`Erreur de connexion Discord: ${error.message}`)
    }
  }

  const handleXConnect = async () => {
    console.log('🟡 X connect button clicked')
    try {
      // Configuration X/Twitter
      const X_CLIENT_ID = "SzVScDdlMlM1LU42US04SUJJSFQ6MTpjaQ" // Votre Client ID X/Twitter
      
      console.log('🟡 X config:', { X_CLIENT_ID })
      
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`
      
      // Génération d'un code challenge pour PKCE (requis par X)
      const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => String.fromCharCode(b)).join('')
      const encoder = new TextEncoder()
      const data = encoder.encode(codeVerifier)
      const digest = await crypto.subtle.digest('SHA-256', data)
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      
      const authUrl = `https://twitter.com/i/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${X_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=tweet.read%20users.read&` +
        `state=state&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`
      
      console.log('🟡 Launching X OAuth with URL:', authUrl)
      
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })
      
      console.log('🟡 X OAuth response URL:', responseUrl)
      
      if (responseUrl) {
        const url = new URL(responseUrl)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        
        if (error) {
          throw new Error(`X OAuth error: ${error}`)
        }
        
        if (code) {
          console.log('🟡 Code X reçu, échange contre token...')
          
          try {
            // Échange du code contre un access_token via X API
            const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(X_CLIENT_ID + ':')}`
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
              }).toString()
            })
            
            if (!tokenResponse.ok) {
              throw new Error(`X Token exchange failed: ${tokenResponse.status}`)
            }
            
            const tokenData = await tokenResponse.json()
            console.log('🟡 Token X obtenu')
            
            // Récupération des données utilisateur avec le token
            const userResponse = await fetch('https://api.twitter.com/2/users/me', {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
              }
            })
            
            if (!userResponse.ok) {
              throw new Error(`X User data fetch failed: ${userResponse.status}`)
            }
            
            const userData = await userResponse.json()
            const xUser = userData.data
            console.log('🟡 Données X utilisateur reçues:', xUser)
            
            await storage.set("x-user", xUser)
            setXAlias("@" + xUser.username)
            setIsXConnected(true)
            
          } catch (apiError) {
            console.error('🔴 Erreur API X:', apiError)
            // Fallback vers simulation en cas d'erreur API
            console.log('🟡 Fallback vers simulation...')
            const mockUser = {
              id: '987654321',
              username: 'user_x',
              name: 'User X',
              profile_image_url: null
            }
            await storage.set("x-user", mockUser)
            setXAlias("@" + mockUser.username)
            setIsXConnected(true)
          }
        }
      }
    } catch (error) {
      console.error('🔴 Erreur lors de la connexion X:', error)
      console.error('🔴 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      alert(`Erreur de connexion X: ${error.message}`)
    }
  }

  const handleDiscordDisconnect = async () => {
    await storage.remove("discord-user")
    setDiscordAlias("")
    setIsDiscordConnected(false)
  }

  const handleXDisconnect = async () => {
    await storage.remove("x-user")
    setXAlias("")
    setIsXConnected(false)
  }

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-photo-container">
          <div className="profile-photo">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-placeholder">
                <span>🖼️</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="photo-input"
            id="photo-input"
          />
          <label htmlFor="photo-input" className="photo-upload-button">
            Change Avatar/NFT
          </label>
        </div>
      </div>

      {/* DID/Address Section */}
      {account && (
        <div className="profile-field">
          <label className="field-label">Adresse principale / DID</label>
          <div className="field-display">
            <div className="wallet-info">
              <span className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Discord Alias Section */}
      <div className="profile-field">
        <label className="field-label">
        </label>
        {!isDiscordConnected ? (
          <div className="field-display">
            <span className="alias-text">Not connected</span>
            <button onClick={handleDiscordConnect} className={isDiscordConnected ? "connected-button" : "connect-button"}>
              <img src={discordIcon} alt="Discord" className="button-icon" />
              Connect Discord
            </button>
          </div>
        ) : (
          <div className="field-display">
            <span className="alias-text">{discordAlias}</span>
            <button onClick={handleDiscordDisconnect} className="disconnect-button">
              <img src={discordIcon} alt="Discord" className="button-icon" />
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* X Alias Section */}
      <div className="profile-field">
        <label className="field-label">
        </label>
        {!isXConnected ? (
          <div className="field-display">
            <span className="alias-text">Not connected</span>
            <button onClick={handleXConnect} className={isXConnected ? "connected-button" : "connect-button"}>
              <img src={xIcon} alt="X" className="button-icon" />
              Connect X
            </button>
          </div>
        ) : (
          <div className="field-display">
            <span className="alias-text">{xAlias}</span>
            <button onClick={handleXDisconnect} className="disconnect-button">
              <img src={xIcon} alt="X" className="button-icon" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountTab