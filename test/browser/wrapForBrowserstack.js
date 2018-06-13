'use strict';

const processenv = require('processenv'),
      request = require('superagent');

const browserstackUsername = processenv('BROWSERSTACK_USERNAME');
const browserstackAccessKey = processenv('BROWSERSTACK_ACCESS_KEY');

const wrapForBrowserstack = async function ({ test, browser, seleniumEnvironment }, fn) {
  if (!test) {
    throw new Error('Test is missing.');
  }
  if (!browser) {
    throw new Error('Browser is missing.');
  }
  if (!seleniumEnvironment) {
    throw new Error('Selenium environment is missing.');
  }
  if (!fn) {
    throw new Error('Function is missing.');
  }

  if (seleniumEnvironment === 'browserstack') {
    /* eslint-disable no-underscore-dangle */
    const session = await browser.session_;
    const sessionId = session.id_;
    /* eslint-enable no-underscore-dangle */

    const url = `https://${browserstackUsername}:${browserstackAccessKey}@api.browserstack.com/automate/sessions/${sessionId}.json`;

    await request.
      put(url).
      send({ name: test.fullTitle() });

    try {
      await fn();
    } catch (ex) {
      await request.
        put(url).
        type('form').
        send({ status: 'failed', reason: ex.message });

      throw ex;
    }

    await request.
      put(url).
      type('form').
      send({ status: 'passed', reason: '' });

    return;
  }

  await fn();
};

module.exports = wrapForBrowserstack;
