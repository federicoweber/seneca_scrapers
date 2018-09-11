# Seneca Scapers

A series of small scrapers, that runs on AWS Lambda, to store personal transactions on a Google Spreadsheet.
It includes the following scrapers:
1. Amex
2. Chase (_WIP, need to fix 2fa_)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

1. Install dependencies with Yarn `yarn`

### populate env variables

1. Populate `.env` with the following variables
```
AMEX_USER=*******
AMEX_PASSWORD=*******
SPREADSHEET_ID=*******
IFTTT_KEY=******* (This is used to send push notifications using [IFTTT's webhooks](https://ifttt.com/maker_webhooks)) event name should be `seneca_scraper`
```

### Get Google APIs access credentials
1. Create a Google APIs credential in [Google Cloud Platform](https://console.cloud.google.com/apis/credentials)
2. Download those in .json format and copy it in `.credentials/sheets.googleapis.com.token.json`
3. run `yarn run local`, ignore the Chromium window and follow console output to authorize the app.

## Running it locally
Run `yarn run local`. By executing `SLOWMO_MS=250 npm run local`, you can check the operation while viewing the chrome (non-headless, slowmo).

## Deployment
1. Create a new Lambda function **(Lambda's memory needs to be at least 384 MB)**
2. set the following env variables **(it's recommended to encrypt passwords)**
```
AMEX_USER=*******
AMEX_PASSWORD=*******
SPREADSHEET_ID=*******
IFTTT_KEY=*******
NODE_ENV=production
```
3. Run `npm run package`, and deploy the package.zip.

## Built With

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) on AWS Lambda.

## Authors

* **Federico Weber** - [FedericoWeber](https://github.com/FedericoWeber)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

Thanks to [sambaiz](https://github.com/sambaiz) for the great work on [Puppeteer Lambda Starter Kit](https://github.com/sambaiz/puppeteer-lambda-starter-kit)!

