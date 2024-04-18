const findConsent = require('./methods/findConsent')

/**
 * Handles an array of URLs.
 * 
 * @param {string[]} urls - The array of URLs to process.
 * @returns {Promise<void>} - A promise that resolves when all URLs have been processed.
 */
const handleUrls = async (urls) => {
  console.log('Processing ', urls.length, ' URL(s)')
  for (const url of urls) {
    try {
      await findConsent(url)
    } catch (error) {
      console.error(error)
    }
  }
}

// Local test version
(async () => {
  try {
    await handleUrls([
      'https://www.coventry.ac.uk/',
      // 'https://www.york.ac.uk/',
      // 'http://essex.ac.uk/',
      // 'https://www.uwtsd.ac.uk/',
      // 'https://tedi-london.ac.uk/',
      // 'https://www.qub.ac.uk/',
      // 'https://www.gre.ac.uk/',
    ])
  } catch (error) {
    console.error(error)
  } 
  finally {
    process.exit()
  }
})()
