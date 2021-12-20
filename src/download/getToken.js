const axios = require('axios');

const getToken = async (e_mail, password) => {

  let res = await axios({
    url    : 'https://coursehunter.net/api/auth/login',
    method : 'put',
    headers: {
      'content-type'               : 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    data   : JSON.stringify({ e_mail: e_mail, password: password }),
  })

  if (res.data.token) return res.headers['set-cookie'][0] + '; accessToken=' + res.data.token;
  else throw new Error('not token from response ')

};

module.exports = getToken;
