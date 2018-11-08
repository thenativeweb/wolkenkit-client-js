'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var events = require('events');

var request = require('./request');

var EventEmitter = events.EventEmitter;

var NetworkConnection =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(NetworkConnection, _EventEmitter);

  function NetworkConnection(options) {
    var _this;

    _classCallCheck(this, NetworkConnection);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(NetworkConnection).call(this));

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
    key: "online",
    value: function online() {
      this.wasOnline = this.isOnline;
      this.isOnline = true;

      if (this.isOnline !== this.wasOnline) {
        this.emit('online');
      }
    }
  }, {
    key: "offline",
    value: function offline() {
      this.wasOnline = this.isOnline;
      this.isOnline = false;

      if (this.isOnline !== this.wasOnline) {
        this.emit('offline');
      }
    }
  }, {
    key: "test",
    value: function test() {
      var _this2 = this;

      var host = this.host,
          port = this.port;
      request({
        method: 'GET',
        hostname: host,
        port: port,
        path: "/v1/ping?_=".concat(Date.now()),
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
    key: "destroy",
    value: function destroy() {
      clearTimeout(this.timeoutId);
    }
  }]);

  return NetworkConnection;
}(EventEmitter);

module.exports = NetworkConnection;