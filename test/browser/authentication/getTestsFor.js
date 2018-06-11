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
    suite('OpenIdConnect', function () {
      this.timeout(5 * 60 * 1000);

      let browser;

      const applicationUrl = 'http://localhost:4567/authentication/',
            loginUrl = 'https://thenativeweb.eu.auth0.com/login',
            waitTimeout = 20 * 1000;

      const seleniumUrl = seleniumEnvironment === 'local' ?
        'http://localhost:4444/wd/hub' :
        `http://${processenv('SAUCE_USERNAME')}:${processenv('SAUCE_ACCESS_KEY')}@localhost:4445/wd/hub`;

      const startBrowser = async () => {
        browser = await new Builder().
          usingServer(seleniumUrl).
          withCapabilities(browserConfiguration).
          build();

        await browser.get(applicationUrl);
        await browser.wait(until.elementLocated(By.css('#ready')), waitTimeout);
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
        await browser.wait(until.elementLocated(By.css('input[name="password"]')), waitTimeout);
        await browser.wait(until.elementLocated(By.css('.auth0-lock-submit')), waitTimeout);

        const userNameInput = await browser.findElement(By.css('input[name="username"]'));
        const passwordInput = await browser.findElement(By.css('input[name="password"]'));
        const submitButton = await browser.findElement(By.css('.auth0-lock-submit'));

        await browser.wait(until.elementIsVisible(userNameInput), waitTimeout);
        await browser.wait(until.elementIsVisible(passwordInput), waitTimeout);
        await browser.wait(until.elementIsVisible(submitButton), waitTimeout);

        await userNameInput.sendKeys('alfred@thenativeweb.io');
        await browser.sleep(0.1 * 1000);
        await passwordInput.sendKeys('YyKsuA6hoBUBZJbdi3jtzCERYasbCkXU');
        await browser.sleep(0.1 * 1000);
        await submitButton.click();
      };

      const performLogin = async function () {
        await callLoginFunction();
        await fillOutLoginForm();

        await browser.wait(until.urlContains(applicationUrl));
        await browser.wait(until.elementLocated(By.css('#ready')), waitTimeout);
      };

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

      suite('at start', () => {
        suite('isLoggedIn', () => {
          test('returns false.', wrapForSauceLabs(async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.false();
          }));
        });

        suite('getToken', () => {
          test('returns undefined.', wrapForSauceLabs(async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isTokenUndefined: window.openIdConnect.getToken() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isTokenUndefined).is.true();
          }));
        });

        suite('getProfile', () => {
          test('returns undefined.', wrapForSauceLabs(async () => {
            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isProfileUndefined: window.openIdConnect.getProfile() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isProfileUndefined).is.true();
          }));
        });
      });

      suite('login', () => {
        test('redirects to the identity provider.', wrapForSauceLabs(async () => {
          await callLoginFunction();

          await browser.wait(until.urlContains(loginUrl));
        }));

        test('redirects back to the application.', wrapForSauceLabs(async () => {
          await callLoginFunction();
          await fillOutLoginForm();

          await browser.wait(until.urlContains(applicationUrl));
        }));

        test('removes the token from the url.', wrapForSauceLabs(async () => {
          await performLogin();
        }));

        test('stores the token in local storage.', wrapForSauceLabs(async () => {
          await performLogin();

          /* eslint-disable prefer-arrow-callback, no-var */
          const result = await browser.executeScript(function () {
            var token = window.localStorage.getItem(window.openIdConnect.getKey());
            var body = window.wolkenkit.authentication.OpenIdConnect.decodeBodyFromToken(token);

            return body;
          });
          /* eslint-enable prefer-arrow-callback, no-var */

          assert.that(result).is.not.null();
        }));

        suite('isLoggedIn', () => {
          test('returns true.', wrapForSauceLabs(async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.true();
          }));
        });

        suite('getToken', () => {
          test('returns the token.', wrapForSauceLabs(async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isTokenUndefined: window.openIdConnect.getToken() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isTokenUndefined).is.false();
          }));
        });

        suite('getProfile', () => {
          test('returns the profile.', wrapForSauceLabs(async () => {
            await performLogin();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return {
                isProfileUndefined: window.openIdConnect.getProfile() === undefined
              };
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result.isProfileUndefined).is.false();
          }));
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

        test('removes the token from local storage.', wrapForSauceLabs(async () => {
          await performLogin();
          await callLogoutFunction();

          /* eslint-disable prefer-arrow-callback, no-var */
          const result = await browser.executeScript(function () {
            var token = window.localStorage.getItem(window.openIdConnect.getKey());

            return token;
          });
          /* eslint-enable prefer-arrow-callback, no-var */

          assert.that(result).is.null();
        }));

        suite('isLoggedIn', () => {
          test('returns false.', wrapForSauceLabs(async () => {
            await performLogin();
            await callLogoutFunction();

            /* eslint-disable prefer-arrow-callback */
            const result = await browser.executeScript(function () {
              return window.openIdConnect.isLoggedIn();
            });
            /* eslint-enable prefer-arrow-callback */

            assert.that(result).is.false();
          }));
        });

        suite('getToken', () => {
          test('returns undefined.', wrapForSauceLabs(async () => {
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
          }));
        });

        suite('getProfile', () => {
          test('returns undefined.', wrapForSauceLabs(async () => {
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
          }));
        });
      });
    });
  });
};

module.exports = getTestsFor;
