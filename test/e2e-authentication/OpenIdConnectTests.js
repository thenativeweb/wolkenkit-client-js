'use strict';

const processenv = require('processenv');

const browsers = require('./browsers'),
      getTestsFor = require('./getTestsFor');

const testEnv = processenv('TEST_ENV') || 'local';

browsers[testEnv].forEach(browserConfig => {
  getTestsFor({ browserConfig, testEnv });
});
