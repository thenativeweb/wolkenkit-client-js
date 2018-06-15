'use strict';

var None = require('./None'),
    OpenIdConnect = require('./OpenIdConnect');

var authentication = {
  None: None,
  OpenIdConnect: OpenIdConnect
};

module.exports = authentication;