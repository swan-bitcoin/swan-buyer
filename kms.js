const base64url = require('base64url');
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


const kmsSign = async({headers, payload, key_arn}) => {
    const AWS = require("aws-sdk");
    const kms = new AWS.KMS({
        region: 'us-east-1'
    });

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

module.exports = { kmsSign }
