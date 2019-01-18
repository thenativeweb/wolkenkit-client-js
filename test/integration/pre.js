'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const remoteServerBinary = path.join(__dirname, '..', 'shared', 'remote.js');
const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');
const wolkenkitBinary = path.join(__dirname, '..', '..', 'node_modules', 'wolkenkit', 'src', 'bin', 'wolkenkit');

const pre = async function () {
  processes.remote = shell.exec(`node ${remoteServerBinary}`, { async: true });

  shell.exec(`node ${wolkenkitBinary} start --shared-key wolkenkit --debug`, {
    cwd: testApplicationDirectory
  });
};

module.exports = pre;
