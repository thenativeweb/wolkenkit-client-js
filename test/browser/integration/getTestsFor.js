'use strict';

/* global window */

const assert = require('assertthat'),
      { Builder, By, until } = require('selenium-webdriver'),
      processenv = require('processenv');

const wrapForSauceLabs = require('../wrapForSauceLabs');

const getTestsFor = function ({ browserConfiguration, seleniumEnvironment }) {
  if (!browserConfiguration) {
    throw new Error('Browser configuration is missing.');
  }
  if (!seleniumEnvironment) {
    throw new Error('Selenium environment is missing.');
  }

  // Tests that run on mobile devices only provide platformName and
  // platformVersion, so we need to fallback to those values manually. Tests
  // that are run on the local machine, do have neither of these values.
  browserConfiguration.platform = browserConfiguration.platform || browserConfiguration.platformName || 'current';
  browserConfiguration.version = browserConfiguration.version || browserConfiguration.platformVersion || 'current';

  suite(`${browserConfiguration.browserName} ${browserConfiguration.version} (${browserConfiguration.platform})`, () => {
    suite('Integration tests', function () {
      this.timeout(60 * 60 * 1000);

      let browser;

      const applicationUrl = 'http://localhost:4567/integration/',
            waitTimeout = 60 * 60 * 1000;

      const seleniumUrl = seleniumEnvironment === 'local' ?
        'http://localhost:4444/wd/hub' :
        `http://${processenv('SAUCE_USERNAME')}:${processenv('SAUCE_ACCESS_KEY')}@localhost:4445/wd/hub`;

      setup(async () => {
        browser = await new Builder().
          usingServer(seleniumUrl).
          withCapabilities(browserConfiguration).
          build();

        await browser.get(applicationUrl);
      });

      teardown(async () => {
        await browser.quit();
      });

      test('all run successfully inside the browser.', async function () {
        await wrapForSauceLabs({ test: this.test, browser, seleniumEnvironment }, async () => {
          await browser.wait(until.elementLocated(By.css('#passes')), waitTimeout);

          /* eslint-disable prefer-arrow-callback */
          const result = await browser.executeScript(function () {
            return window.mochaResults;
          });
          /* eslint-enable prefer-arrow-callback */

          assert.that(result.failures).is.equalTo(0);
          assert.that(result.pending).is.equalTo(0);
          assert.that(result.passes).is.equalTo(result.tests);
        });
      });
    });
  });
};

module.exports = getTestsFor;
