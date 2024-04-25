const validUrl = require('./validUrl')
const {scalper, scalperConsentAccepted, scalperConsentRejected} = require('./scalper')
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

  const consentedScalped = await scalperConsentAccepted(url)
  const consentedSource = consentedScalped.html
  const consentedPayloads = consentedScalped.payloads

  const rejectedScaled = await scalperConsentRejected(url)
  const rejectedSource = rejectedScaled.html
  const rejectedPayloads = rejectedScaled.payloads

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

  if (consentedScalped) {
    const consentedPayloadValues = filterPayloads(consentedPayloads)
    if (consentedPayloadValues) {
      console.log('Consented Payload Values: ', consentedPayloadValues);
      values.consentedPayloadValues = consentedPayloadValues
    } else {
      console.log('No consented payload values found')
    }
  }

  if (rejectedScaled) {
    const rejectedPayloadValues = filterPayloads(rejectedPayloads)
    if (rejectedPayloadValues) {
      console.log('Rejected Payload Values: ', rejectedPayloadValues);
      values.rejectedPayloadValues = rejectedPayloadValues
    } else {
      console.log('No rejected payload values found')
    }
  }

  console.log('Final Values: ', values);
  return values
}

module.exports = findConsent;