'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = require('events'),
    stream = require('stream');

var jsonLinesClient = require('json-lines-client'),
    Promise = require('es6-promise').Promise;

var request = require('../request');

var EventEmitter = events.EventEmitter,
    PassThrough = stream.PassThrough;

var Https = function (_EventEmitter) {
  _inherits(Https, _EventEmitter);

  function Https(options) {
    _classCallCheck(this, Https);

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

    var _this = _possibleConstructorReturn(this, (Https.__proto__ || Object.getPrototypeOf(Https)).call(this));

    _this.app = options.app;
    _this.host = options.host;
    _this.port = options.port;

    process.nextTick(function () {
      return _this.emit('connect');
    });
    return _this;
  }

  _createClass(Https, [{
    key: 'sendCommand',
    value: function sendCommand(command) {
      var _this2 = this;

      if (!command) {
        throw new Error('Command is missing.');
      }

      return new Promise(function (resolve, reject) {
        var app = _this2.app,
            host = _this2.host,
            port = _this2.port;


        var headers = {
          'content-type': 'application/json'
        };

        var token = app.auth.getToken();

        if (token) {
          headers.authorization = 'Bearer ' + token;
        }

        request({
          method: 'POST',
          hostname: host,
          port: port,
          path: '/v1/command',
          headers: headers,
          withCredentials: false
        }, JSON.stringify(command), function (err, res) {
          if (err) {
            return reject(err);
          }
          if (res.statusCode === 401) {
            _this2.emit('authentication-required');

            return reject(new Error('Authentication required.'));
          }
          if (res.statusCode !== 200) {
            return reject(new Error(res.body));
          }
          resolve();
        });
      });
    }
  }, {
    key: 'subscribeToEvents',
    value: function subscribeToEvents(filter) {
      var _this3 = this;

      filter = filter || {};

      var app = this.app,
          host = this.host,
          port = this.port;


      var headers = {},
          token = app.auth.getToken();

      if (token) {
        headers.authorization = 'Bearer ' + token;
      }

      var subscriptionStream = new PassThrough({ objectMode: true });

      var cancelSubscription = function cancelSubscription() {
        subscriptionStream.end();
      };

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the subscriptionStream that is returned synchronously.
      process.nextTick(function () {
        jsonLinesClient({
          protocol: 'https',
          headers: headers,
          host: host,
          port: port,
          path: '/v1/events',
          body: filter
        }, function (server) {
          var hadError = false;

          var onServerData = void 0,
              onServerEnd = void 0,
              onServerError = void 0,
              onSubscriptionFinish = void 0;

          var unsubscribe = function unsubscribe() {
            server.stream.removeListener('data', onServerData);
            server.stream.removeListener('end', onServerEnd);
            server.stream.removeListener('error', onServerError);
            subscriptionStream.removeListener('finish', onSubscriptionFinish);
          };

          onServerData = function onServerData(data) {
            subscriptionStream.write(data);
          };

          onServerEnd = function onServerEnd() {
            unsubscribe();
            server.disconnect();
            subscriptionStream.end();
          };

          onServerError = function onServerError(err) {
            hadError = true;
            unsubscribe();
            server.disconnect();

            if (err.statusCode === 401) {
              subscriptionStream.end();
              _this3.emit('authentication-required');

              return;
            }

            subscriptionStream.emit('error', err);
          };

          onSubscriptionFinish = function onSubscriptionFinish() {
            unsubscribe();
            server.disconnect();
            server.stream.resume();
          };

          server.stream.on('data', onServerData);
          server.stream.on('end', onServerEnd);
          server.stream.on('error', onServerError);
          subscriptionStream.on('finish', onSubscriptionFinish);

          // Delay notifying the consumer, to give the underlying JSON lines
          // connection the chance to emit an error event.
          process.nextTick(function () {
            if (hadError) {
              return;
            }

            subscriptionStream.emit('start');
          });
        });
      });

      return { stream: subscriptionStream, cancel: cancelSubscription };
    }
  }, {
    key: 'readModel',
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
          host = this.host,
          port = this.port;
      var modelName = options.modelName,
          modelType = options.modelType;


      options.query = options.query || {};

      var query = {};

      if (options.query.where) {
        query.where = JSON.stringify(options.query.where);
      }
      if (options.query.orderBy) {
        query.orderBy = JSON.stringify(options.query.orderBy);
      }
      if (options.query.skip) {
        query.skip = options.query.skip;
      }
      if (options.query.take) {
        query.take = options.query.take;
      }

      var headers = {},
          token = app.auth.getToken();

      if (token) {
        headers.authorization = 'Bearer ' + token;
      }

      var modelStream = new PassThrough({ objectMode: true });

      var cancelModel = function cancelModel() {
        modelStream.end();
      };

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the modelStream that is returned synchronously.
      process.nextTick(function () {
        jsonLinesClient({
          protocol: 'https',
          headers: headers,
          host: host,
          port: port,
          path: '/v1/read/' + modelType + '/' + modelName,
          query: query
        }, function (server) {
          var onModelFinish = void 0,
              onServerData = void 0,
              onServerEnd = void 0,
              onServerError = void 0;

          var unsubscribe = function unsubscribe() {
            server.stream.removeListener('data', onServerData);
            server.stream.removeListener('end', onServerEnd);
            server.stream.removeListener('error', onServerError);
            modelStream.removeListener('finish', onModelFinish);
          };

          onServerData = function onServerData(data) {
            modelStream.write(data);
          };

          onServerEnd = function onServerEnd() {
            unsubscribe();
            server.disconnect();
            modelStream.end();
          };

          onServerError = function onServerError(err) {
            unsubscribe();
            server.disconnect();

            if (err.statusCode === 401) {
              modelStream.end();
              _this4.emit('authentication-required');

              return;
            }

            modelStream.emit('error', err);
          };

          onModelFinish = function onModelFinish() {
            unsubscribe();
            server.disconnect();
            server.stream.resume();
          };

          server.stream.on('data', onServerData);
          server.stream.on('end', onServerEnd);
          server.stream.on('error', onServerError);
          modelStream.on('finish', onModelFinish);
        });
      });

      return { stream: modelStream, cancel: cancelModel };
    }
  }]);

  return Https;
}(EventEmitter);

module.exports = Https;