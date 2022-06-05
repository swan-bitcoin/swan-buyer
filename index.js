const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid').v4;

const appId = process.env.APP_ID;
const purchaseAmountUsd = process.env.AMOUNT_USD;

(async() => {
  // Example payload to make a trading (buy Bitcoin) request
  const payload = {
    // iss: Who you claim to be. Our server will validate this using the public key you uploaded, and the private key you used to sign this message below
    iss: appId,
    // jti: Unique nonce. Generate a new value per request (no code modifications are necessary, you can use uuid())
    // This is used to prevent replay attacks.
    jti: uuid(), 
    // aud: who the token is intended for. If you issue tokens for multiple destinations with the same private key
    // this, along with aud validation by other resource servers, will mitigate token reuse between multilpe resource servers
    aud: 'https://api.swanbitcoin.com',
    // scopes: What access you are requesting. This should correspond to the API you are calling.
    scopes: ["write:trades", "read:trade_quotes"] // what permissions are requested
  }

  // In this demo, we're reading the private key from the file system (see README.md for how to generate this key)
  //
  // DO NOT DO THIS in production. Read about securing your key here:
  // https://developers.swanbitcoin.com/docs/personal-access/authentication#securing-private-keys
  const privateKey = fs.readFileSync("private.pem")

  const token = jwt.sign(payload, privateKey, {algorithm: 'RS256', expiresIn: '5s'});

  // make your API request
  const url = 'https://api.dev.swanbitcoin.com/integrations/v20220222/trades/execute/market';

  let response;

  try {
    response = await axios.post(url, 
      { 
        fundsType: 'balance', 
        purchaseAmountUsd
      }, 
      { headers: {'Authorization': `Bearer ${token}`}}
    );

    console.log(response.data);
  } catch (e) {
    if (e.response) {
      console.log(e.response.data);
    } else {
      console.log(e);
    }
  }

})();
