'use strict';

const path = require('path');

const shell = require('shelljs');

const processes = require('../shared/processes');

const pre = async function () {
  const tempDistDir = path.join(__dirname, 'dist');
  const tempBuildDir = path.join(__dirname, 'build');
  const projectRoot = path.join(__dirname, '..', '..');

  shell.exec(`babel src --out-dir ${tempDistDir} --copy-files`, { cwd: projectRoot });
  shell.exec(`npx webpack`, { cwd: __dirname });
  processes.httpServer = shell.exec(`npx http-server -s -p 4567 ${tempBuildDir}`, { cwd: projectRoot, async: true });

  shell.exec(`npx selenium-standalone install`, { cwd: projectRoot });
  processes.selenium = shell.exec(`npx selenium-standalone start`, { cwd: projectRoot, async: true });

  await new Promise(resolve => {
    const onData = function (data) {
      if (data.includes('Selenium started')) {
        processes.selenium.stdout.removeListener('data', onData);
        resolve();
      }
    };

    processes.selenium.stdout.on('data', onData);
  });
};

module.exports = pre;
