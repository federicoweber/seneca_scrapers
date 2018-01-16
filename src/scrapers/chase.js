const CRED = {
  user: process.env.CHASE_USER,
  password: process.env.CHASE_PASSWORD || '',
};
const URL = 'https://secure01c.chase.com/web/auth/?fromOrigin=https://secure01c.chase.com#/logon/logon/chaseOnline';
const CHASE_AUTH_CODE = process.env.CHASE_AUTH_CODE || null;

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
  const unrecognizedDevice = await page.$eval(
    '#mainpanel > div > h3',
    (el) => el.innerText.match('don\'t recognize')
  );
  let transactions = [];
  if (unrecognizedDevice) {
    console.log('Chase unrecognized device');
    // as this require to set an identification code provided by chase
    // the outh will executed on a new run

    if (CHASE_AUTH_CODE) {
      // handle second stage login
      transactions = await page.evaluate(scrapeThePage);
    } else {
      // request auth code
      await page.click('#requestDeliveryDevices-sm');
      await page.waitFor(2000);
      await page.click('input[type="radio"]');
      console.log('Chase login failed, please provide CHASE_AUTH_CODE');
    }
  } else {
    transactions = await page.evaluate(scrapeThePage);
  }

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
