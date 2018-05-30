'use strict';

/* global window */

const processenv = require('processenv');

const assert = require('assertthat'),
      { Builder, By, until } = require('selenium-webdriver');

const getTestsFor = function ({ browserConfig }) {
  if (!browserConfig) {
    throw new Error('Browser config is missing.');
  }

  suite(`${browserConfig.browserName}${browserConfig.platform}${browserConfig.version}`, () => {
    suite('OpenIdConnect', function () {
      this.timeout(5 * 60 * 1000);

      let browser;

      const applicationUrl = 'http://localhost:4567/authentication/',
            loginUrl = 'https://thenativeweb.eu.auth0.com/login',
            waitTimeout = 20 * 1000;

      let seleniumUrl = 'http://localhost:4445/wd/hub';

      if (processenv('TEST_ENV') === 'cloud') {
        seleniumUrl = `http://${processenv('SAUCE_USERNAME')}:${processenv('SAUCE_ACCESS_KEY')}@localhost:4445/wd/hub`;
      }

      const startBrowser = async () => {
        browser = await new Builder().
          usingServer(seleniumUrl).
          withCapabilities(browserConfig).
          build();

        await browser.get(applicationUrl);
        await browser.wait(until.elementLocated(By.css('#log')), waitTimeout);
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

      const callLoginFunction = async function () {
        /* eslint-disable prefer-arrow-callback */
        const result = await browser.executeScript(function () {
          window.openIdConnect.login();
        });
        /* eslint-enable prefer-arrow-callback */

        return result;
      };

      const fillOutLoginForm = async function () {
        await browser.wait(until.urlContains(loginUrl));
        await browser.wait(until.elementLocated(By.css('input[name="username"]')), waitTimeout);
        await browser.sleep(2 * 1000);

        const userNameInput = await browser.findElement(By.css('input[name="username"]'));

        await userNameInput.sendKeys('alfred@thenativeweb.io');

        const passwordInput = await browser.findElement(By.css('input[name="password"]'));

        await passwordInput.sendKeys('YyKsuA6hoBUBZJbdi3jtzCERYasbCkXU');

        const submitButton = await browser.findElement(By.css('.auth0-lock-submit'));

        submitButton.click();
      };

      const performLogin = async function () {
        await callLoginFunction();
        await fillOutLoginForm();

        await browser.wait(until.urlContains(applicationUrl));
        await browser.wait(until.elementLocated(By.css('#log')), waitTimeout);
      };

      suite('at start', () => {
        suite('isLoggedIn', () => {
          test('returns false.', async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.false();
          });
        });

        suite('getToken', () => {
          test('returns undefined.', async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isTokenUndefined: window.openIdConnect.getToken() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isTokenUndefined).is.true();
          });
        });

        suite('getProfile', () => {
          test('returns undefined.', async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isProfileUndefined: window.openIdConnect.getProfile() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isProfileUndefined).is.true();
          });
        });
      });

      suite('login', () => {
        test('redirects to the identity provider.', async () => {
          await callLoginFunction();

          await browser.wait(until.urlContains(loginUrl));
        });

        test('redirects back to the application.', async () => {
          await callLoginFunction();
          await fillOutLoginForm();

          await browser.wait(until.urlContains(applicationUrl));
        });

        test('removes the token from the url.', async () => {
          await performLogin();
        });

        test('stores the token in local storage.', async () => {
          await performLogin();

          /* eslint-disable prefer-arrow-callback, no-var */
          const result = await browser.executeScript(function () {
            var token = window.localStorage.getItem(window.openIdConnect.getKey());
            var body = window.wolkenkit.authentication.OpenIdConnect.decodeBodyFromToken(token);

            return body;
          });
          /* eslint-enable prefer-arrow-callback, no-var */

          assert.that(result).is.not.null();
        });

        suite('isLoggedIn', () => {
          test('returns true.', async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.true();
          });
        });

        suite('getToken', () => {
          test('returns the token.', async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isTokenUndefined: window.openIdConnect.getToken() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isTokenUndefined).is.false();
          });
        });

        suite('getProfile', () => {
          test('returns the profile.', async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isProfileUndefined: window.openIdConnect.getProfile() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isProfileUndefined).is.false();
          });
        });
      });

      suite('logout', () => {
        const callLogoutFunction = async function () {
          /* eslint-disable prefer-arrow-callback */
          const result = await browser.executeScript(function () {
            window.openIdConnect.logout();
          });
          /* eslint-enable prefer-arrow-callback */

          return result;
        };

        test('removes the token from local storage.', async () => {
          await performLogin();
          await callLogoutFunction();

          /* eslint-disable prefer-arrow-callback, no-var */
          const result = await browser.executeScript(function () {
            var token = window.localStorage.getItem(window.openIdConnect.getKey());

            return token;
          });
          /* eslint-enable prefer-arrow-callback, no-var */

          assert.that(result).is.null();
        });

        suite('isLoggedIn', () => {
          test('returns false.', async () => {
            await performLogin();
            await callLogoutFunction();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.false();
          });
        });

        suite('getToken', () => {
          test('returns undefined.', async () => {
            await performLogin();
            await callLogoutFunction();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isTokenUndefined: window.openIdConnect.getToken() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isTokenUndefined).is.true();
          });
        });

        suite('getProfile', () => {
          test('returns undefined.', async () => {
            await performLogin();
            await callLogoutFunction();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isProfileUndefined: window.openIdConnect.getProfile() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isProfileUndefined).is.true();
          });
        });
      });
    });
  });
};

module.exports = getTestsFor;
