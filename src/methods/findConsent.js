const validUrl = require('./validUrl')
const scalper = require('./scalper')
const {findConsentGtag, findConsentProvider, filterPayloads} = require('./filters')

/**
 * Finds consent information from a given URL.
 * 
 * @param {string} url - The URL to scrape for consent information.
 * @throws {Error} If the URL is invalid or if there is an error scraping the URL.
 */
async function findConsent(url){
  const values = {}

  if (!validUrl(url)) {
    console.log('Invalid URL')
    throw new Error('Invalid URL')
  }

  values.url = url
  
  const scalped = await scalper(url)
  const source = scalped.html
  const payloads = scalped.payloads

  if (!source) {
    console.log('Error scraping URL')
    throw new Error('Error scraping URL')
  }

  const matches = findConsentGtag(source)
  if (matches) {
    // console.log('Gtag matches: ', matches)
    values.gtag = matches
  } else {
    console.log('No GTag found')
  }

  const consentMatches = findConsentProvider(source)
  if (consentMatches) {
    // console.log('Consent providers: ', consentMatches)
    values.consentMatches = consentMatches
  } else {
    console.log('No consent provider found')
  }

  const payloadValues = filterPayloads(payloads)
  if (payloadValues) {
    // console.log('Payload values: ', payloadValues)
    values.payloadValues = payloadValues
  } else {
    console.log('No payload values found')
  }

  console.log('Values: ', values);
  return values
}

module.exports = findConsent;