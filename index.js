const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid').v4;

const appId = process.env.APP_ID;
const purchaseAmountUsd = process.env.AMOUNT_USD;

(async() => {
  // Example payload to make a trading (buy Bitcoin) request
  const payload = {
    iss: appId,
    jti: uuid(),
    aud: 'swanbitcoin.com',
    scopes: ["write:trades"]
  }

  // In this demo, we're reading the private key from the file system
  // and storing it in git.  DO NOT DO THIS in production. Read about securing your key here:
  // https://developers.swanbitcoin.com/docs/personal-access/authentication#securing-private-keys
  const privateKey = fs.readFileSync("private.pem")

  const token = jwt.sign(payload, privateKey, {algorithm: 'RS256', expiresIn: '5s'});

  // make your API request
  const url = 'https://dev-api.swanbitcoin.com/integrations/v20220222/trades/execute/market';
  
  let response;

  try {
    response = await axios.post(url, 
      { 
        fundsType: 'balance', 
        purchaseAmountUsd
      }, 
      { headers: {'Authorization': `Bearer ${token}`}}
    );

    console.log(response);
  } catch (e) {
    console.error(e);
  }

})();
