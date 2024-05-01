require('dotenv').config();
const express = require('express');
const cors = require('cors');
const findConsent = require('./src/methods/findConsent');

const app = express();
app.use(cors());
app.use(express.json());

const handleUrls = async (urls, method) => {
  console.log('Processing', urls.length, 'URL(s)');
  const values = [];
  for (const url of urls) {
    try {
      const result = await findConsent(url, method);
      values.push(result);
    } catch (error) {
      console.error(error);
      return ['Error processing URL(s)'];
    }
  }
  return values;
};

/**
 * Methods
 * 0 - scalper
 * 1 - scalperConsentAccepted
 * 2 - scalperConsentRejected
 */

// Common route handler
app.post('/findConsent', async (req, res) => {
  try {
    console.time('Processing URLs')

    console.log('Request body:', req.body);
    const {urls} = req.body;
    const {method} = req.body;

    const scalpedValues = await handleUrls(urls, method);

    console.timeEnd('Processing URLs')
    res.send(scalpedValues);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}); 

// Conditional logic for AWS Lambda
if (process.env.RUN_IN_DOCKER === 'false') {
  // Run in Docker
  const port = 3000;
  app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
  });
} else {
  // Export for AWS Lambda
  exports.handler = async (event) => {
    try {
      const { urls } = JSON.parse(event.body);
      const { method } = JSON.parse(event.body);
      const scalpedValues = await handleUrls(urls, method);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify(scalpedValues)
      };
    } catch (error) {
      console.error('Error processing request:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' })
      };
    }
  };
}
