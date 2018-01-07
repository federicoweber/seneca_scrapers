const index = require('../index');
const config = require('./config');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: process.env.HEADLESS || false,
        slowMo: process.env.SLOWMO_MS,
        dumpio: !!config.DEBUG,
        // use chrome installed by puppeteer

        // This is needed to run on arch see https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md
        args: ['--no-sandbox'],
    });
    await index.run(browser)
    .then((result) => console.log(result))
    .catch((err) => console.error(err));
    await browser.close();
})();
