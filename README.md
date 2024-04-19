# Consent Mode Scalper
\
A puppeteer script and server to scalp websites for their consent mode setup. The function will return the gtag setup, consent mode provider and payload values GCS & GCD

## How to install
`node version 18.18.2` \
`npm version 9.8.1` \
`npm i` 

## How to run/use
`npm run start` \
This starts an express server on post 3001. Make a POST request to localhost:3001/findConsent with an example body like: \
```
[
  'https://example.com',
  'https://anotherexample.co.uk'
]
```