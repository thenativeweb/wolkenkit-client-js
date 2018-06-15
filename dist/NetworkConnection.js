'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = require('events');

var request = require('./request');

var EventEmitter = events.EventEmitter;

var NetworkConnection = function (_EventEmitter) {
  _inherits(NetworkConnection, _EventEmitter);

  function NetworkConnection(options) {
    _classCallCheck(this, NetworkConnection);

    var _this = _possibleConstructorReturn(this, (NetworkConnection.__proto__ || Object.getPrototypeOf(NetworkConnection)).call(this));

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }
    if (!options.port) {
      throw new Error('Port is missing.');
    }

    _this.host = options.host;
    _this.port = options.port;

    _this.isOnline = undefined;
    _this.wasOnline = undefined;
    _this.interval = 2 * 1000;
    _this.timeoutId = undefined;

    _this.test();
    return _this;
  }

  _createClass(NetworkConnection, [{
    key: 'online',
    value: function online() {
      this.wasOnline = this.isOnline;
      this.isOnline = true;

      if (this.isOnline !== this.wasOnline) {
        this.emit('online');
      }
    }
  }, {
    key: 'offline',
    value: function offline() {
      this.wasOnline = this.isOnline;
      this.isOnline = false;

      if (this.isOnline !== this.wasOnline) {
        this.emit('offline');
      }
    }
  }, {
    key: 'test',
    value: function test() {
      var _this2 = this;

      var host = this.host,
          port = this.port;


      request({
        method: 'GET',
        hostname: host,
        port: port,
        path: '/v1/ping?_=' + Date.now(),
        withCredentials: false
      }, function (err) {
        if (err) {
          _this2.offline();
        } else {
          _this2.online();
        }

        clearTimeout(_this2.timeoutId);
        _this2.timeoutId = setTimeout(function () {
          return _this2.test();
        }, _this2.interval);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      clearTimeout(this.timeoutId);
    }
  }]);

  return NetworkConnection;
}(EventEmitter);

module.exports = NetworkConnection;