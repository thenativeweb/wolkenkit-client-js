'use strict';

const path = require('path');

const shell = require('shelljs');

const binaryDirectory = path.join(__dirname, '..', '..', 'node_modules', '.bin');
const remoteServerBinary = path.join(__dirname, '..', 'helpers', 'remote.js');
const webpackBinary = path.join(binaryDirectory, 'webpack');
const webpackConfigFile = path.join(__dirname, '..', '..', 'webpack.browser-tests.config.js');
const wolkenkitDirectory = path.join(__dirname, '..', '..', 'node_modules', 'wolkenkit-test');
const wolkenkitBinary = path.join(wolkenkitDirectory, 'wolkenkit');

shell.exec(`${wolkenkitBinary} start --shared-key test`, {
  cwd: wolkenkitDirectory
});

const remoteServer = shell.exec(`node ${remoteServerBinary}`, { async: true });
const webpack = shell.exec(`${webpackBinary} --config ${webpackConfigFile} -w`, { async: true });

const cleanUpAndExit = function () {
  shell.exec(`${wolkenkitBinary} stop --dangerously-destroy-data`, {
    cwd: wolkenkitDirectory
  });

  webpack.kill('SIGINT');
  remoteServer.kill('SIGINT');
};

process.on('SIGINT', cleanUpAndExit);
process.on('SIGTERM', cleanUpAndExit);
process.on('exit', cleanUpAndExit);
