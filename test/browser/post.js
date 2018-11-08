'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const post = async function () {
  for (const [ , processToKill ] of Object.entries(processes)) {
    await processToKill.kill('SIGINT');
  }

  const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');

  const childProcess = shell.exec('../../../node_modules/wolkenkit/src/bin/wolkenkit.js stop --dangerously-destroy-data', {
    cwd: testApplicationDirectory
  });

  if (childProcess.code !== 0) {
    throw new Error('Failed to stop wolkenkit test application.');
  }
};

module.exports = post;
