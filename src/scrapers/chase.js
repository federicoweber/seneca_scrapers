const rp = require('request-promise');

const CRED = {
  user: process.env.CHASE_USER,
  password: process.env.CHASE_PASSWORD || '',
};
const URL = 'https://secure01c.chase.com/web/auth/?fromOrigin=https://secure01c.chase.com#/logon/logon/chaseOnline';
const CHASE_AUTH_CODE = process.env.CHASE_AUTH_CODE || null;
const EMAIL_OPTION_SELECTOR = '#label-deviceoptionT487305490';
const IFTTT_KEY = process.env.IFTTT_KEY || '';

exports.scrape = async (browser) => {
  if (!CRED.password.length) {
    console.log('missing Chase Credentials');
    return [];
  }
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', ...msg.args));
  await page.goto(URL, {
    timeout: 60000,
  });

  // Login
  await page.waitFor('#userId-input-field');
  await page.focus('#userId-input-field');
  await page.type(CRED.user);
  await page.focus('#password-input-field');
  await page.type(CRED.password);
  await page.click('#signin-button');

  // Get transactions
  await page.waitForNavigation({
    timeout: 60000,
  });
  await page.waitFor(2000);

  let transactions = [];
  let unrecognizedDevice;

  await page.$eval(
    '#mainpanel > div > h3',
    (el) => el.innerText.match('We don\'t recognize the computer')
  )
    .then(() => {
      unrecognizedDevice = true;
    })
    .catch(() => {
      unrecognizedDevice = false;
    });

  if (unrecognizedDevice) {
    console.log('Chase unrecognized device');
    // as this require to set an identification code provided by chase
    // the full process will require a second run
    // request auth code and / or go to code insert step
    await page.click('#requestDeliveryDevices-sm');
    await page.waitFor(500);
    await page.click(EMAIL_OPTION_SELECTOR);
    await page.click('#requestIdentificationCode-sm');

    if (CHASE_AUTH_CODE) {
      // handle second stage login
      await page.waitFor('#otpcode_input-input-field');
      await page.focus('#otpcode_input-input-field');
      await page.type(CRED.user);
      await page.focus('#password_input-input-field');
      await page.type(CRED.password);
      await page.click('#log_on_to_landing_page-sm');
      await page.waitForNavigation({
        timeout: 60000,
      });
    } else {
      await page.close();
      console.log('Chase login failed: please provide CHASE_AUTH_CODE');
      // Send push notification via IFTTT
      await rp(`https://maker.ifttt.com/trigger/seneca_scraper_chase_auth/with/key/${IFTTT_KEY}`).catch((err) => {
        console.log(`IFTTT notify error: ${err.message}`);
      });

      return transactions;
    }
  }

  // just making sure everyting is showing
  await page.waitFor(2000);
  transactions = await page.evaluate(scrapeThePage);
  await page.close();
  return transactions;
};

function scrapeThePage() {
  const scraped = [];
  $('#activityTable tr').each((id, row) => {
    const $row = $(row);
    const isPending = Boolean($row.text().match(/pending/i));
    if (!isPending) {
      let date = $row.find('.date').text();
      if (date.length === 0) {
        // If the date is empy we need to get it from the previous entry
        // this works cause of the way chase format the tables
        date = scraped[id - 1][0];
      } else {
        date = new Date(date).toDateString();
      }
      scraped.push([
        date,
        // checked
        '',
        // payee
        $row.find('.DDAdescription .BODY').text().trim().replace(/\s+/g, ' '),
        // category
        '',
        // accout
        'Chase Checking',
        // amount
        parseFloat($row.find('.amount .smvalue').text()
          .trim()
          .replace('$', '')
          .replace(',', '')
          .replace('−', '-')
        ),
      ]);
    }
  });
  return scraped;
}
