'use strict';

const path = require('path');

const processenv = require('processenv'),
      shell = require('shelljs');

const pre = async function () {
  const projectRoot = path.join(__dirname, '..', '..');

  // Remove bundle from previous tests
  shell.rm('-rf', [
    path.join(__dirname, '..', '..', 'bundle')
  ]);

  // Precompile and create a temporary wolkenkit-client SDK distributable, so
  // that the tests always use the latest version.
  const childProcess = shell.exec(`npx roboter bundle`, {
    cwd: projectRoot,
    env: Object.assign({}, processenv(), {
      ANALYZE_BUNDLE: true
    })
  });

  if (childProcess.code !== 0) {
    throw new Error('Failed to create bundle.');
  }
};

module.exports = pre;
