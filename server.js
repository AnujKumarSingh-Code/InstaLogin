const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>Instagram OAuth</h1>
    <a href="https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_CLIENT_ID}&redirect_uri=${process.env.IG_REDIRECT_URI}&scope=user_profile,user_media&response_type=code">
      Login with Instagram
    </a>
  `);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('No code provided');
  }

  try {
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: {
        client_id: process.env.IG_CLIENT_ID,
        client_secret: process.env.IG_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.IG_REDIRECT_URI,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    res.send(`
      <h1>Access Token</h1>
      <p>${accessToken}</p>
      <h1>User ID</h1>
      <p>${userId}</p>
    `);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.send('Error getting access token');
  }
});


















app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
