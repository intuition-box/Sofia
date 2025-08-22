import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { Storage } from '@plasmohq/storage'
import { useStorage } from '@plasmohq/storage/hook'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/ProfilePage.css'

const ProfilePage = () => {
  const { navigateTo } = useRouter()
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
    try {
      // Configuration Discord - remplacez par vos vraies valeurs
      const DISCORD_CLIENT_ID = "1234567890123456789" // Votre Client ID Discord
      const BACKEND_URL = "http://localhost:3001" // URL de votre serveur backend
      
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`
      const authUrl = `https://discord.com/oauth2/authorize?` + 
        `client_id=${DISCORD_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=identify`
      
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })
      
      if (responseUrl) {
        const url = new URL(responseUrl)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        
        if (error) {
          throw new Error(`Discord OAuth error: ${error}`)
        }
        
        if (code) {
          // Échanger le code contre un token via notre backend
          const response = await fetch(`${BACKEND_URL}/auth/discord/exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirectUri
            })
          })
          
          const data = await response.json()
          
          if (data.success && data.user) {
            // Sauvegarder les données utilisateur
            await storage.set("discord-user", data.user)
            setDiscordAlias(data.user.username + '#' + data.user.discriminator)
            setIsDiscordConnected(true)
          } else {
            throw new Error(data.error || 'Erreur lors de l\'échange du token Discord')
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion Discord:', error)
      alert(`Erreur de connexion Discord: ${error.message}`)
    }
  }

  const handleXConnect = async () => {
    try {
      // Configuration X/Twitter - remplacez par vos vraies valeurs
      const X_CLIENT_ID = "abcdefghijklmnopqrstuvwxyz" // Votre Client ID X/Twitter
      const BACKEND_URL = "http://localhost:3001" // URL de votre serveur backend
      
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
      
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })
      
      if (responseUrl) {
        const url = new URL(responseUrl)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        
        if (error) {
          throw new Error(`X OAuth error: ${error}`)
        }
        
        if (code) {
          // Échanger le code contre un token via notre backend
          const response = await fetch(`${BACKEND_URL}/auth/x/exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              codeVerifier,
              redirectUri
            })
          })
          
          const data = await response.json()
          
          if (data.success && data.user) {
            // Sauvegarder les données utilisateur
            await storage.set("x-user", data.user)
            setXAlias("@" + data.user.username)
            setIsXConnected(true)
          } else {
            throw new Error(data.error || 'Erreur lors de l\'échange du token X')
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion X:', error)
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
    <div className="page profile-page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>
      
      <h2 className="section-title">
        Profile
        {(isDiscordConnected || isXConnected) && (
          <span className="verified-badge" title="Profil certifié">✓</span>
        )}
      </h2>
      
      {/* Profile Section */}
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
            Alias Discord 
            {isDiscordConnected && <span className="connected-indicator">● Connecté</span>}
          </label>
          {!isDiscordConnected ? (
            <div className="field-display">
              <span className="alias-text">Non connecté</span>
              <button onClick={handleDiscordConnect} className="connect-button">Connecter Discord</button>
            </div>
          ) : (
            <div className="field-display">
              <span className="alias-text">{discordAlias}</span>
              <button onClick={handleDiscordDisconnect} className="disconnect-button">Déconnecter</button>
            </div>
          )}
        </div>

        {/* X Alias Section */}
        <div className="profile-field">
          <label className="field-label">
            Alias X (Twitter)
            {isXConnected && <span className="connected-indicator">● Connecté</span>}
          </label>
          {!isXConnected ? (
            <div className="field-display">
              <span className="alias-text">Non connecté</span>
              <button onClick={handleXConnect} className="connect-button">Connecter X</button>
            </div>
          ) : (
            <div className="field-display">
              <span className="alias-text">{xAlias}</span>
              <button onClick={handleXDisconnect} className="disconnect-button">Déconnecter</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage