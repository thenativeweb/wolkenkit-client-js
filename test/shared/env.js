'use strict';

/* eslint-disable no-process-env */
const remotePort = process.env.REMOTE_PORT || 3000;
let remoteUrl = '';

remoteUrl = `http://localhost:${remotePort}`;

const env = {
  MONGO_URL_INTEGRATION: process.env.MONGO_URL_INTEGRATION || 'mongodb://wolkenkit:wolkenkit@local.wolkenkit.io:9002/wolkenkit',
  REMOTE_PORT: remotePort,
  REMOTE_URL: remoteUrl,
  TEST_ENV: process.env.TEST_ENV
};
/* eslint-enable no-process-env */

module.exports = env;
