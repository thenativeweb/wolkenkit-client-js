'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var events = require('events');

var Promise = require('es6-promise').Promise;

var localStorage = require('./localStorage'),
    request = require('./request');

var EventEmitter = events.EventEmitter;

var ConfigurationWatcher =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(ConfigurationWatcher, _EventEmitter);

  function ConfigurationWatcher(options) {
    var _this;

    _classCallCheck(this, ConfigurationWatcher);

    if (!options) {
      throw new Error('Options are missing.');
    }

    if (!options.networkConnection) {
      throw new Error('Network connection is missing.');
    }

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConfigurationWatcher).call(this));
    _this.networkConnection = options.networkConnection;
    _this.host = options.networkConnection.host;
    _this.port = options.networkConnection.port;
    _this.hasEverBeenOffline = false;
    _this.key = "wolkenkit_".concat(_this.host, ":").concat(_this.port, "_configuration");
    _this.wentOnline = _this.wentOnline.bind(_assertThisInitialized(_assertThisInitialized(_this)));
    _this.wentOffline = _this.wentOffline.bind(_assertThisInitialized(_assertThisInitialized(_this)));

    if (options.configuration) {
      return _possibleConstructorReturn(_this, process.nextTick(function () {
        return _this.emit('fetched', options.configuration);
      }));
    }

    _this.wentOnline();

    return _this;
  }

  _createClass(ConfigurationWatcher, [{
    key: "waitForNetworkChange",
    value: function waitForNetworkChange() {
      var networkConnection = this.networkConnection;

      if (networkConnection.isOnline) {
        networkConnection.once('offline', this.wentOffline);
      } else {
        networkConnection.once('online', this.wentOnline);
      }
    }
  }, {
    key: "wentOnline",
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
    key: "wentOffline",
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
    key: "isOutdated",
    value: function isOutdated(nextConfiguration) {
      var currentConfiguration = this.getConfigurationFromLocalStorage();

      if (!currentConfiguration) {
        return false;
      }

      return JSON.stringify(nextConfiguration) !== JSON.stringify(currentConfiguration);
    }
  }, {
    key: "getConfigurationFromServer",
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
    key: "getConfigurationFromLocalStorage",
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
    key: "setConfigurationToLocalStorage",
    value: function setConfigurationToLocalStorage(configuration) {
      var key = this.key;
      localStorage.setItem(key, JSON.stringify(configuration));
    } // Internal function, for tests only.

  }, {
    key: "destroy",
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