'use strict';

const isNode = require('is-node'),
      Promise = require('es6-promise').Promise;

const authenticationStrategies = require('./authentication'),
      getApp = require('./getApp');

let appCache = {};

const wolkenkitClient = {
  authentication: authenticationStrategies,

  connect (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }

    const {
      configuration,
      host,
      port = 443,
      protocol = isNode ? 'https' : 'wss',
      authentication = new this.authentication.None()
    } = options;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const appKey = `${host}:${port}`;
        const app = appCache[appKey];

        if (app) {
          return resolve(app);
        }

        getApp({ host, port, protocol, authentication, configuration }).
          then(newApp => {
            appCache[appKey] = newApp;
            resolve(newApp);
          }).
          catch(reject);
      }, 0.05 * 1000);
    });
  },

  // Internal function, for tests only.
  reset (options) {
    options = options || {};
    options.keepLocalStorage = options.keepLocalStorage || false;

    Object.keys(appCache).forEach(appName => {
      appCache[appName].destroy(options);
    });

    appCache = {};
  }
};

module.exports = wolkenkitClient;
