'use strict';

const processenv = require('processenv');

const browsers = require('../browsers'),
      getTestsFor = require('./getTestsFor');

const seleniumEnvironment = processenv('SELENIUM_ENV') || 'local';

browsers[seleniumEnvironment].forEach(browserConfiguration => {
  getTestsFor({ browserConfiguration, seleniumEnvironment });
});
