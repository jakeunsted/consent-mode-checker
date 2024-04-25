const puppeteer = require('puppeteer-extra')
const chromium = require('@sparticuz/chromium')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer')

puppeteer.use(StealthPlugin())

async function launchBrowser() {
  let launchOptions;

  if (process.env.RUN_IN_DOCKER === 'true') {
    // Docker browser instance - supporting AWS
    launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
    };
  } else {
    // Local browser instance
    launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath(),
      headless: false,
    };
  }

  return puppeteer.launch(launchOptions).catch((error) => {
    console.error('Error launching browser: ', error);
    return null;
  });
}

module.exports = launchBrowser;