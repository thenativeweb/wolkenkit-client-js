'use strict';

let nockProxy;

/* eslint-disable no-process-env */
if (process.env.TEST_ENV === 'browser') {
  /* eslint-enable no-process-env */
  nockProxy = {
    disableNetConnect () {},
    enableNetConnect () {}
  };
} else {
  /* eslint-disable global-require */
  nockProxy = require('nock');
  /* eslint-enable global-require */
}

module.exports = nockProxy;
