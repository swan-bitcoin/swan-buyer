const AWS = require("aws-sdk");
const kms = new AWS.KMS({
  region: 'us-east-1'
});

const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid').v4;
const base64url = require('base64url');

const appId = process.env.APP_ID;
const purchaseAmountUsd = process.env.AMOUNT_USD;

const key_arn = "arn:aws:kms:us-east-1:165441122072:key/6c295223-543e-4bef-99c6-b0121d99d176";

const asn1 = require('asn1.js');

const EcdsaDerSig = asn1.define('ECPrivateKey', function() {
  return this.seq().obj(
    this.key('r').int(),
    this.key('s').int()
  );
});

function asn1SigSigToConcatSig(asn1SigBuffer) {
  const rsSig = EcdsaDerSig.decode(asn1SigBuffer, 'der');
  return Buffer.concat([
    rsSig.r.toArrayLike(Buffer, 'be', 32),
    rsSig.s.toArrayLike(Buffer, 'be', 32)
  ]);
}


const kmsSign = async(headers, payload) => {
  payload.iat = Math.floor(Date.now() / 1000);
  payload.exp = payload.iat + 5

  let token_components = {
    header: base64url(JSON.stringify(headers)),
    payload: base64url(JSON.stringify(payload)),
  };

  let message = Buffer.from(token_components.header + "." + token_components.payload)

  let res = await kms.sign({
    Message: message,
    KeyId: key_arn,
    SigningAlgorithm: 'ECDSA_SHA_256',
    MessageType: 'RAW'
  }).promise()

  let buff = new Buffer(res.Signature.toString('base64'), 'base64');

  // KMS returns keys in asn1 format. We need to convert them to make the server happy
  const concatSig = asn1SigSigToConcatSig(buff);

  token_components.signature = concatSig.toString("base64")
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return token_components.header + "." + token_components.payload + "." + token_components.signature;
}

const createApiToken = async ({ scopes }) => {
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

  return await kmsSign(
    {alg: 'ES256', typ: 'JWT'},
    payload
  );
}

const makeRequest = async ({ scopes, url, params}) => {
  const token = await createApiToken({scopes});

  console.log({token});
  console.log({decoded: jwt.decode(token)});

  // Bug right here - KMS is giving us a 71 byte signature instead of 64 bytes
  console.log({verified: jwt.verify(token, `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE924UHsh62Rx6Ddk8/926U+OMMAGxoVs/
M/zbYMeBb61mlPpceoXEgX9cpaXr9iUawiD4oLXDvHdKU6nEOwP+JQ==
-----END PUBLIC KEY-----`)});

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
