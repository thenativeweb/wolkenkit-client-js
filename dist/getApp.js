'use strict';

const events = require('events');

const merge = require('lodash/merge'),
      Promise = require('es6-promise').Promise;

const ConfigurationWatcher = require('./ConfigurationWatcher'),
      getEventsApi = require('./apiBuilder/getEventsApi'),
      getReadModelApi = require('./apiBuilder/getReadModelApi'),
      getWriteModelApi = require('./apiBuilder/getWriteModelApi'),
      ListStore = require('./modelStoreBroker').ListStore,
      ModelStore = require('./ModelStore'),
      NetworkConnection = require('./NetworkConnection'),
      wires = require('./wires');

const EventEmitter = events.EventEmitter;

const getApp = function (options) {
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

  const { host, port, protocol, authentication } = options;

  return new Promise((resolve, reject) => {
    const app = new EventEmitter();

    const networkConnection = new NetworkConnection({ host, port });
    const configurationWatcher = new ConfigurationWatcher({
      networkConnection,
      configuration: options.configuration
    });

    const modelStore = new ModelStore();

    const Wire = wires[protocol],
          wire = new Wire({ app, host, port });

    let configuration,
        hasErrored = false,
        isWireConnected = false;

    const runApplication = function () {
      if (hasErrored) {
        return;
      }

      const { readModel, writeModel } = configuration;

      modelStore.initialize({
        stores: {
          lists: new ListStore({ wire })
        }
      }, err => {
        if (err) {
          return reject(err);
        }

        const eventsApi = getEventsApi({ wire, writeModel }),
              readModelApi = getReadModelApi({ wire, readModel, modelStore }),
              writeModelApi = getWriteModelApi({ app, wire, writeModel });

        merge(app, eventsApi, writeModelApi, readModelApi);

        resolve(app);
      });
    };

    const onAuthenticationRequired = function () {
      app.auth.login();
    };

    const onWireConnect = function () {
      isWireConnected = true;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    const onWireError = function (err) {
      app.emit('error', err);
    };

    const onOnline = function () {
      app.emit('connected');
    };

    const onOffline = function () {
      app.emit('disconnected');
    };

    const onConfigurationFetched = function (fetchedConfiguration) {
      configuration = fetchedConfiguration;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    const onConfigurationError = function (err) {
      hasErrored = true;

      // If there was an error fetching the configuration while starting the
      // application, and we do not have a previous one, reject connecting to
      // the application.
      if (!configuration) {
        return reject(err);
      }

      // If there is an error fetching the configuration at runtime, emit an
      // error, but the application may keep running.
      app.emit('error', err);
    };

    const onConfigurationOutdated = function () {
      app.emit('outdated');
    };

    app.auth = authentication;

    // Internal function, for tests only.
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