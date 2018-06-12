'use strict';

const processenv = require('processenv');

const browsers = {
  local: [
    { browserName: 'Chrome' }
  ],
  browserstack: [
    /* eslint-disable camelcase */
    { browserName: 'Chrome', browser_version: '67.0', os: 'Windows', os_version: '10' },
    { browserName: 'Firefox', browser_version: '60.0', os: 'Windows', os_version: '10' },
    { browserName: 'Safari', browser_version: '11.1', os: 'OS X', os_version: 'High Sierra' },
    { browserName: 'IE', browser_version: '11.0', os: 'Windows', os_version: '10' },
    { browserName: 'Edge', browser_version: '17.0', os: 'Windows', os_version: '10' }

    // The iOS tests are currently disabled, as there are major problems with
    // sending key strokes.
    // { browserName: 'iPhone', device: 'iPhone X', realMobile: 'true', os_version: '11.0' },
    // { browserName: 'android', device: 'Samsung Galaxy S9', realMobile: 'true', os_version: '8.0' }
    /* eslint-enable camelcase */
  ]
};

browsers.browserstack.forEach(browser => {
  browser['browserstack.user'] = processenv('BROWSERSTACK_USERNAME');
  browser['browserstack.key'] = processenv('BROWSERSTACK_ACCESS_KEY');
  browser['browserstack.local'] = 'true';
});

module.exports = browsers;
