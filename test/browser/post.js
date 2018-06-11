'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const post = async function () {
  Object.keys(processes).forEach(processName => {
    processes[processName].kill('SIGINT');
  });

  const tempDistDir = path.join(__dirname, 'dist');
  const buildDir = path.join(__dirname, 'build');

  shell.rm('-rf', `${tempDistDir}`);
  shell.rm('-rf', `${buildDir}`);

  const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');

  shell.exec('npx wolkenkit stop --dangerously-destroy-data', {
    cwd: testApplicationDirectory
  });
};

module.exports = post;
