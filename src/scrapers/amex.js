const CRED = {
  user: process.env.AMEX_USER,
  password: process.env.AMEX_PASSWORD,
};
const AMEX_URL = 'https://online.americanexpress.com/myca/estmt/us/list.do?intlink=us-ser-soa-accnthub-fin-recentactivity&BPIndex=0&request_type=authreg_Statement&Face=en_US&sorted_index=0';

exports.scrape = async (browser) => {
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', ...msg.args));
  await page.goto(AMEX_URL, {
    timeout: 60000,
  });

  // Login
  await page.waitFor('#lilo_userName');
  await page.focus('#lilo_userName');
  await page.type(CRED.user);
  await page.focus('#lilo_password');
  await page.type(CRED.password);
  await page.click('#lilo_formSubmit');

  // Get transactions
  await page.waitForNavigation({
    timeout: 60000,
  });
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
