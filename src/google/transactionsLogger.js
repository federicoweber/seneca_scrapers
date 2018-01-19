const rp = require('request-promise');
const Bluebird = require('bluebird');
const sheetsApi = require('./api');
const google = require('googleapis');
const sheets = google.sheets('v4');
const spreadsheetsValues = Bluebird.promisifyAll(sheets.spreadsheets.values);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = 'transactions!A2:F';
const IFTTT_KEY = process.env.IFTTT_KEY || '';

exports.log = async (transactions) => {
  const authClient = await sheetsApi.getAuthClient();
  await logNewTransactions(authClient, transactions);
};

const logNewTransactions = async (authClient, transactions = []) => {
  const prevTransactions = await getPrevTransactions(authClient) || [];
  const uniqTransactions = await removeDuplicates(
    transactions,
    prevTransactions
  );
  await appendTransactions(authClient, uniqTransactions);
  const totalValue = uniqTransactions.reduce(
    (tot, data) => tot += data[5],
    0
  );
  // eslint-disable-next-line max-len
  console.log(`Logged ${uniqTransactions.length} transacionsions, for a total of $${totalValue.toFixed(2)}.`);
  // Send push notification via IFTTT
  await rp({
    method: 'POST',
    uri: `https://maker.ifttt.com/trigger/seneca_scraper/with/key/${IFTTT_KEY}`,
    body: {
      // eslint-disable-next-line max-len
      value1: `Logged ${uniqTransactions.length} transacionsions, for a total of $${totalValue.toFixed(2)}.`,
    },
    json: true,
  }).catch((err) => {
    console.log(`IFTTT notify error: ${err.message}`);
  });
  return uniqTransactions;
};

function getPrevTransactions(authClient) {
  return spreadsheetsValues.getAsync({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    }).then((res) => {
      return res.values;
    });
}

function appendTransactions(authClient, transactions) {
    return spreadsheetsValues.appendAsync({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      resource: {values: transactions},
    })
    .then(() => {}, logApiError);
}

function removeDuplicates(transactions, prevTransactions) {
  const prevTransactionStrings = prevTransactions.map(stringifyTransaction);
  return transactions.filter((transaction) => {
    const transactionString = stringifyTransaction(transaction);
    return prevTransactionStrings.indexOf(transactionString) === -1;
  });
}

function stringifyTransaction(transaction) {
  const normalizedTransaction = transaction.slice(0);
  // to compare the transactions we need to cleanup the columns
  // that are manually edited in the spreadsheet
  normalizedTransaction[1] = '';
  normalizedTransaction[3] = '';
  // we need to normalize the data to make sure it's comparable
  normalizedTransaction[0] = new Date(normalizedTransaction[0]).valueOf();
  return normalizedTransaction.join('|');
}

function logApiError(err) {
    console.log(`The API returned an error: ${err}`);
}
