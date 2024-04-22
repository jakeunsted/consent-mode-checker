const express = require('express');
const app = express();

// Import your Lambda handler function
const { handler } = require('./index-for-lambda');

// Parse JSON bodies for POST requests
app.use(express.json());

// Define a route to handle POST requests
app.post('/findConsent', async (req, res) => {
  try {
    // Simulate the structure of AWS Lambda event object
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };

    // Invoke your Lambda function handler
    const result = await handler(event);

    // Send the Lambda function response back to the client
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
