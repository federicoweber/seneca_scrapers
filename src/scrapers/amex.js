const CRED = require('../../.credentials/amex.json');

exports.scrape = async (browser) => {
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', ...msg.args));
  await page.goto(CRED.url);

  // Login
  await page.waitFor('#lilo_userName');
  await page.focus('#lilo_userName');
  await page.type(CRED.user);
  await page.focus('#lilo_password');
  await page.type(CRED.password);
  await page.click('#lilo_formSubmit');

  // Get transactions
  await page.waitForNavigation();
  const transactions = await page.evaluate(() => {
    let scraped = [];
    $('#listData .posted-item-body')
      .each( (id, el) => scraped.push([
        // date
        $(el).find('.trans-date-text').data('date'),
        // checked
        '',
        // payee
        $(el).find('.desc-trans').text(),
        // category
        '',
        // acount
        'Amex',
        // amount
        $(el).find('.colAmount').data('amount') * -1,
    ]));
    return scraped;
  });

  await page.close();

  return transactions;
};
