'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const post = async function () {
  const tempDistDir = path.join(__dirname, 'dist');
  const buildDir = path.join(__dirname, 'build');

  shell.rm('-rf', `${tempDistDir}/*`);
  shell.rm('-rf', `${buildDir}/*`);

  if (processes.httpServer) {
    processes.httpServer.kill('SIGINT');
  }

  if (processes.selenium) {
    processes.selenium.kill('SIGINT');
  }

  if (processes.sauceConnect) {
    processes.sauceConnect.kill('SIGINT');
  }
};

module.exports = post;
