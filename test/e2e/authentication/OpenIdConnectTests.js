'use strict';

/* global browser, window, wolkenkit */

const assert = require('assertthat');

/* eslint-disable mocha/no-synchronous-tests */
suite('OpenIdConnect', function () {
  this.timeout(5 * 60 * 1000);

  const applicationUrl = 'http://localhost:4567/authentication/';
  const loginUrl = 'https://thenativeweb.eu.auth0.com/login';
  const waitTimeout = 20 * 1000;

  const callLoginFunction = function () {
    /* eslint-disable prefer-arrow-callback */
    const result = browser.execute(function () {
      window.openIdConnect.login();
    });
    /* eslint-enable prefer-arrow-callback */

    return result;
  };

  const fillOutLoginForm = function () {
    browser.waitUntil(() => browser.getUrl().startsWith(loginUrl),
      waitTimeout, `expected login to redirect to ${loginUrl}`);

    browser.waitForVisible('input[name="username  "]', waitTimeout);

    browser.setValue('input[name="username  "]', 'alfred@thenativeweb.io');
    browser.setValue('input[name="password"]', 'YyKsuA6hoBUBZJbdi3jtzCERYasbCkXU');

    browser.click('.auth0-lock-submit');
  };

  const performLogin = function () {
    callLoginFunction();
    fillOutLoginForm();

    browser.waitUntil(() => browser.getUrl() === applicationUrl,
      waitTimeout, `expected login to redirect to ${applicationUrl}`);

    browser.waitForVisible('#loaded', waitTimeout);
  };

  const restart = function () {
    browser.reload();
    browser.url(applicationUrl);
    browser.waitForVisible('#loaded', waitTimeout);
  };

  suite('at start', () => {
    suite('isLoggedIn', () => {
      test('returns false.', () => {
        restart();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return window.openIdConnect.isLoggedIn();
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value).is.false();
      });
    });

    suite('getToken', () => {
      test('returns undefined.', () => {
        restart();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isTokenUndefined: window.openIdConnect.getToken() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isTokenUndefined).is.true();
      });
    });

    suite('getProfile', () => {
      test('returns undefined.', () => {
        restart();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isProfileUndefined: window.openIdConnect.getProfile() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isProfileUndefined).is.true();
      });
    });
  });

  suite('login', () => {
    test('redirects to the identity provider.', () => {
      restart();
      callLoginFunction();

      browser.waitUntil(() => browser.getUrl().startsWith(loginUrl),
        waitTimeout, `expected login to redirect to ${loginUrl}`);
    });

    test('redirects back to the application.', () => {
      restart();
      callLoginFunction();
      fillOutLoginForm();

      browser.waitUntil(() => browser.getUrl().startsWith(applicationUrl),
        waitTimeout, `expected login to redirect to ${applicationUrl}`);
    });

    test('removes the token from the url.', () => {
      restart();
      performLogin();
    });

    test('stores the token in local storage.', () => {
      restart();
      performLogin();

      /* eslint-disable prefer-arrow-callback, no-var */
      const result = browser.execute(function () {
        var token = window.localStorage.getItem(window.openIdConnect.getKey());
        var body = wolkenkit.authentication.OpenIdConnect.decodeBodyFromToken(token);

        return body;
      });
      /* eslint-enable prefer-arrow-callback, no-var */

      assert.that(result.value).is.not.null();
    });

    suite('isLoggedIn', () => {
      test('returns true.', () => {
        restart();
        performLogin();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return window.openIdConnect.isLoggedIn();
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value).is.true();
      });
    });

    suite('getToken', () => {
      test('returns the token.', () => {
        restart();
        performLogin();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isTokenUndefined: window.openIdConnect.getToken() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isTokenUndefined).is.false();
      });
    });

    suite('getProfile', () => {
      test('returns the profile.', () => {
        restart();
        performLogin();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isProfileUndefined: window.openIdConnect.getProfile() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isProfileUndefined).is.false();
      });
    });
  });

  suite('logout', () => {
    const callLogoutFunction = function () {
      /* eslint-disable prefer-arrow-callback */
      const result = browser.execute(function () {
        window.openIdConnect.logout();
      });
      /* eslint-enable prefer-arrow-callback */

      return result;
    };

    test('removes the token from local storage.', () => {
      restart();
      performLogin();
      callLogoutFunction();

      /* eslint-disable prefer-arrow-callback, no-var */
      const result = browser.execute(function () {
        var token = window.localStorage.getItem(window.openIdConnect.getKey());

        return token;
      });
      /* eslint-enable prefer-arrow-callback, no-var */

      assert.that(result.value).is.null();
    });

    suite('isLoggedIn', () => {
      test('returns false.', () => {
        restart();
        performLogin();
        callLogoutFunction();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return window.openIdConnect.isLoggedIn();
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value).is.false();
      });
    });

    suite('getToken', () => {
      test('returns undefined.', () => {
        restart();
        performLogin();
        callLogoutFunction();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isTokenUndefined: window.openIdConnect.getToken() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isTokenUndefined).is.true();
      });
    });

    suite('getProfile', () => {
      test('returns undefined.', () => {
        restart();
        performLogin();
        callLogoutFunction();

        /* eslint-disable prefer-arrow-callback */
        const result = browser.execute(function () {
          return {
            isProfileUndefined: window.openIdConnect.getProfile() === undefined
          };
        });
        /* eslint-enable prefer-arrow-callback */

        assert.that(result.value.isProfileUndefined).is.true();
      });
    });
  });
});
/* eslint-enable mocha/no-synchronous-tests */
