'use strict';

const path = require('path');

const { Local } = require('browserstack-local'),
      processenv = require('processenv'),
      shell = require('shelljs');

const processes = require('../shared/processes');

const seleniumEnvironment = processenv('SELENIUM_ENV') || 'local';

const pre = async function () {
  // Remove temporary dist and build folders from previous tests
  shell.rm('-rf', [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'build')
  ]);

  // As pkill returns exit code 1 if selenium-standalone is not running, we
  // intentionally ignore the exit code here.
  shell.exec('pkill -f selenium-standalone');

  const tempBuildDir = path.join(__dirname, 'build');
  const projectRoot = path.join(__dirname, '..', '..');

  // Precompile and create a temporary wolkenkit-client SDK distributable, so
  // that the tests always use the latest version.
  let childProcess = shell.exec(`npx roboter bundle`, { cwd: projectRoot });

  if (childProcess.code !== 0) {
    throw new Error('Failed to create bundle.');
  }

  // Build and bundle the OpenID Connect client test application.
  childProcess = shell.exec(`npx webpack`, { cwd: __dirname });

  if (childProcess.code !== 0) {
    throw new Error('Failed to bundle test files.');
  }

  processes.httpServer = shell.exec(`npx http-server -s -p 4567 ${tempBuildDir}`, { cwd: projectRoot, async: true });

  const testApplicationDirectory = path.join(__dirname, '..', 'shared', 'testApp');
  const remoteServerBinary = path.join(__dirname, '..', 'shared', 'remote.js');

  processes.remoteServer = shell.exec(`node ${remoteServerBinary}`, { async: true });

  childProcess = shell.exec('npx wolkenkit start --shared-key wolkenkit', {
    cwd: testApplicationDirectory
  });

  if (childProcess.code !== 0) {
    throw new Error('Failed to start wolkenkit test application.');
  }

  if (seleniumEnvironment === 'browserstack') {
    const local = new Local();

    await new Promise((resolve, reject) => {
      local.start({
        key: processenv('BROWSERSTACK_ACCESS_KEY')
      }, err => {
        if (err) {
          return reject(err);
        }

        processes.browserstack = {
          async kill () {
            await new Promise((resolveStop, rejectStop) => {
              local.stop(errStop => {
                if (errStop) {
                  return rejectStop(errStop);
                }
                resolveStop();
              });
            });
          }
        };

        resolve();
      });
    });

    return;
  }

  // Start local Selenium server.
  childProcess = shell.exec(`npx selenium-standalone install`, { cwd: projectRoot });

  if (childProcess.code !== 0) {
    throw new Error('Failed to run selenium-standalone install.');
  }

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
