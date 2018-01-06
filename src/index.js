const setup = require('./starter-kit/setup');

const AMEX_URL = 'https://online.americanexpress.com/myca/estmt/us/list.do?intlink=us-ser-soa-accnthub-fin-recentactivity&BPIndex=0&request_type=authreg_Statement&Face=en_US&sorted_index=0';

exports.handler = async (event, context, callback) => {
  // For keeping the browser launch
  context.callbackWaitsForEmptyEventLoop = false;
  const browser = await setup.getBrowser();
  exports.run(browser).then(
    (result) => callback(null, result)
  ).catch(
    (err) => callback(err)
  );
};

exports.run = async (browser) => {
  const page = await browser.newPage();
  await page.goto(AMEX_URL);
  return 'done';
};
