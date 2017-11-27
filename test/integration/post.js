'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../helpers/processes');

const wolkenkitDirectory = path.join(__dirname, '..', '..', 'node_modules', 'wolkenkit-test');
const wolkenkitBinary = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'wolkenkit');

const post = function (done) {
  if (processes.remote) {
    processes.remote.kill('SIGINT');
  }

  shell.exec(`${wolkenkitBinary} stop --dangerously-destroy-data`, {
    cwd: wolkenkitDirectory
  }, done);
};

module.exports = post;
