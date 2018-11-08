'use strict';

var Local = require('./Local'),
    None = require('./None'),
    OpenIdConnect = require('./OpenIdConnect');

var authentication = {
  Local: Local,
  None: None,
  OpenIdConnect: OpenIdConnect
};
module.exports = authentication;