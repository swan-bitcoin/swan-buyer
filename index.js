const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid').v4;

const appId = process.env.APP_ID;
const purchaseAmountUsd = process.env.AMOUNT_USD;

(async() => {
  // Example payload to make a trading (buy Bitcoin) request
  const payload = {
    iss: appId, // who you claim to be
    jti: uuid(), // unique nonce 
    aud: 'swanbitcoin.com', // who the token is intended for
    scopes: ["write:trades", "read:trade_quotes"] // what permissions are requested
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

    console.log(response.body);
  } catch (e) {
    if (e.response) {
      console.log(e.response.data);
    } else {
      console.log(e);
    }
  }

})();
