require('dotenv').config()
const fs = require('fs')
const launchBrowser = require('../configs/browser')
const path = require('path');
const constants = require(path.join(__dirname, '..', 'constants.json'));

require('dotenv').config()
const debug = process.env.DEBUG
console.log('DEBUG:', debug);

/**
 * Scrapes a webpage for HTML content and collects Google Analytics payloads.
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<{ html: string, payloads: string[] }>} - A promise that resolves to an object containing the scraped HTML content and an array of Google Analytics payloads.
 */
const scalper = async (url) => {
  if (debug) console.log('Scraping URL: ', url);

  const browser = await launchBrowser()
  
  const page = await browser.newPage()

  let payloads = []
  // Listen for network requests
  page.on('request', async (request) => {
    // if (debug) console.log('Request URL:', request.url());
    if (
      constants.analyticsURLs.some(url => request.url().startsWith(url))
    ){
      const postData = await request.url().split('?')[1];
      payloads.push(postData);
    }
  });

  // Handle cookie consent dialog
  page.on('dialog', async dialog => {
    if (debug) console.log('Dialog message:', dialog.message());
    await dialog.accept();
  });

  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 15000
  }).catch((error) => {
    return null
  })

  html = await page.content().catch((error) => {
    console.error('Error getting page content: ', error)
    return null
  })

  await browser.close()

  // If not running in docker, write the page source to a file
  if (process.env.RUN_IN_DOCKER !== 'true') {
    // write the page source to a file
    fs.writeFileSync('page.html', html)
  
    // save payloads array to file
    fs.writeFileSync('payloads.json', JSON.stringify(payloads, null, 2));
  }

  return { html, payloads }
}

/**
 * Function to interact with a webpage to accept or reject cookies.
 * @param {string} url 
 * @param {boolean} acceptCookies - True or False, whether to accept or reject cookies on the page.
 * @returns {Promise<{ html: string, payloads: string[] }>} - A promise that resolves to an object containing the scraped HTML content and an array of Google Analytics payloads.
 */
const consentInteractingScalper = async (url, acceptCookies) => {
  if (debug) console.log((acceptCookies ? 'accepting' : 'rejecting') + ' cookies and scraping URL: ', url);

  /**
   * Launch browser and new page
   */
  const browser = await launchBrowser();
  const page = await browser.newPage();

  /**
   * Go to the URL and wait for the page to load
   */
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 10000
  }).catch((error) => {
    console.error('Error navigating to page: ', error);
    return null;
  });

  /**
   * Need to try accept/reject cookies and rerun.
   * This will collect a different set of requests and gtag values.
   */
  await page.evaluate((acceptCookies) => {
    const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
    if (!elements.length) return false;

    const keyword = acceptCookies ? 'accept' : 'reject';
    const foundElement = elements.find(element => {
      const text = element.innerText.toLowerCase();
      if (text.includes(keyword) || text.includes(keyword + ' cookies')) {
        console.log('Consent element found: ', element);
        element.click();
        return true; // Element found and clicked, return true
      }
      return false;
    });

    return foundElement ? 'Consent element clicked' : 'No consent element found';
  }, acceptCookies).then(result => {
    if (debug) console.log('page.evaluate result:', result);
  });

  /**
   * setup listener for network requests.
   * collect payloads for google analytics
   */
  const payloads = [];
  let analyticsRequestsCompleted = false;

  /**
   * Handles the incoming request and performs necessary actions.
   *
   * @param {Request} request - The incoming request object.
   * @returns {Promise<void>} - A promise that resolves once the request is handled.
   */
  const handleRequest = async (request) => {
    if (
      constants.analyticsURLs.some(url => request.url().startsWith(url))
    ) {
      const postData = await request.url().split('?')[1];
      payloads.push(postData);
      analyticsRequestsCompleted = true;
    }
  };

  /**
   * get the html content of the page
   */
  const html = await page.content().catch((error) => {
    console.error('Error getting page HTML: ', error);
    return null;
  });
  
  /**
   * refresh to page to capture new requests
   */
  await Promise.all([
    page.reload({ waitUntil: 'networkidle2', timeout: 30000 }),
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);

  // Create a promise to track relevant requests
  let analyticsRequestsCompletedPromise = new Promise((resolve) => {
    page.on('request', async (request) => {
      await handleRequest(request);

      // Conditionally resolve the promise if it's an analytics request
      if (constants.analyticsURLs.some(url => request.url().startsWith(url))) {
        resolve(); 
      }
    });
  });
  // Wait for analytics requests to complete
  await analyticsRequestsCompletedPromise; 

  if (process.env.RUN_IN_DOCKER !== 'true') {
    // write the page source to a file
    fs.writeFileSync('page.html', html)
  
    // save payloads array to file
    fs.writeFileSync('payloads.json', JSON.stringify(payloads, null, 2));
  }

  /**
   * check if the analytics requests completed.
   * if so, close the browser and return the html and payloads.
   * if not, log a warning and close the browser.
   */
  if (analyticsRequestsCompleted) {
    await browser.close().catch((error) => {
      console.error('Error closing browser: ', error);
      return null;
    });
    return { html, payloads };
  } else {
    // Analytics requests did not complete, log a warning and close the browser
    console.warn('Analytics requests did not complete within the timeout period for URL: ', url);
    await browser.close().catch((error) => {
      console.error('Error closing browser: ', error);
      return null;
    });
    return { html, payloads };
  }
};

/**
 * Accepts the consent for the given URL using the consentInteractingScalper function.
 * @param {string} url - The URL for which the consent is accepted.
 * @returns {Promise} - A promise that resolves when the consent is accepted.
 * Contains the HTML content and Google Analytics payloads.
 */
const scalperConsentAccepted = async (url) => {
  return await consentInteractingScalper(url, true);
};

/**
 * Handles the case when consent is rejected for the scalper.
 *
 * @param {string} url - The URL to interact with for consent rejection.
 * @returns {Promise} - A promise that resolves when the consent rejection is handled.
 * Contains the HTML content and Google Analytics payloads.
 */
const scalperConsentRejected = async (url) => {
  return await consentInteractingScalper(url, false);
};

module.exports = {scalper, scalperConsentAccepted, scalperConsentRejected}
