# Consent Mode Scalper
\
A puppeteer script and server to scalp websites for their consent mode setup. The function will return the gtag setup, consent mode provider and payload values GCS & GCD

## How to install
`node version >=18.18.2` \
`npm version >=9.8.1` \
`npm i` 

## How to run/use
`npm run start` \
This starts an express server on post 3001. Make a POST request to localhost:3001/findConsent with an example body like: 

```
{
  "urls: [
    'https://example.com',
  ],
  "method": 0
}
```

## Remote through postman

`POST: https://14g1e1sr2f.execute-api.us-east-1.amazonaws.com/consent/consent` \

Body:
```
{
  "urls: [
    'https://example.com',
  ],
  "method": 0
}
```

## Build on AWS

The .github/actions has the relevant docker build setup. This will push to a pre-created ECR on AWS - this is gathered from repo secrets.

### Create API Gateway

A new API resource will need to be created. This will need a GET and OPTIONS methods, options are required for CORS. GET request needs to be set to call lambda function. I've generally set timeout of route to default 29s.

### Lambda function

The lambda function needs to be built from an ECR image, the image must be in ECR before the lambda function can be created. Once it's created, github actions will automatically update the lambda function.

The lambda function will need to be configured with at least 1GB of ram.
