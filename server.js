const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
let accessToken = '';
let userId='';

app.get('/', (req, res) => {
  res.send(`
    <h1>Instagram OAuth</h1>
    <a href="https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_CLIENT_ID}&redirect_uri=${process.env.IG_REDIRECT_URI}&scope=user_profile,user_media&response_type=code">
      Login with Instagram
    </a>
  `);
});

app.get('/auth', async (req, res) => {
  const code = req.query.code;

  const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
    client_id: process.env.IG_CLIENT_ID,
    client_secret: process.env.IG_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.IG_REDIRECT_URI,
    code: code,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log(tokenResponse);
  
    accessToken = tokenResponse.data.access_token;
    userId = tokenResponse.data.user_id;
    res.send(`<h1>Access Token</h1><p>${accessToken}</p><h1>User ID</h1><p>${userId}</p>`);


    // res.send(`<a href="https://graph.facebook.com/v20.0/${userId}?fields=followers_count%2Cid%2Cusername&access_token=${accessToken}">
    //   Fetch Details
    // </a>`)
  
});





app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
