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

/**
 * Filters payloads and extracts relevant information.
 * 
 * @param {string[]} payloads - An array of payloads to be filtered.
 * @returns {Object} - An object containing the filtered information.
 */
function filterPayloads (payloads) {
  const gcsExplain = {
    "G100": "No consent has been granted.",
    "G110": "Google Ads has consent, Google Analytics does not.",
    "G101": "Google Analytics has consent, Google Ads does not.",
    "G111": "Both Google Ads and Google Analytics have consent.",
    "G1--": "The site did not require consent for ad_storage or analytics_storage."
  }
  const gcdExplain = {
    "l": "The signal has not been set with Consent Mode.",
    "p": "Denied by default (no update).",
    "q": "Denied both by default and after update.",
    "t": "Granted by default (no update).",
    "r": "Denied by default and granted after update.",
    "m": "Denied after update (no default).",
    "n": "Granted after update (no default).",
    "u": "Granted by default and denied after update.",
    "v": "Granted both by default and after update."
  }
  const object = {
    "gcs": "",
    "gcd": "",
  }
  for (let payload of payloads) {
    const params = payload.split('&')
    for (let param of params) {
      const [key, value] = param.split('=')
      if (key === 'gcs') {
        object.gcs = `${value} - ${gcsExplain[value]}`
      }
      if (key === 'gcd') {
        let types = [
          'ad_storage',
          'analytics_storage',
          'ad_user_data',
          'ad_personalization'
        ];
      
        // Remove numbers from the string
        const cleanString = value.replace(/\d+/g, '');
        const values = cleanString.split('');
        let gcdObject = {};

        gcdObject.value = value;
      
        for (let i = 0; i < values.length; i++) {
          gcdObject[types[i]] = gcdExplain[values[i]];
        }
      
        object.gcd = gcdObject;
      }
      
    }
  }

  return object
}

module.exports = {findConsentGtag, findConsentProvider, filterPayloads}