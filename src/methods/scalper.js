require('dotenv').config()
const fs = require('fs')
const browserConfig = require('../configs/browser')

/**
 * Scrapes a webpage for HTML content and collects Google Analytics payloads.
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<{ html: string, payloads: string[] }>} - A promise that resolves to an object containing the scraped HTML content and an array of Google Analytics payloads.
 */
const scalper = async (url) => {
  console.log('Scraping URL: ', url);

  const browser = await browserConfig()
  
  const page = await browser.newPage()

  let payloads = []
  // Listen for network requests
  page.on('request', async (request) => {
    console.log('Request URL:', request.url());
    if (
      request.url().startsWith('https://region1.google-analytics.com/g/collect') ||
      request.url().startsWith('https://google-analytics.com/g/collect'))
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
    waitUntil: 'networkidle2',
    timeout: 15000
  }).catch((error) => {
    return null
  })

  await page.waitForSelector('body');

  html = await page.content().catch((error) => {
    console.error('Error getting page content: ', error)
    return null
  })

  if (process.env.RUN_IN_DOCKER !== 'true') {
    // write the page source to a file
    fs.writeFileSync('page.html', html)
  
    // save payloads array to file
    fs.writeFileSync('payloads.json', JSON.stringify(payloads, null, 2));
  }

  await browser.close().catch((error) => {
    console.error('Error closing browser: ', error)
  })

  console.log('scalper payloads: ', payloads);

  return { html, payloads }
}

module.exports = scalper
