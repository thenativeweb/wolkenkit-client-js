'use strict';

const processenv = require('processenv');

const versions = require('./browser-versions.json');

const browsers = {
  local: [
    { browserName: 'Chrome' }
  ],
  browserstack: [
    /* eslint-disable camelcase */
    { browserName: 'Chrome', browser_version: versions.chrome, os: 'Windows', os_version: '10' },
    { browserName: 'Firefox', browser_version: versions.firefox, os: 'Windows', os_version: '10' },
    { browserName: 'Edge', browser_version: versions.edge, os: 'Windows', os_version: '10' },

    // Providing a 'customSendKeys' delay to browserstack fixes the
    // 'element.sendKeys' behaviour of the IE driver by introducing a delay of
    // the given milliseconds between sending each key.
    { browserName: 'IE', browser_version: versions.ie, os: 'Windows', os_version: '10', 'browserstack.customSendKeys': 800 },

    { browserName: 'Chrome', browser_version: versions.chrome, os: 'OS X', os_version: 'High Sierra' },
    { browserName: 'Firefox', browser_version: versions.firefox, os: 'OS X', os_version: 'High Sierra' },
    { browserName: 'Safari', browser_version: versions.safari, os: 'OS X', os_version: 'High Sierra' }

    // The iOS tests are currently disabled, as there are major problems with
    // sending key strokes.
    // { browserName: 'iPhone', device: 'iPhone X', realMobile: 'true', os_version: versions.ios, 'browserstack.customSendKeys': 800 },
    // { browserName: 'android', device: 'Samsung Galaxy S9', realMobile: 'true', os_version: versions.android }
    /* eslint-enable camelcase */
  ]
};

browsers.browserstack.forEach(browser => {
  browser['browserstack.user'] = processenv('BROWSERSTACK_USERNAME');
  browser['browserstack.key'] = processenv('BROWSERSTACK_ACCESS_KEY');
  browser['browserstack.local'] = 'true';
});

module.exports = browsers;
