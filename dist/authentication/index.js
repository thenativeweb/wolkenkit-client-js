'use strict';

const Local = require('./Local'),
      None = require('./None'),
      OpenIdConnect = require('./OpenIdConnect');

const authentication = {
  Local,
  None,
  OpenIdConnect
};

module.exports = authentication;