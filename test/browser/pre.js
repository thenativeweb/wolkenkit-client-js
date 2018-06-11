'use strict';

const path = require('path');

const processenv = require('processenv'),
      sauceConnectLauncher = require('sauce-connect-launcher'),
      shell = require('shelljs');

const processes = require('../shared/processes');

const seleniumEnvironment = processenv('SELENIUM_ENV') || 'local';

const pre = async function () {
  shell.exec('pkill -f selenium-standalone');

  const tempDistDir = path.join(__dirname, 'dist');
  const tempBuildDir = path.join(__dirname, 'build');
  const projectRoot = path.join(__dirname, '..', '..');

  // Precompile and create a temporary wolkenkit-client SDK distributable, so
  // that the tests always use the latest version.
  shell.exec(`npx babel src --out-dir ${tempDistDir} --copy-files`, { cwd: projectRoot });

  // Build and bundle the OpenID Connect client test application.
  shell.exec(`npx webpack`, { cwd: __dirname });

  processes.httpServer = shell.exec(`npx http-server -s -p 4567 ${tempBuildDir}`, { cwd: projectRoot, async: true });

  if (seleniumEnvironment === 'local') {
    // Start local Selenium server.
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

    return;
  }

  // Connect to SauceLabs via secure tunnel using sauce connect.
  await new Promise((resolve, reject) => {
    sauceConnectLauncher({
      username: processenv('SAUCE_USERNAME'),
      accessKey: processenv('SAUCE_ACCESS_KEY'),
      verbose: true
    }, (err, sauceConnectProcess) => {
      if (err) {
        /* eslint-disable no-console */
        console.error(err);
        /* eslint-enable no-console */

        return reject(err);
      }

      processes.sauceConnect = sauceConnectProcess;

      resolve();
    });
  });
};

module.exports = pre;
