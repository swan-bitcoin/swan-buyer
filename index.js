const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid').v4;

const appId = process.env.APP_ID;
const purchaseAmountUsd = process.env.AMOUNT_USD;

const createApiToken = ({ scopes }) => {
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
    scopes
  }

  // In this demo, we're reading the private key from the file system (see README.md for how to generate this key)
  //
  // DO NOT DO THIS in production. Read about securing your key here:
  // https://developers.swanbitcoin.com/docs/personal-access/authentication#securing-private-keys
  const privateKey = fs.readFileSync("private.pem")

  return jwt.sign(payload, privateKey, {algorithm: 'RS256', expiresIn: '5s'});
}

const makeRequest = async ({ scopes, url, params}) => {
  const token = createApiToken({scopes});
  const authorizationHeader = `Bearer ${token}`;

  try {
    let response = await axios.post(url, params, { headers: {'Authorization': authorizationHeader}});

    return response;
  } catch (e) {
    if (e.response) {
      console.warn(e.response.data);
      return e.response
    } else {
      console.error(e);
      return null;
    }
  }
}

(async() => {
  const marketBuyResponse = await makeRequest({
    url: 'https://api.dev.swanbitcoin.com/integrations/v20220222/trades/execute/market',
    params: {
      fundsType: 'balance',
      purchaseAmountUsd
    },
    scopes: ['write:trades']
  });

  if (marketBuyResponse) {
    console.log("Bought", marketBuyResponse.data.btcAmount, "BTC");
  }
})();
