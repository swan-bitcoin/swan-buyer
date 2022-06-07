## Swan Buyer - Swan Personal Access App Demo

This app uses the [Swan API](https://developers.swanbitcoin.com/) to automate a buying action from an existing dollar balance.
It is intended as a reference implementation to help developers understand the usage of asymmetric signed JWT tokens.

## Getting Started

Generate ECDSA public/private key pair:

    openssl ecparam -name secp256k1 -genkey -noout -out private.pem
    openssl ec -in private.pem -pubout -out public.pem

Visit your Swan Dashboard and register a new app, pasting the contents of `public.pem`.
After saving, copy the App ID.

Run this app

    AMOUNT_USD=100 APP_ID=[app id from above] yarn start

## Private Key Management

The app will pick up the private.pem key from this directory and use the APP_ID from the supplied command line to make a buy on your behalf.

WARNING: if you run this against the production API, it will actually make a
buy on your account (if you have a dollar balance)! In order to change to production
you will have to modify the URL string in the code to point to api.swanbitcoin.com.

## Private Key Management - Production using AWS KMS

For production, we can generate a KMS key, so that you will never see the contents of the private key.
It will live in a secure enclave in AWS hardware.


Create asymmetric signing KMS key in AWS:
```
aws kms create-key --key-spec "ECC_SECG_P256K1" --key-usage "SIGN_VERIFY"
```

Output looks like this. Grab the KeyId, and the Arn for the next step:
```
{
    "KeyMetadata": {
        "AWSAccountId": "...",
        "KeyId": "92eb803b-0552-44f7-8ab8-8f3b746c5f1b",
        "Arn": "arn:aws:kms:us-east-1:123412341234:key/92eb803b-0552-44f7-8ab8-8f3b746c5f1b",
        …
        "CustomerMasterKeySpec": "ECC_SECG_P256K1",
        "KeySpec": "ECC_SECG_P256K1",
        "SigningAlgorithms": [
            "ECDSA_SHA_256"
        ],
        "MultiRegion": false
    }
}
```

Get the public key:
```
aws kms get-public-key --key-id 92eb803b-0552-44f7-8ab8-8f3b746c5f1b
```

Output looks like this:
```
{
    "KeyId": "arn:aws:kms:us-east-1:165441122072:key/1e5ad73d-57ff-4654-8434-4f800709e3bc",
    "PublicKey": "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEz3Yw+GVst7KCfJjYrMiDFEuw9ZaYxE1ZMfRk1Fq4OUQPpqsRM1bN8YdoX40ejUcTErfw06Moe5v/8H6MjpzVdA==",
    "CustomerMasterKeySpec": "ECC_SECG_P256K1",
    "KeySpec": "ECC_SECG_P256K1",
    "KeyUsage": "SIGN_VERIFY",
    "SigningAlgorithms": [
        "ECDSA_SHA_256"
    ]
}
```

Grab the `PublicKey` from the output and upload it on the swan developer page.
NOTE: You must add the BEGIN/END wrapper lines around your key for it to work properly:

Example:
```
-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAES2fmbcaOgPzmHlWVgPC6+I1pETB4SF+Z
ksLQPC/8PMJCVOLQbXWjVkCY0CzY6rTL3e1V2uEzouskCToOq9OykA==
-----END PUBLIC KEY-----
```

Run the command as follows, pointing to your key Arn:

    KMS_KEY_ARN=[Arn from above] AMOUNT_USD=100 APP_ID=[yourappid] yarn start


