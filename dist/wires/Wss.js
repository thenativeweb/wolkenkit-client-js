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

var events = require('events'),
    stream = require('stream');

var Promise = require('es6-promise').Promise,
    uuid = require('uuidv4'),
    WebSocket = require('ws');

var EventEmitter = events.EventEmitter,
    PassThrough = stream.PassThrough;

var Wss =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Wss, _EventEmitter);

  function Wss(options) {
    var _this;

    _classCallCheck(this, Wss);

    if (!options) {
      throw new Error('Options are missing.');
    }

    if (!options.app) {
      throw new Error('App is missing.');
    }

    if (!options.host) {
      throw new Error('Host is missing.');
    }

    if (!options.port) {
      throw new Error('Port is missing.');
    }

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Wss).call(this));
    _this.app = options.app;
    _this.host = options.host;
    _this.port = options.port;
    var webSocket = new WebSocket("wss://".concat(_this.host, ":").concat(_this.port));

    webSocket.onopen = function () {
      _this.emit('connect');
    };

    _this.socket = new EventEmitter();

    _this.socket.send = function (message) {
      if (webSocket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not open.');
      }

      webSocket.send(JSON.stringify(message));
    };

    webSocket.onmessage = function (event) {
      try {
        var message = JSON.parse(event.data);

        if (!message.procedureId) {
          return _this.emit('error', new Error("".concat(message.payload, " (").concat(message.statusCode, ")")));
        }

        _this.socket.emit(message.procedureId, message);
      } catch (ex) {
        _this.socket.emit('error', ex);
      }
    };

    return _this;
  }

  _createClass(Wss, [{
    key: "sendCommand",
    value: function sendCommand(command) {
      var _this2 = this;

      if (!command) {
        throw new Error('Command is missing.');
      }

      return new Promise(function (resolve, reject) {
        var app = _this2.app,
            socket = _this2.socket;
        var token = app.auth.getToken();
        var message = {
          type: 'sendCommand',
          version: 'v1',
          procedureId: uuid(),
          payload: command
        };

        if (token) {
          message.token = token;
        }

        var onMessage = function onMessage(responseMessage) {
          if (responseMessage.type === 'error') {
            if (responseMessage.statusCode === 401) {
              _this2.emit('authentication-required');

              return reject(new Error('Authentication required.'));
            }

            return reject(new Error(responseMessage.payload));
          }

          resolve();
        };

        socket.once(message.procedureId, onMessage);

        try {
          socket.send(message);
        } catch (ex) {
          socket.removeListener(message.procedureId, onMessage);
          reject(ex.message);
        }
      });
    }
  }, {
    key: "subscribeToEvents",
    value: function subscribeToEvents(filter) {
      var _this3 = this;

      filter = filter || {};
      var app = this.app,
          socket = this.socket;
      var hasBeenCanceledByUser = false;
      var token = app.auth.getToken();
      var message = {
        type: 'subscribeEvents',
        version: 'v1',
        procedureId: uuid(),
        payload: {
          filter: filter
        }
      };

      if (token) {
        message.token = token;
      }

      var subscriptionStream = new PassThrough({
        objectMode: true
      });
      var onSubscriptionFinish, onSubscriptionMessage;

      var unsubscribe = function unsubscribe() {
        subscriptionStream.removeListener('finish', onSubscriptionFinish);
        socket.removeListener(message.procedureId, onSubscriptionMessage);

        try {
          socket.send({
            type: 'unsubscribeEvents',
            version: 'v1',
            token: message.token,
            procedureId: message.procedureId
          });
        } catch (ex) {
          // If the user has already canceled the subscription they are not
          // interested in errors anymore. Otherwise, this could lead to an
          // infinite loop, as the user tries to cancel as a result of the
          // error.
          if (hasBeenCanceledByUser) {
            return;
          }

          subscriptionStream.emit('error', ex);
        }
      };

      var cancelSubscription = function cancelSubscription() {
        hasBeenCanceledByUser = true;
        unsubscribe();
        subscriptionStream.end();
      };

      onSubscriptionFinish = function onSubscriptionFinish() {
        unsubscribe();
      };

      onSubscriptionMessage = function onSubscriptionMessage(subscriptionMessage) {
        switch (subscriptionMessage.type) {
          case 'subscribedEvents':
            subscriptionStream.emit('start');
            break;

          case 'event':
            subscriptionStream.write(subscriptionMessage.payload);
            break;

          case 'error':
            unsubscribe();

            if (subscriptionMessage.statusCode === 401) {
              subscriptionStream.end();

              _this3.emit('authentication-required');

              return;
            }

            subscriptionStream.emit('error', subscriptionMessage.payload);
            break;

          default:
            throw new Error('Invalid operation.');
        }
      };

      subscriptionStream.on('finish', onSubscriptionFinish);
      socket.on(message.procedureId, onSubscriptionMessage); // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the subscriptionStream that is returned synchronously.

      process.nextTick(function () {
        try {
          socket.send(message);
        } catch (ex) {
          subscriptionStream.emit('error', ex);
        }
      });
      return {
        stream: subscriptionStream,
        cancel: cancelSubscription
      };
    }
  }, {
    key: "readModel",
    value: function readModel(options) {
      var _this4 = this;

      if (!options) {
        throw new Error('Options are missing.');
      }

      if (!options.modelName) {
        throw new Error('Model name is missing.');
      }

      if (!options.modelType) {
        throw new Error('Model type is missing.');
      }

      var app = this.app,
          socket = this.socket;
      var modelName = options.modelName,
          modelType = options.modelType;
      var hasBeenCanceledByUser = false;
      options.query = options.query || {};
      var query = {};

      if (options.query.where) {
        query.where = options.query.where;
      }

      if (options.query.orderBy) {
        query.orderBy = options.query.orderBy;
      }

      if (options.query.skip) {
        query.skip = options.query.skip;
      }

      if (options.query.take) {
        query.take = options.query.take;
      }

      var token = app.auth.getToken();
      var message = {
        type: 'subscribeRead',
        version: 'v1',
        procedureId: uuid(),
        payload: {
          modelType: modelType,
          modelName: modelName,
          query: query
        }
      };

      if (token) {
        message.token = token;
      }

      var modelStream = new PassThrough({
        objectMode: true
      });
      var onModelFinish, onModelMessage;

      var unsubscribe = function unsubscribe() {
        modelStream.removeListener('finish', onModelFinish);
        socket.removeListener(message.procedureId, onModelMessage);

        try {
          socket.send({
            type: 'unsubscribeRead',
            version: 'v1',
            token: message.token,
            procedureId: message.procedureId
          });
        } catch (ex) {
          // If the user has already canceled the subscription they are not
          // interested in errors anymore. Otherwise, this could lead to an
          // infinite loop, as the user tries to cancel as a result of the
          // error.
          if (hasBeenCanceledByUser) {
            return;
          }

          modelStream.emit('error', ex);
        }
      };

      var cancelModel = function cancelModel() {
        hasBeenCanceledByUser = true;
        unsubscribe();
        modelStream.end();
      };

      onModelFinish = function onModelFinish() {
        unsubscribe();
      };

      onModelMessage = function onModelMessage(modelMessage) {
        switch (modelMessage.type) {
          case 'subscribedRead':
            modelStream.emit('start');
            break;

          case 'item':
            modelStream.write(modelMessage.payload);
            break;

          case 'finish':
            modelStream.end();
            unsubscribe();
            break;

          case 'error':
            unsubscribe();

            if (modelMessage.statusCode === 401) {
              modelStream.end();

              _this4.emit('authentication-required');

              return;
            }

            modelStream.emit('error', modelMessage.payload);
            break;

          default:
            throw new Error('Invalid operation.');
        }
      };

      modelStream.on('finish', onModelFinish);
      socket.on(message.procedureId, onModelMessage); // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the modelStream that is returned synchronously.

      process.nextTick(function () {
        try {
          socket.send(message);
        } catch (ex) {
          modelStream.emit('error', ex);
        }
      });
      return {
        stream: modelStream,
        cancel: cancelModel
      };
    }
  }]);

  return Wss;
}(EventEmitter);

module.exports = Wss;