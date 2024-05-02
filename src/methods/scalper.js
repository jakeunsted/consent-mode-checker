require('dotenv').config()
const fs = require('fs')
const launchBrowser = require('../configs/browser')

/**
 * Scrapes a webpage for HTML content and collects Google Analytics payloads.
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<{ html: string, payloads: string[] }>} - A promise that resolves to an object containing the scraped HTML content and an array of Google Analytics payloads.
 */
const scalper = async (url) => {
  console.log('Scraping URL: ', url);

  const browser = await launchBrowser()
  
  const page = await browser.newPage()

  let payloads = []
  // Listen for network requests
  page.on('request', async (request) => {
    // console.log('Request URL:', request.url());
    if (
      request.url().startsWith('https://region1.google-analytics.com/g/collect') ||
      request.url().startsWith('https://www.google-analytics.com/g/collect'))
    {
      const postData = await request.url().split('?')[1];
      payloads.push(postData);
    }
  });

  // Handle cookie consent dialog
  page.on('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());
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

  if (process.env.RUN_IN_DOCKER !== 'true') {
    // write the page source to a file
    fs.writeFileSync('page.html', html)
  
    // save payloads array to file
    fs.writeFileSync('payloads.json', JSON.stringify(payloads, null, 2));
  }

  return { html, payloads }
}

const consentInteractingScalper = async (url, acceptCookies) => {
  console.log((acceptCookies ? 'accepting' : 'rejecting') + ' cookies and scraping URL: ', url);

  /**
   * Launch browser and new page
   */
  const browser = await launchBrowser();
  const page = await browser.newPage();

  /**
   * Flag to check if analytics requests are recorded
   */
  let analyticsRequestsCompleted = false;

  /**
   * Go to the URL and wait for the page to load
   */
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 10000
  }).catch((error) => {
    return null;
  });

  /**
   * Need to try accept/reject cookies and rerun.
   * This will collect a different set of requests and gtag values.
   */
  await page.evaluate((acceptCookies) => {
    const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
    if (!elements.length) return 'No elements found';

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
    // console.log('page.evaluate result:', result);
  });

  /**
   * setup listener for network requests.
   * collect payloads for google analytics
   */
  let payloads = [];
  page.on('request', async (request) => {
    if (
      request.url().startsWith('https://region1.google-analytics.com/g/collect') ||
      request.url().startsWith('https://www.google-analytics.com/g/collect') ||
      request.url().startsWith('https://region1.analytics.google.com/g/collect'))
    {
      console.log('pushing payload');
      const postData = await request.url().split('?')[1];
      payloads.push(postData);
      analyticsRequestsCompleted = true;
    }
  });

  /**
   * refresh to page to capture new requests
   */
  await Promise.all([
    page.reload({
      waitUntil: 'networkidle2',
      timeout: 50000
    }).catch((error) => {
      return null;
    }),
    new Promise((resolve) => {
      if (analyticsRequestsCompleted) {
        resolve();
      } else {
        setTimeout(() => {
          console.warn('Analytics requests timed out');
          resolve();
        }, 50000);
      }
    }),
  ]);

  /**
   * get the html content of the page
   */
  const html = await page.content().catch((error) => {
    console.error('Error getting page HTML: ', error);
    return null;
  });

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
  }
};

const scalperConsentAccepted = async (url) => {
  return await consentInteractingScalper(url, true);
};

const scalperConsentRejected = async (url) => {
  return await consentInteractingScalper(url, false);
};

module.exports = {scalper, scalperConsentAccepted, scalperConsentRejected}
