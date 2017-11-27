'use strict';

/* eslint-disable no-process-env */
const remotePort = process.env.REMOTE_PORT || 3000;
let remoteUrl = '';

if (process.env.TEST_ENV === 'browser') {
  // If we are running inside the browser the remote will
  // be avaiblable on the same host and port.
  remoteUrl = '';
} else {
  remoteUrl = `http://localhost:${remotePort}`;
}

const env = {
  MONGO_URL_INTEGRATION: process.env.MONGO_URL_INTEGRATION || 'mongodb://wolkenkit:test@local.wolkenkit.io:9002/wolkenkit',
  REMOTE_PORT: remotePort,
  REMOTE_URL: remoteUrl,
  TEST_ENV: process.env.TEST_ENV
};
/* eslint-enable no-process-env */

module.exports = env;
