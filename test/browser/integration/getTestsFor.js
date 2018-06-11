'use strict';

/* global window */

const assert = require('assertthat'),
      { Builder, By, until } = require('selenium-webdriver'),
      processenv = require('processenv');

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

      const startBrowser = async () => {
        browser = await new Builder().
          usingServer(seleniumUrl).
          withCapabilities(browserConfiguration).
          build();

        await browser.get(applicationUrl);
      };

      const stopBrowser = async () => {
        await browser.quit();
      };

      setup(async () => {
        await startBrowser();
      });

      teardown(async () => {
        await stopBrowser();
      });

      const wrapForSauceLabs = function (fn) {
        return async function () {
          if (seleniumEnvironment === 'saucelabs') {
            await browser.executeScript(`sauce:job-name=${this.test.fullTitle()}`);

            try {
              await fn();
            } catch (ex) {
              await browser.executeScript(`sauce:job-result=failed`);
              throw ex;
            }

            await browser.executeScript(`sauce:job-result=passed`);

            return;
          }

          await fn();
        };
      };

      test('all run successfully inside the browser.', wrapForSauceLabs(async () => {
        await browser.wait(until.elementLocated(By.css('#passes')), waitTimeout);

        /* eslint-disable prefer-arrow-callback */
        const result = await browser.executeScript(function () {
          return window.mochaResults;
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.failures).is.equalTo(0);
        assert.that(result.pending).is.equalTo(0);
        assert.that(result.passes).is.equalTo(result.tests);
      }));
    });
  });
};

module.exports = getTestsFor;
