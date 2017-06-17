'use strict';

const fs = require('fs'),
      path = require('path');

const Limes = require('limes');

const limes = new Limes({
  identityProviderName: 'test.wolkenkit.io',
  /* eslint-disable no-sync */
  privateKey: fs.readFileSync(path.join(__dirname, '..', 'keys', 'io.wolkenkit.test', 'privateKey.pem')),
  certificate: fs.readFileSync(path.join(__dirname, '..', 'keys', 'io.wolkenkit.test', 'certificate.pem'))
  /* eslint-enable no-sync */
});

module.exports = function (subject, payload) {
  return limes.issueTokenFor(subject, payload);
};
