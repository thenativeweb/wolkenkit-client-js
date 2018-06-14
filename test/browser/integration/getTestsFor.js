'use strict';

/* global window */

const assert = require('assertthat'),
      { Builder, By, until } = require('selenium-webdriver');

const wrapForBrowserstack = require('../wrapForBrowserstack');

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
  /* eslint-disable camelcase */
  browserConfiguration.browser_version = browserConfiguration.browser_version || browserConfiguration.browser_version || 'current';
  browserConfiguration.os = browserConfiguration.os || browserConfiguration.os || 'current';
  browserConfiguration.os_version = browserConfiguration.os_version || browserConfiguration.os_version || 'current';
  /* eslint-enable camelcase */

  suite(`${browserConfiguration.browserName} ${browserConfiguration.browser_version} (${browserConfiguration.os} ${browserConfiguration.os_version})`, () => {
    suite('integration tests', function () {
      this.timeout(60 * 60 * 1000);

      let browser;

      const applicationUrl = 'http://local.wolkenkit.io:4567/integration/',
            waitTimeout = 60 * 60 * 1000;

      const seleniumUrl = seleniumEnvironment === 'browserstack' ?
        `http://hub-cloud.browserstack.com/wd/hub` :
        'http://localhost:4444/wd/hub';

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

      test('runs all tests successfully inside the browser.', async function () {
        await wrapForBrowserstack({ test: this.test, browser, seleniumEnvironment }, async () => {
          await browser.wait(until.elementLocated(By.css('#passes')), waitTimeout);

          /* eslint-disable prefer-arrow-callback */
          const result = await browser.executeScript(function () {
            return window.mochaResults;
          });
          /* eslint-enable prefer-arrow-callback */

          if (result.failures > 0) {
            /* eslint-disable no-console */
            console.log(result.reports);
            /* eslint-enable no-console */
          }

          assert.that(result.failures).is.equalTo(0);
          assert.that(result.pending).is.equalTo(0);
          assert.that(result.passes).is.equalTo(result.tests);
        });
      });
    });
  });
};

module.exports = getTestsFor;
