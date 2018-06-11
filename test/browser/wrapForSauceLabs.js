'use strict';

const wrapForSauceLabs = async function ({ test, browser, seleniumEnvironment }, fn) {
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

  if (seleniumEnvironment === 'saucelabs') {
    await browser.executeScript(`sauce:job-name=${test.fullTitle()}`);

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

module.exports = wrapForSauceLabs;
