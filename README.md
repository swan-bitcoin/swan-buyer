## Swan Buyer - Swan Personal Access App Demo

This app uses the [Swan API](https://developers.swanbitcoin.com/) to automate a buying action from an existing dollar balance.
It is intended as a reference implementation to help developers understand the usage of asymmetric signed JWT tokens.

## Getting Started

Generate your keys

    openssl genrsa -out private.pem 4096
    openssl rsa -in private.pem -pubout -outform PEM -out public.pub

Visit your Swan Dashboard and register a new app. Copy the App ID.

Run this app

    AMOUNT_USD=100 APP_ID=[app id from above] yarn start

The app will pick up the private.pem key from this directory and use the APP_ID from the supplied command line to make a buy on your behalf.

WARNING: if you run this against the production API, it will actually make a
buy on your account (if you have a dollar balance)! In order to change to production
you will have to modify the URL string in the code to point to api.swanbitcoin.com.
