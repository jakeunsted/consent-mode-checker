// wait for the page to finish loading script
document.addEventListener('DOMContentLoaded', function() {
  // const fetchUrl = 'https://14g1e1sr2f.execute-api.us-east-1.amazonaws.com/consent/consent'
  const fetchUrl = 'http://localhost:3000/findConsent'
  // Direct invocation of the function
  // const fetchUrl = 'https://w42bhjb7zvmspannm5jjoeg2ja0rwypp.lambda-url.us-east-1.on.aws/'

  // Search flag
  let searchingFlag = false

  /**
   * Creates an HTML element with an optional class name.
   *
   * @param {string|null} className - The class name to add to the element (optional).
   * @param {string} element - The type of HTML element to create.
   * @returns {HTMLElement} - The created HTML element.
   */
  const createElementWithClass = (className = null, element) => {
    const elem = document.createElement(element);
    if (className) {
      elem.classList.add(className);
    }
    return elem;
  }

  /**
   * If there is an error, we should display the error message
   * under the search button
   */
  const showError = (errorMessage) => {
    const errorDiv = createElementWithClass('error-div', 'div');
    errorDiv.innerHTML = errorMessage;
    headDiv.appendChild(errorDiv);
  }

  /**
   * Handles errors and displays an error message.
   *
   * @param {Error} error - The error object.
   * @param {string} message - The error message to display.
   */
  const handleError = (error, message) => {
    console.error(message, error);
    showError(message);
    searchingFlag = false;
    loadingDiv.style.display = 'none';
  }

  /**
   * POST request to fetch consent data
   */
  const fetchConsentData = async (url) => {
    const methods = [0, 1, 2];
  
    try {
      // Create an array of promises
      const promises = methods.map(method => fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls: [url],
          method: method
        }),
      }));
  
      // Use Promise.allSettled to wait for all fetches to complete in parallel
      const responses = await Promise.allSettled(promises);
  
      const responseData = responses.map(async (response) => {
        if (response.status === 'rejected') {
          throw new Error(`Error fetching data: ${response.reason}`);
        }
        return await response.value.json();
      });
  
      // Wait for all responses to be processed
      return await Promise.all(responseData);
    } catch (error) {
      handleError(error, 'Error fetching consent data');
      return null;
    }
  };

  /**
   * Removes existing div elements with specific class names.
   */
  const removeExistingDivs = () => {
    const responseBoxes = document.getElementsByClassName('response-box');
    while(responseBoxes[0]) {
      responseBoxes[0].parentNode.removeChild(responseBoxes[0]);
    }
  
    const errorDivs = document.getElementsByClassName('error-div');
    while(errorDivs[0]) {
      errorDivs[0].parentNode.removeChild(errorDivs[0]);
    }
  }

  // ID Of the input field
  let textInput = document.getElementById('text1714380325009')

  // ID of text input div
  let headDiv = document.getElementsByClassName('ak-grid-whole')[0]

  // disable Get in touch button
  document.getElementsByClassName('ak-submit')[0].disabled = true;

  // Search button under text input
  const searchButtonDiv = createElementWithClass('search-btn-div', 'div');
  searchButtonDiv.style.backgroundColor = '#428bca';
  const searchButtonText = createElementWithClass('search-btn', 'h5');
  const searchBtn = document.createTextNode('Search for consent')
  
  searchButtonText.setAttribute('id', 'search-btn');
  searchButtonText.appendChild(searchBtn);
  searchButtonDiv.appendChild(searchButtonText);
  headDiv.appendChild(searchButtonDiv);

  // Add loading div under search button
  const loadingDiv = createElementWithClass('loading-spinner', 'div');
  headDiv.appendChild(loadingDiv);

  /**
   * Displays consent values for a given URL.
   *
   * @param {Array} consentValues - An array of consent values.
   * @param {string} url - The URL for which the consent values are displayed.
   * @returns {void}
   */
  const showConsentValues = (consentValues, url) => {

    // Create a new div for the consent box
    const consentBoxDiv = document.createElement('div');
    consentBoxDiv.classList.add('response-box');
    
    // new header for url
    const urlHeader = document.createElement('h2');
    urlHeader.innerHTML = url;
    consentBoxDiv.appendChild(urlHeader);

    // Add GTM ID below URL if it exists
    if (consentValues[0][0].gtm) {
      const gtmHeader = document.createElement('h2');
      gtmHeader.innerHTML = 'GTM ID: ' + consentValues[0][0].gtm[0];
      consentBoxDiv.appendChild(gtmHeader);
    } else {
      const gtmNotFound = document.createElement('h2');
      gtmNotFound.innerHTML = 'GTM ID: Not Found';
      consentBoxDiv.appendChild(gtmNotFound);
    }

    for (const consentValueArray of consentValues) {
      try {
        const consentValue = consentValueArray[0]; // Accessing the object within the array

        console.log('consentValue in loop', consentValue);

        if (consentValue.error) {
          const errorDiv = createElementWithClass('failed', 'h2');
          errorDiv.innerHTML = consentValue.error;
          consentBoxDiv.appendChild(errorDiv);
        }

        if (!consentValue.method || !consentValue.consentMatches || !consentValue.payloadValues) {
          showError(consentValue.error || 'Error in fetching consent data');
          continue; // move to next iteration
        }

        console.log('consentValue', consentValue);

        const method = consentValue.method;
        const consentMatches = consentValue.consentMatches[0];
        const payloadValues = consentValue.payloadValues;
        const googleTag = consentValue.gtag;
      
        const consentDiv = createElementWithClass('consent-div', 'div');
        consentDiv.innerHTML = '<h3>Method: ' + method + '</h3>';
      
        const consentMatchesDiv = createElementWithClass('consent-matches', 'div');
        const consentMatchesText = document.createElement('p');
        consentMatchesText.innerHTML = '<b>Consent Matches: </b>' + JSON.stringify(consentMatches);
        consentMatchesDiv.appendChild(consentMatchesText);
      
        const payloadValuesDiv = createElementWithClass('payload-values', 'div');
        const payloadValuesText = document.createElement('p');
        payloadValuesText.innerHTML = '<b>Payload Values:</b>';
        payloadValuesDiv.appendChild(payloadValuesText);
      
        const payloadValuesPre = document.createElement('pre');
        payloadValuesPre.textContent = JSON.stringify(payloadValues, null, 2); // Indent with 2 spaces
        payloadValuesDiv.appendChild(payloadValuesPre);

        // Add gtag in the same way as payload
        if (method === 'No Cookies Interaction Check') {
          const gtagDiv = createElementWithClass('gtag-div', 'div');
          const gtagText = document.createElement('p');
          gtagText.innerHTML = '<b>Google Tag:</b>';
          gtagDiv.appendChild(gtagText);

          const gtagPre = document.createElement('pre');
          gtagPre.textContent = JSON.stringify(googleTag, null, 2); // Indent with 2 spaces
          gtagDiv.appendChild(gtagPre);

          consentDiv.appendChild(gtagDiv);
        }
        
        consentDiv.appendChild(consentMatchesDiv);
        consentDiv.appendChild(payloadValuesDiv);

        consentBoxDiv.appendChild(consentDiv);
      }  catch (error) {
        handleError(error, 'Error in handling consent data');
        continue;
      } finally {
        // append below search button
        headDiv.appendChild(consentBoxDiv);
      }
    }
  }

  // Add event listener to search button
  searchButtonDiv.addEventListener('click', async () => {
    if (!searchingFlag) {
      searchingFlag = true;
      loadingDiv.style.display = 'block';

      let urls = textInput.value.split(',').map(url => url.trim());

      // Fetch consent data for each URL concurrently
      const consentResults = await Promise.allSettled(urls.map(async (url) => {
        if (url) {
          const consentValues = await fetchConsentData(url);
          return { url, consentValues };
        } else {
          return { url, error: 'No URL provided'};
        }
      }));

      // Process the results
      for (const result of consentResults) {
        if (result.status === 'fulfilled') {
          if (result.value.consentValues) {
            showConsentValues(result.value.consentValues, result.value.url, result.value.gtm);
          } else if (result.value.error) {
            handleError(result.value.error, result.value.url);
          }
        } else {
          console.error('Error fetching consent data:', result.reason);
        }
      }

      searchingFlag = false;
      loadingDiv.style.display = 'none';
    } else {
      console.log('Already searching');
    }
  });


});
