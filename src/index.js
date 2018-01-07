const setup = require('./starter-kit/setup');
const amex = require('./scrapers/amex');
const transactionsLogger = require('./google/transactionsLogger');

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
  const amexTransactions = await amex.scrape(browser);
  await transactionsLogger.log(amexTransactions);

  return 'done';
};
