'use strict';

const path = require('path');

const shell = require('shelljs');

const webpackConfigFile = path.join(__dirname, 'webpack.browser-tests.config.js');
const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');

const binaryDirectory = path.join(__dirname, '..', '..', 'node_modules', '.bin'),
      remoteServerBinary = path.join(__dirname, '..', 'shared', 'remote.js'),
      webpackBinary = path.join(binaryDirectory, 'webpack'),
      wolkenkitBinary = path.join(binaryDirectory, 'wolkenkit');

shell.exec(`${wolkenkitBinary} start --shared-key test`, {
  cwd: testApplicationDirectory
});

const remoteServer = shell.exec(`node ${remoteServerBinary}`, { async: true });
const webpack = shell.exec(`${webpackBinary} --config ${webpackConfigFile} -w`, { async: true });

const cleanUpAndExit = function () {
  shell.exec(`${wolkenkitBinary} stop --dangerously-destroy-data`, {
    cwd: testApplicationDirectory
  });

  webpack.kill('SIGINT');
  remoteServer.kill('SIGINT');
};

process.on('SIGINT', cleanUpAndExit);
process.on('SIGTERM', cleanUpAndExit);
process.on('exit', cleanUpAndExit);
