const sheetsApi = require('./api');
const google = require('googleapis');

const logTransactions = (transactions = []) => {
  return (authClient) => {

    const sheets = google.sheets('v4');

    return new Promise((resolve, reject) => {
      sheets.spreadsheets.values
        .get({
          auth: authClient,
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          range: 'Class Data!A2:E',
        }, (err, response) => {
          if (err) {
            console.log('The API returned an error: ' + err);
            reject();
          }
          const rows = response.values;
          if (rows.length == 0) {
            console.log('No data found.');
          } else {
            console.log('Name, Major:');
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              // Print columns A and E, which correspond to indices 0 and 4.
              console.log('%s, %s', row[0], row[4]);
            }
          }
          resolve();
      });
    });
  };
};

exports.log = async (transactions) => {
  const log = logTransactions(transactions);
  await sheetsApi.execute(log);
};
