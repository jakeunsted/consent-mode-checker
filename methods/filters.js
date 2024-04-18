/**
 * Filter for finding source GTag values
 */
function findConsentGtag (source) {
  let gtagValues = []

  // GTag regex pattern
  // let pattern = /gtag\("consent", "(?:default|update)",\s*{([\s\S]*?)\}\s*\);/g;
  let pattern = /gtag\(["']consent["'], ["'](default|update)["'],\s*{([\s\S]*?)\}\s*\);/g;
  let matches = source.match(pattern)

  if (matches) {
    for (let match of matches) {
      // Define a new regex pattern to match only the contents inside the object
      let objectPattern = /\{[^}]+\}/
      let objectMatch = match.match(objectPattern)[0]

      // remove trailing comma on last property in object
      // objectMatch = objectMatch.replace(/,(?=[^,]*$)/, '')
      objectMatch = objectMatch.replace(/,(?=\s*})/, '');

      // Add double quotes around keys
      let jsonString = objectMatch.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');

      // Replace single quotes with double quotes
      jsonString = jsonString.replace(/'/g, '"');

      // console.log('JSON String: ', jsonString);

      consentObject = JSON.parse(jsonString)
      gtagValues.push(consentObject)
    }
  } else {
    return null
  }

  return gtagValues
}

/**
 * find the consent mode provider
 */
function findConsentProvider (source) {
  let providers = [
    'commandersact',
    'complianz',
    'consentmanager',
    'cookiefirst',
    'cookieinformation',
    'cookiebot',
    'cookiescript',
    'cookieyes',
    'didomi',
    'iubenda',
    'onetrust',
    'osano',
    'secureprivacy',
    'sirdata',
    'termly',
    'usercentrics',
  ]

  // Match all provider names in the source
  let matches = providers.filter(provider => source.includes(provider))

  return matches
}

function filterPayloads (payloads) {
  const object = {
    "gcs": "",
    "gcd": "",
  }
  // get gcs and gcd unique values from payloads array.
  // array contains url parameters
  // we just need to save gcs and gcd values
  // in the object
  for (let payload of payloads) {
    const params = payload.split('&')
    for (let param of params) {
      const [key, value] = param.split('=')
      if (key === 'gcs') {
        object.gcs = value
      }
      if (key === 'gcd') {
        object.gcd = value
      }
    }
  }
  // console.log('gcs gcd object: ', object);
  return object
}

module.exports = {findConsentGtag, findConsentProvider, filterPayloads}