const findConsent = require('./methods/findConsent')
const express = require('express')
const cors = require('cors')

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

const app = express()

app.use(cors())
app.use(express.json());

const port = 3001
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/findConsent', async (req, res) => {
  // body will have an array of urls
  console.log('Request body: ', req.body);
  const urls = req.body
  const scalpedValues = await handleUrls(urls)
  res.send(scalpedValues)
})

// Local test version
// (async () => {
//   try {
//     await handleUrls([
//       'https://www.coventry.ac.uk/',
//       // 'https://www.york.ac.uk/',
//       // 'http://essex.ac.uk/',
//       // 'https://www.uwtsd.ac.uk/',
//       // 'https://tedi-london.ac.uk/',
//       // 'https://www.qub.ac.uk/',
//       // 'https://www.gre.ac.uk/',
//     ])
//   } catch (error) {
//     console.error(error)
//   } 
//   finally {
//     process.exit()
//   }
// })()
