'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = require('events');

var Promise = require('es6-promise').Promise;

var localStorage = require('./localStorage'),
    request = require('./request');

var EventEmitter = events.EventEmitter;

var ConfigurationWatcher = function (_EventEmitter) {
  _inherits(ConfigurationWatcher, _EventEmitter);

  function ConfigurationWatcher(options) {
    _classCallCheck(this, ConfigurationWatcher);

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.networkConnection) {
      throw new Error('Network connection is missing.');
    }

    var _this = _possibleConstructorReturn(this, (ConfigurationWatcher.__proto__ || Object.getPrototypeOf(ConfigurationWatcher)).call(this));

    _this.networkConnection = options.networkConnection;
    _this.host = options.networkConnection.host;
    _this.port = options.networkConnection.port;
    _this.hasEverBeenOffline = false;

    _this.key = 'wolkenkit_' + _this.host + ':' + _this.port + '_configuration';

    _this.wentOnline = _this.wentOnline.bind(_this);
    _this.wentOffline = _this.wentOffline.bind(_this);

    if (options.configuration) {
      var _ret;

      return _ret = process.nextTick(function () {
        return _this.emit('fetched', options.configuration);
      }), _possibleConstructorReturn(_this, _ret);
    }

    _this.wentOnline();
    return _this;
  }

  _createClass(ConfigurationWatcher, [{
    key: 'waitForNetworkChange',
    value: function waitForNetworkChange() {
      var networkConnection = this.networkConnection;


      if (networkConnection.isOnline) {
        networkConnection.once('offline', this.wentOffline);
      } else {
        networkConnection.once('online', this.wentOnline);
      }
    }
  }, {
    key: 'wentOnline',
    value: function wentOnline() {
      var _this2 = this;

      this.getConfigurationFromServer().then(function (configuration) {
        if (_this2.hasEverBeenOffline && _this2.isOutdated(configuration)) {
          _this2.setConfigurationToLocalStorage(configuration);

          return process.nextTick(function () {
            return _this2.emit('outdated', configuration);
          });
        }

        _this2.setConfigurationToLocalStorage(configuration);
        process.nextTick(function () {
          return _this2.emit('fetched', configuration);
        });
        _this2.waitForNetworkChange();
      }).catch(function () {
        _this2.wentOffline();
      });
    }
  }, {
    key: 'wentOffline',
    value: function wentOffline() {
      var _this3 = this;

      this.hasEverBeenOffline = true;

      var configuration = this.getConfigurationFromLocalStorage();

      if (!configuration) {
        this.emit('error', new Error('Failed to get configuration.'));
      }

      process.nextTick(function () {
        return _this3.emit('fetched', configuration);
      });
      this.waitForNetworkChange();
    }
  }, {
    key: 'isOutdated',
    value: function isOutdated(nextConfiguration) {
      var currentConfiguration = this.getConfigurationFromLocalStorage();

      if (!currentConfiguration) {
        return false;
      }

      return JSON.stringify(nextConfiguration) !== JSON.stringify(currentConfiguration);
    }
  }, {
    key: 'getConfigurationFromServer',
    value: function getConfigurationFromServer() {
      var host = this.host,
          port = this.port;


      return new Promise(function (resolve, reject) {
        request({
          method: 'GET',
          hostname: host,
          port: port,
          path: '/v1/configuration.json',
          withCredentials: false
        }, function (err, res) {
          if (err) {
            return reject(err);
          }
          if (res.statusCode !== 200) {
            return reject(new Error('Unexpected status code.'));
          }

          try {
            var configuration = JSON.parse(res.body);

            resolve(configuration);
          } catch (ex) {
            reject(ex);
          }
        });
      });
    }
  }, {
    key: 'getConfigurationFromLocalStorage',
    value: function getConfigurationFromLocalStorage() {
      var key = this.key;

      var value = localStorage.getItem(key);

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
  }, {
    key: 'setConfigurationToLocalStorage',
    value: function setConfigurationToLocalStorage(configuration) {
      var key = this.key;


      localStorage.setItem(key, JSON.stringify(configuration));
    }

    // Internal function, for tests only.

  }, {
    key: 'destroy',
    value: function destroy(options) {
      options = options || {};
      options.keepLocalStorage = options.keepLocalStorage || false;

      var key = this.key,
          networkConnection = this.networkConnection;


      networkConnection.removeListener('offline', this.wentOffline);
      networkConnection.removeListener('online', this.wentOnline);

      if (options.keepLocalStorage) {
        return;
      }

      localStorage.removeItem(key);
    }
  }]);

  return ConfigurationWatcher;
}(EventEmitter);

module.exports = ConfigurationWatcher;