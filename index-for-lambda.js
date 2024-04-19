const findConsent = require('./methods/findConsent')

/**
 * Handles an array of URLs.
 * 
 * @param {string[]} urls - The array of URLs to process.
 * @returns {Promise<void>} - A promise that resolves when all URLs have been processed.
 */
const handleUrls = async (urls) => {
  console.log('Processing ', urls.length, ' URL(s)')
  const values = []
  for (const url of urls) {
    try {
      values.push(await findConsent(url))
    } catch (error) {
      console.error(error)
      return ['error processing URL(s)']
    }
  }
  return values
}

modules.exports = {
  handler: async (event) => {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      }
    }

    const urls = JSON.parse(event.body)
    const scalpedValues = await handleUrls(urls)
    return {
      statusCode: 200,
      body: JSON.stringify(scalpedValues)
    }
  }
}