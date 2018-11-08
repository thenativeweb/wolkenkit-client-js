'use strict';

var events = require('events');

var merge = require('lodash/merge'),
    Promise = require('es6-promise').Promise;

var ConfigurationWatcher = require('./ConfigurationWatcher'),
    getEventsApi = require('./apiBuilder/getEventsApi'),
    getReadModelApi = require('./apiBuilder/getReadModelApi'),
    getWriteModelApi = require('./apiBuilder/getWriteModelApi'),
    ListStore = require('./modelStoreBroker').ListStore,
    ModelStore = require('./ModelStore'),
    NetworkConnection = require('./NetworkConnection'),
    wires = require('./wires');

var EventEmitter = events.EventEmitter;

var getApp = function getApp(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.host) {
    throw new Error('Host is missing.');
  }

  if (!options.port) {
    throw new Error('Port is missing.');
  }

  if (!options.protocol) {
    throw new Error('Protocol is missing.');
  }

  if (!options.authentication) {
    throw new Error('Authentication is missing.');
  }

  var host = options.host,
      port = options.port,
      protocol = options.protocol,
      authentication = options.authentication;
  return new Promise(function (resolve, reject) {
    var app = new EventEmitter();
    var networkConnection = new NetworkConnection({
      host: host,
      port: port
    });
    var configurationWatcher = new ConfigurationWatcher({
      networkConnection: networkConnection,
      configuration: options.configuration
    });
    var modelStore = new ModelStore();
    var Wire = wires[protocol],
        wire = new Wire({
      app: app,
      host: host,
      port: port
    });
    var configuration,
        hasErrored = false,
        isWireConnected = false;

    var runApplication = function runApplication() {
      if (hasErrored) {
        return;
      }

      var _configuration = configuration,
          readModel = _configuration.readModel,
          writeModel = _configuration.writeModel;
      modelStore.initialize({
        stores: {
          lists: new ListStore({
            wire: wire
          })
        }
      }, function (err) {
        if (err) {
          return reject(err);
        }

        var eventsApi = getEventsApi({
          wire: wire,
          writeModel: writeModel
        }),
            readModelApi = getReadModelApi({
          wire: wire,
          readModel: readModel,
          modelStore: modelStore
        }),
            writeModelApi = getWriteModelApi({
          app: app,
          wire: wire,
          writeModel: writeModel
        });
        merge(app, eventsApi, writeModelApi, readModelApi);
        resolve(app);
      });
    };

    var onAuthenticationRequired = function onAuthenticationRequired() {
      app.auth.login();
    };

    var onWireConnect = function onWireConnect() {
      isWireConnected = true;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    var onWireError = function onWireError(err) {
      app.emit('error', err);
    };

    var onOnline = function onOnline() {
      app.emit('connected');
    };

    var onOffline = function onOffline() {
      app.emit('disconnected');
    };

    var onConfigurationFetched = function onConfigurationFetched(fetchedConfiguration) {
      configuration = fetchedConfiguration;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    var onConfigurationError = function onConfigurationError(err) {
      hasErrored = true; // If there was an error fetching the configuration while starting the
      // application, and we do not have a previous one, reject connecting to
      // the application.

      if (!configuration) {
        return reject(err);
      } // If there is an error fetching the configuration at runtime, emit an
      // error, but the application may keep running.


      app.emit('error', err);
    };

    var onConfigurationOutdated = function onConfigurationOutdated() {
      app.emit('outdated');
    };

    app.auth = authentication; // Internal function, for tests only.

    app.destroy = function (optionsDestroy) {
      optionsDestroy = optionsDestroy || {};
      optionsDestroy.keepLocalStorage = optionsDestroy.keepLocalStorage || false;
      wire.removeListener('connect', onWireConnect);
      wire.removeListener('authentication-required', onAuthenticationRequired);
      wire.removeListener('error', onWireError);
      networkConnection.removeListener('online', onOnline);
      networkConnection.removeListener('offline', onOffline);
      networkConnection.destroy();
      configurationWatcher.removeListener('fetched', onConfigurationFetched);
      configurationWatcher.removeListener('error', onConfigurationError);
      configurationWatcher.removeListener('outdated', onConfigurationOutdated);
      configurationWatcher.destroy(optionsDestroy);
    };

    wire.once('connect', onWireConnect);
    wire.on('authentication-required', onAuthenticationRequired);
    wire.on('error', onWireError);
    networkConnection.on('online', onOnline);
    networkConnection.on('offline', onOffline);
    configurationWatcher.once('fetched', onConfigurationFetched);
    configurationWatcher.on('error', onConfigurationError);
    configurationWatcher.on('outdated', onConfigurationOutdated);
  });
};

module.exports = getApp;