'use strict';

const events = require('events');

const Promise = require('es6-promise').Promise;

const localStorage = require('./localStorage'),
      request = require('./request');

const EventEmitter = events.EventEmitter;

class ConfigurationWatcher extends EventEmitter {
  constructor (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.networkConnection) {
      throw new Error('Network connection is missing.');
    }

    super();

    this.networkConnection = options.networkConnection;
    this.host = options.networkConnection.host;
    this.port = options.networkConnection.port;
    this.hasEverBeenOffline = false;

    this.key = `wolkenkit_${this.host}:${this.port}_configuration`;

    this.wentOnline = this.wentOnline.bind(this);
    this.wentOffline = this.wentOffline.bind(this);

    if (options.configuration) {
      return process.nextTick(() => this.emit('fetched', options.configuration));
    }

    this.wentOnline();
  }

  waitForNetworkChange () {
    const { networkConnection } = this;

    if (networkConnection.isOnline) {
      networkConnection.once('offline', this.wentOffline);
    } else {
      networkConnection.once('online', this.wentOnline);
    }
  }

  wentOnline () {
    this.getConfigurationFromServer().
      then(configuration => {
        if (this.hasEverBeenOffline && this.isOutdated(configuration)) {
          this.setConfigurationToLocalStorage(configuration);

          return process.nextTick(() => this.emit('outdated', configuration));
        }

        this.setConfigurationToLocalStorage(configuration);
        process.nextTick(() => this.emit('fetched', configuration));
        this.waitForNetworkChange();
      }).
      catch(() => {
        this.wentOffline();
      });
  }

  wentOffline () {
    this.hasEverBeenOffline = true;

    const configuration = this.getConfigurationFromLocalStorage();

    if (!configuration) {
      this.emit('error', new Error('Failed to get configuration.'));
    }

    process.nextTick(() => this.emit('fetched', configuration));
    this.waitForNetworkChange();
  }

  isOutdated (nextConfiguration) {
    const currentConfiguration = this.getConfigurationFromLocalStorage();

    if (!currentConfiguration) {
      return false;
    }

    return JSON.stringify(nextConfiguration) !== JSON.stringify(currentConfiguration);
  }

  getConfigurationFromServer () {
    const { host, port } = this;

    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        hostname: host,
        port,
        path: '/v1/configuration.json',
        withCredentials: false
      }, (err, res) => {
        if (err) {
          return reject(err);
        }
        if (res.statusCode !== 200) {
          return reject(new Error('Unexpected status code.'));
        }

        try {
          const configuration = JSON.parse(res.body);

          resolve(configuration);
        } catch (ex) {
          reject(ex);
        }
      });
    });
  }

  getConfigurationFromLocalStorage () {
    const { key } = this;
    const value = localStorage.getItem(key);

    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (ex) {
      localStorage.removeItem(key);

      return undefined;
    }
  }

  setConfigurationToLocalStorage (configuration) {
    const { key } = this;

    localStorage.setItem(key, JSON.stringify(configuration));
  }

  // Internal function, for tests only.
  destroy (options) {
    options = options || {};
    options.keepLocalStorage = options.keepLocalStorage || false;

    const { key, networkConnection } = this;

    networkConnection.removeListener('offline', this.wentOffline);
    networkConnection.removeListener('online', this.wentOnline);

    if (options.keepLocalStorage) {
      return;
    }

    localStorage.removeItem(key);
  }
}

module.exports = ConfigurationWatcher;
