'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const post = async function () {
  for (const [ , processToKill ] of Object.entries(processes)) {
    await processToKill.kill('SIGINT');
  }

  const tempDistDir = path.join(__dirname, 'dist');
  const buildDir = path.join(__dirname, 'build');

  shell.rm('-rf', [ tempDistDir, buildDir ]);

  const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');

  const childProcess = shell.exec('npx wolkenkit stop --dangerously-destroy-data', {
    cwd: testApplicationDirectory
  });

  if (childProcess.code !== 0) {
    throw new Error('Failed to stop wolkenkit test application.');
  }
};

module.exports = post;
