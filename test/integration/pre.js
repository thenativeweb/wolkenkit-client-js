'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../helpers/processes');

const remoteServerBinary = path.join(__dirname, '..', 'helpers', 'remote.js');
const wolkenkitDirectory = path.join(__dirname, '..', '..', 'node_modules', 'wolkenkit-test');
const wolkenkitBinary = path.join(wolkenkitDirectory, 'wolkenkit');

const pre = function (done) {
  processes.remote = shell.exec(`node ${remoteServerBinary}`, { async: true });

  shell.exec(`${wolkenkitBinary} start --shared-key test`, {
    cwd: wolkenkitDirectory
  }, done);
};

module.exports = pre;
