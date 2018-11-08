'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');
const wolkenkitBinary = path.join(__dirname, '..', '..', 'node_modules', 'wolkenkit', 'src', 'bin', 'wolkenkit');

const post = async function () {
  if (processes.remote) {
    processes.remote.kill('SIGINT');
  }

  shell.exec(`node ${wolkenkitBinary} stop --dangerously-destroy-data`, {
    cwd: testApplicationDirectory
  });
};

module.exports = post;
