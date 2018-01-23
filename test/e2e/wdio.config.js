'use strict';

const path = require('path');

const processenv = require('processenv');

const configuration = {
  services: [],
  specs: [ path.join(__dirname, '**', '*Tests.js') ],
  framework: 'mocha',
  mochaOpts: { ui: 'tdd' },
  reporters: [ 'spec' ],
  bail: 1
};

if (processenv('CI')) {
  configuration.capabilities = [
    { browserName: 'chrome', platform: 'Linux', version: 'latest' },
    { browserName: 'chrome', platform: 'macOS 10.12', version: 'latest' },
    { browserName: 'chrome', platform: 'Windows 10', version: 'latest' },
    { browserName: 'firefox', platform: 'Linux', version: 'latest' },
    { browserName: 'firefox', platform: 'macOS 10.12', version: 'latest' },
    { browserName: 'firefox', platform: 'Windows 10', version: 'latest' },
    { browserName: 'internet explorer', platform: 'Windows 10', version: 'latest' },
    { browserName: 'microsoftedge', platform: 'Windows 10', version: 'latest' }
  ];

  configuration.services.push('sauce');
  configuration.user = processenv('SAUCE_USERNAME');
  configuration.key = processenv('SAUCE_ACCESS_KEY');
  configuration.sauceConnect = true;
  configuration.sauceConnectOpts = {
    verbose: true,
    verboseDebugging: true,
    vv: true,
    /* eslint-disable no-console */
    logger: console.log
    /* eslint-enable no-console */
  };
} else {
  configuration.capabilities = [
    { browserName: 'chrome' },
    { browserName: 'firefox' }
  ];

  configuration.services.push('selenium-standalone');
}

configuration.services.push('static-server');
configuration.staticServerFolders = [
  { mount: '/authentication', path: path.join(__dirname, 'authentication') },
  { mount: '/dist', path: path.join(__dirname, 'dist') }
];

module.exports = {
  config: configuration
};
