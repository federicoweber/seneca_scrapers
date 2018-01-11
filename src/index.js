if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const path = require('path');
global.appRoot = path.resolve(__dirname);

const setup = require('./starter-kit/setup');
const amex = require('./scrapers/amex');
const chase = require('./scrapers/chase');
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
  let transactions = [];
  const amexTransactions = await amex.scrape(browser);
  transactions = transactions.concat(amexTransactions);

  const chaseTransactions = await chase.scrape(browser);
  transactions = transactions.concat(chaseTransactions);

  await transactionsLogger.log(transactions);

  return 'done';
};
