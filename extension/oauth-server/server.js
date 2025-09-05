const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*',
    'http://localhost:*'
  ],
  credentials: true
}));
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Serveur OAuth Sofia actif' });
});

// Exchange Discord OAuth code pour un token
app.post('/auth/discord/exchange', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Code manquant' });
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible d\'obtenir le token Discord',
        details: tokenData
      });
    }

    // Récupérer les informations utilisateur
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de récupérer les données utilisateur Discord',
        details: userData
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0000',
        avatar: userData.avatar,
        global_name: userData.global_name
      }
    });

  } catch (error) {
    console.error('Erreur Discord OAuth:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'authentification Discord',
      details: error.message
    });
  }
});

// Exchange X/Twitter OAuth code pour un token
app.post('/auth/x/exchange', async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier) {
      return res.status(400).json({ success: false, error: 'Code ou code verifier manquant' });
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        client_id: process.env.X_CLIENT_ID,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible d\'obtenir le token X',
        details: tokenData
      });
    }

    // Récupérer les informations utilisateur
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userResponseData = await userResponse.json();

    if (!userResponseData.data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de récupérer les données utilisateur X',
        details: userResponseData
      });
    }

    const userData = userResponseData.data;

    res.json({ 
      success: true, 
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        profile_image_url: userData.profile_image_url
      }
    });

  } catch (error) {
    console.error('Erreur X OAuth:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'authentification X',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur OAuth Sofia démarré sur le port ${PORT}`);
  console.log(`📝 Configurez les applications OAuth avec l'URL de redirection :`);
  console.log(`   https://[EXTENSION-ID].chromiumapp.org/`);
});