require('dotenv').config();
const express = require('express');
const cors = require('cors');
const findConsent = require('./src/methods/findConsent');

const handleUrls = async (urls, method) => {
  console.log('Processing', urls.length, 'URL(s)');
  const values = [];
  for (const url of urls) {
    try {
      const result = await findConsent(url, method);
      values.push(result);
    } catch (error) {
      console.error(error);
      throw { message: 'Internal Server Error', statusCode: error.statusCode || 500 };
    }
  }
  return values;
};

/**
 * Conditional logic for running in Docker container
 * If not running in Docker, start an Express server
 * If running in Docker, export the handler for AWS Lambda
 */
if (process.env.RUN_IN_DOCKER === 'false') {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Middleware to handle JSON parsing errors
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ message: 'Invalid JSON' });
    }
    next();
  });

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
      const {urls, method} = req.body;
  
      // Check if urls and method are provided
      // if (!urls || !method) {
      //   return res.status(400).json({ message: 'URLs and method are required' });
      // }
  
      const scalpedValues = await handleUrls(urls, method);
      console.log('Scalped values:', scalpedValues);

      console.timeEnd('Processing URLs')
  
      if (scalpedValues.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }
  
      res.json(scalpedValues);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
    }
  });

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
