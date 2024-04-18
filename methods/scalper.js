const chromium = require('@sparticuz/chromium')
const puppeteerCore = require('puppeteer-core')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer') // Local
const fs = require('fs')

puppeteer.use(StealthPlugin())

/**
 * Scrapes a webpage for HTML content and collects Google Analytics payloads.
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<{ html: string, payloads: string[] }>} - A promise that resolves to an object containing the scraped HTML content and an array of Google Analytics payloads.
 */
const scalper = async (url) => {
  console.log('Scraping URL: ', url);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath(), // Local
    // executablePath: await chromium.executablePath(), // Aws
    headless: true
  }).catch((error) => {
    console.error('Error launching browser: ', error)
    return null
  })
  
  const page = await browser.newPage()

  let payloads = []
  // Listen for network requests
  page.on('request', async (request) => {
    if (request.url().startsWith('https://region1.google-analytics.com/g/collect')) {
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
    timeout: 10000
  }).catch((error) => {
    return null
  })

    // Evaluate and click on the cookie consent button
    // need to turn into an array of buttons
    // to accept cookies
  // await page.waitForSelector('.CybotCookiebotDialogBodyButton', { visible: true }).then(async () => {
  //   console.log('Cookie button found');
  //   await page.click('.CybotCookiebotDialogBodyButton');
  // }).catch(() => {
  //   console.log('Cookie button not found');
  // });

  await page.waitForSelector('body');

  html = await page.content().catch((error) => {
    console.error('Error getting page content: ', error)
    return null
  })

  // await page.reload().catch((error) => {
  //   console.error('Error reloading page: ', error)
  // })

  // write the page source to a file
  fs.writeFileSync('page.html', html)

  // save payloads array to file
  fs.writeFileSync('payloads.json', JSON.stringify(payloads, null, 2));

  await browser.close().catch((error) => {
    console.error('Error closing browser: ', error)
  })

  return { html, payloads }
}

module.exports = scalper
