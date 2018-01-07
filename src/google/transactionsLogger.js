const sheetsApi = require('./api');
const google = require('googleapis');
const sheets = google.sheets('v4');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = 'transactions!A2:F';

exports.log = async (transactions) => {
  const logger = logNewTransactions(transactions);
  await sheetsApi.execute(logger);
};

const logNewTransactions = (transactions = []) => {
  return async (authClient) => {
    const prevTransactions = await getPrevTransactions(authClient);
    const uniqTransactions = removeDuplicates(transactions, prevTransactions);
    console.log(`${uniqTransactions.length} new transactions logged!`);
    await appendTransactions(authClient, uniqTransactions);
  };
};

async function getPrevTransactions(authClient) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values
      .get({
        auth: authClient,
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      }, (err, response) => {
        if (err) {
          logApiError(err);
          reject();
        }

        resolve(response.values || []);
    });
  });
}

async function appendTransactions(authClient, transactions) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values
      .append({
        auth: authClient,
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        valueInputOption: 'USER_ENTERED',
        resource: {values: transactions},
      }, (err, response) => {
        if (err) {
          logApiError(err);
          reject();
        }

        resolve();
    });
  });
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
  // that are manually edoted in the spreadsheet
  normalizedTransaction[1] = '';
  normalizedTransaction[3] = '';
  // we need to normalize the data to make sure it's comparable
  normalizedTransaction[0] = new Date(normalizedTransaction[0]).valueOf();
  return normalizedTransaction.join('|');
}

function logApiError(err) {
    console.log(`The API returned an error: ${err}`);
}
