const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
// Forcer le rechargement du .env
delete process.env.DISCORD_CLIENT_ID;
delete process.env.DISCORD_CLIENT_SECRET;
delete process.env.X_CLIENT_ID;
delete process.env.X_CLIENT_SECRET;
require('dotenv').config();

console.log('🔴 FORCE RELOAD - DISCORD CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
console.log('🔴 FORCE RELOAD - X CLIENT_ID:', process.env.X_CLIENT_ID);

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
    console.log('🔵 Discord exchange request:', req.body);
    const { code, redirectUri } = req.body;

    if (!code) {
      console.log('❌ Code Discord manquant');
      return res.status(400).json({ success: false, error: 'Code manquant' });
    }

    // Debug des variables d'environnement
    console.log('🔵 CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
    console.log('🔵 CLIENT_SECRET présent:', !!process.env.DISCORD_CLIENT_SECRET);
    console.log('🔵 CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET);
    console.log('🔵 Redirect URI:', redirectUri);
    console.log('🔵 Variables env complètes:', { 
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET_PREFIX: process.env.DISCORD_CLIENT_SECRET?.substring(0, 10)
    });

    // Échanger le code contre un token d'accès (méthode standard Discord)
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    console.log('🔵 Params envoyés:', params.toString());

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await tokenResponse.json();
    console.log('🔵 Discord token response:', tokenData);

    if (!tokenData.access_token) {
      console.log('❌ Token Discord manquant:', tokenData);
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
    console.log('🔵 X exchange request:', req.body);
    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier) {
      console.log('❌ Code ou code verifier X manquant');
      return res.status(400).json({ success: false, error: 'Code ou code verifier manquant' });
    }

    // Debug des variables d'environnement X
    console.log('🔵 X_CLIENT_ID:', process.env.X_CLIENT_ID);
    console.log('🔵 X_CLIENT_SECRET présent:', !!process.env.X_CLIENT_SECRET);
    console.log('🔵 X Redirect URI:', redirectUri);

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
    console.log('🔵 X token response:', tokenData);

    if (!tokenData.access_token) {
      console.log('❌ Token X manquant:', tokenData);
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
      },
      access_token: tokenData.access_token
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

// Endpoint pour récupérer les follows d'un utilisateur X
app.post('/auth/x/following', async (req, res) => {
  try {
    const { user_id, access_token } = req.body;

    if (!user_id || !access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id et access_token requis' 
      });
    }

    // Récupérer la liste des follows via l'API X v1.1
    const followingResponse = await fetch(`https://api.twitter.com/1.1/friends/list.json?user_id=${user_id}&count=200&include_user_entities=false`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const followingData = await followingResponse.json();

    if (!followingResponse.ok) {
      console.error('Erreur API X following:', followingData);
      return res.status(followingResponse.status).json({ 
        success: false, 
        error: 'Impossible de récupérer les follows',
        details: followingData
      });
    }

    // Adapter le format v1.1 vers notre format attendu
    const adaptedFollowing = followingData.users ? followingData.users.map(user => ({
      id: user.id_str,
      username: user.screen_name,
      name: user.name,
      description: user.description,
      profile_image_url: user.profile_image_url_https
    })) : [];

    res.json({ 
      success: true, 
      following: adaptedFollowing,
      meta: { result_count: adaptedFollowing.length }
    });

  } catch (error) {
    console.error('Erreur récupération follows X:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des follows',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur OAuth Sofia démarré sur le port ${PORT}`);
  console.log(`📝 Configurez les applications OAuth avec l'URL de redirection :`);
  console.log(`   https://gelnopmoeejcfahhcfjcmmgmmbbalpnm.chromiumapp.org/`);
});