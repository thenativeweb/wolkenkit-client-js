'use strict';

var isNode = require('is-node'),
    Promise = require('es6-promise').Promise;

var authenticationStrategies = require('./authentication'),
    getApp = require('./getApp');

var appCache = {};
var wolkenkitClient = {
  authentication: authenticationStrategies,
  connect: function connect(options) {
    if (!options) {
      throw new Error('Options are missing.');
    }

    if (!options.host) {
      throw new Error('Host is missing.');
    }

    var configuration = options.configuration,
        host = options.host,
        _options$port = options.port,
        port = _options$port === void 0 ? 443 : _options$port,
        _options$protocol = options.protocol,
        protocol = _options$protocol === void 0 ? isNode ? 'https' : 'wss' : _options$protocol,
        _options$authenticati = options.authentication,
        authentication = _options$authenticati === void 0 ? new this.authentication.None() : _options$authenticati;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        var appKey = "".concat(host, ":").concat(port);
        var app = appCache[appKey];

        if (app) {
          return resolve(app);
        }

        getApp({
          host: host,
          port: port,
          protocol: protocol,
          authentication: authentication,
          configuration: configuration
        }).then(function (newApp) {
          appCache[appKey] = newApp;
          resolve(newApp);
        }).catch(reject);
      }, 0.05 * 1000);
    });
  },
  // Internal function, for tests only.
  reset: function reset(options) {
    options = options || {};
    options.keepLocalStorage = options.keepLocalStorage || false;
    Object.keys(appCache).forEach(function (appName) {
      appCache[appName].destroy(options);
    });
    appCache = {};
  }
};
module.exports = wolkenkitClient;