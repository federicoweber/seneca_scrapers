const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const readline = require('readline');
const GoogleAuth = Bluebird.promisifyAll(require('google-auth-library'));

// If modifying these scopes, delete your previously saved credentials
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = `${appRoot}/.credentials/`;
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com.token.json';
const CLIENT_SECRET = require(`${appRoot}/.credentials/google_client_id.json`);

async function authorize(credentials) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  await fs.readFileAsync(TOKEN_PATH)
    .then((token) => {
      oauth2Client.credentials = JSON.parse(token);
    }, () => {
      return getNewToken(oauth2Client);
    });

  return oauth2Client;
}

async function getNewToken(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oauth2Client.getToken(code, (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          reject(err);
        }

        oauth2Client.credentials = token;
        storeToken(token);
        resolve(oauth2Client);
      });
    });
  });
}

async function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  await fs.writeFileAsync(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

exports.execute = async (method) => {
  await authorize(CLIENT_SECRET)
    .then((client) => {
      method(client);
    });
};

