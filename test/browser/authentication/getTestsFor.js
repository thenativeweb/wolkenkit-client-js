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
    suite('OpenIdConnect', function () {
      this.timeout(5 * 60 * 1000);

      const applicationUrl = 'http://localhost:4567/authentication/',
            loginUrl = 'https://thenativeweb.eu.auth0.com/login',
            waitTimeout = 20 * 1000;

      const seleniumUrl = seleniumEnvironment === 'local' ?
        'http://localhost:4444/wd/hub' :
        `http://${processenv('SAUCE_USERNAME')}:${processenv('SAUCE_ACCESS_KEY')}@localhost:4445/wd/hub`;

      let browser;

      setup(async () => {
        browser = await new Builder().
          usingServer(seleniumUrl).
          withCapabilities(browserConfiguration).
          build();

        await browser.get(applicationUrl);
        await browser.wait(until.elementLocated(By.css('#ready')), waitTimeout);
      });

      teardown(async () => {
        await browser.quit();
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
        await passwordInput.sendKeys('YyKsuA6hoBUBZJbdi3jtzCERYasbCkXU');
        await submitButton.click();
      };

      const performLogin = async function () {
        await callLoginFunction();
        await fillOutLoginForm();

        await browser.wait(until.urlContains(applicationUrl));
        await browser.wait(until.elementLocated(By.css('#ready')), waitTimeout);
      };

      const performLogout = async function () {
        /* eslint-disable prefer-arrow-callback */
        await browser.executeScript(function () {
          window.openIdConnect.logout();
        });
        /* eslint-enable prefer-arrow-callback */
      };

      /* eslint-disable prefer-arrow-callback */
      test('authenticates users.', async function () {
        await wrapForSauceLabs({ test: this.test, browser, seleniumEnvironment }, async () => {
          // Assert that the user is not logged in.
          let isLoggedIn = await browser.executeScript(function () {
            return window.openIdConnect.isLoggedIn();
          });

          assert.that(isLoggedIn).is.false();

          // Assert that there is no token.
          let token = await browser.executeScript(function () {
            return window.openIdConnect.getToken() || 'undefined';
          });

          assert.that(token).is.equalTo('undefined');

          // Assert that there is no profile.
          let profile = await browser.executeScript(function () {
            return window.openIdConnect.getProfile() || 'undefined';
          });

          assert.that(profile).is.equalTo('undefined');

          // Login the user.
          await performLogin();

          // Assert that the token was stored in local storage.
          const tokenBody = await browser.executeScript(function () {
            /* eslint-disable no-var */
            var encodedToken = window.localStorage.getItem(window.openIdConnect.getKey());
            var body = window.wolkenkit.authentication.OpenIdConnect.decodeBodyFromToken(encodedToken);
            /* eslint-enable no-var */

            return body;
          });

          assert.that(tokenBody).is.not.null();

          // Assert that the user is logged in.
          isLoggedIn = await browser.executeScript(function () {
            return window.openIdConnect.isLoggedIn();
          });

          assert.that(isLoggedIn).is.true();

          // Assert that there is a token.
          token = await browser.executeScript(function () {
            return window.openIdConnect.getToken() || 'undefined';
          });

          assert.that(token).is.not.equalTo('undefined');

          // Assert that there is a profile.
          profile = await browser.executeScript(function () {
            return window.openIdConnect.getProfile() || 'undefined';
          });

          assert.that(profile).is.not.equalTo('undefined');

          // Logout the user.
          await performLogout();

          // Assert that the token was removed from local storage.
          const tokenInLocalStorage = await browser.executeScript(function () {
            /* eslint-disable no-var */
            return window.localStorage.getItem(window.openIdConnect.getKey()) || 'undefined';
            /* eslint-enable no-var */
          });

          assert.that(tokenInLocalStorage).is.equalTo('undefined');

          // Assert that the user is not logged in.
          isLoggedIn = await browser.executeScript(function () {
            return window.openIdConnect.isLoggedIn();
          });

          assert.that(isLoggedIn).is.false();

          // Assert that there is no token.
          token = await browser.executeScript(function () {
            return window.openIdConnect.getToken() || 'undefined';
          });

          assert.that(token).is.equalTo('undefined');

          // Assert that there is no profile.
          profile = await browser.executeScript(function () {
            return window.openIdConnect.getProfile() || 'undefined';
          });

          assert.that(profile).is.equalTo('undefined');
        });
      });
      /* eslint-enable prefer-arrow-callback */
    });
  });
};

module.exports = getTestsFor;
