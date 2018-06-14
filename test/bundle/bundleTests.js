'use strict';

const fs = require('fs'),
      path = require('path');

const assert = require('assertthat');

const pathToBundle = path.join(__dirname, '..', '..', 'bundle', 'wolkenkitClient.js');

suite('bundle', () => {
  test('should be below 200kb.', async () => {
    /* eslint-disable */
    const bundleStats = fs.statSync(pathToBundle);
    /* eslint-enable */

    assert.that(bundleStats.size / 1024).is.atMost(200);
  });
});
