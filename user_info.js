const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.get('/user', async (req, res) => {
  try {
    const response = await axios.get(`https://api.instagram.com/v1/users/self/?access_token=${process.env.IG_ACCESS_TOKEN}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const userData = response.data;

    let debugInfo = '';
    if (req.query.debug) {
      debugInfo = `<pre>${JSON.stringify(userData, null, 2)}</pre>`;
    }

    res.send(`
      ${debugInfo}
      <img src="${userData.data.profile_picture}" alt="Profile Picture" />
      <br />
      <b>User Name: ${userData.data.username}</b>
      <br />
      <b>Posts: ${userData.data.counts.media}</b>
      <br />
      <b>Followers: ${userData.data.counts.followed_by}</b>
      <br />
      <b>Following: ${userData.data.counts.follows}</b>
      <br />
    `);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.send('Error fetching user info');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
