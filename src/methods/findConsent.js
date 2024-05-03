const validUrl = require('./validUrl')
const {scalper, scalperConsentAccepted, scalperConsentRejected} = require('./scalper')
const {findConsentGtag, findConsentProvider, filterPayloads} = require('./filters')

/**
 * Finds consent information for a given URL using different methods.
 * @param {string} url - The URL to scrape for consent information.
 * @param {number} [method=0] - The method to use for scraping consent information.
 *                              0 - scalper
 *                              1 - scalperConsentAccepted
 *                              2 - scalperConsentRejected
 * @returns {Promise<Object>} - An object containing the scraped consent information.
 * @throws {Error} - If the URL is invalid or the method is invalid.
 */
async function findConsent(url, method = 0){
  const values = {}

  // Check if the URL is valid
  if (!validUrl(url)) {
    console.log('Invalid URL')
    throw new Error('Invalid URL')
  }

  values.url = url

  let scalped
  let source
  let payloads
  
  /**
   * Methods
   * 0 - scalper
   * 1 - scalperConsentAccepted
   * 2 - scalperConsentRejected
   */
  switch (method) {
    case 0:
      values.method = 'No Cookies Interaction Check'
      scalped = await scalper(url)
      source = scalped.html
      payloads = scalped.payloads
      break;
    case 1:
      values.method = 'Accepting Cookies Check'
      scalped = await scalperConsentAccepted(url)
      source = scalped.html
      payloads = scalped.payloads
      break;
    case 2:
      values.method = 'Rejecting Cookies Check'
      scalped = await scalperConsentRejected(url)
      source = scalped.html
      payloads = scalped.payloads
      break;
    default:
      console.log('Invalid method');
      throw new Error('Invalid method');
  }

  if (!source) {
    console.log('Error scraping URL')
    throw new Error('Error scraping URL')
  }

  const matches = findConsentGtag(source)
  if (matches) {
    values.gtag = matches
  } else {
    console.log('No GTag found')
  }

  const consentMatches = findConsentProvider(source)
  if (consentMatches) {
    values.consentMatches = consentMatches
  } else {
    console.log('No consent provider found')
  }

  const payloadValues = filterPayloads(payloads)
  if (payloadValues) {
    values.payloadValues = payloadValues
  } else {
    console.log('No payload values found')
  }

  console.log('Final Values: ', values);
  return values
}

module.exports = findConsent;