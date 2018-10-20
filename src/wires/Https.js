'use strict';

const events = require('events'),
      stream = require('stream');

const jsonLinesClient = require('json-lines-client'),
      Promise = require('es6-promise').Promise;

const request = require('../request');

const EventEmitter = events.EventEmitter,
      PassThrough = stream.PassThrough;

class Https extends EventEmitter {
  constructor (options) {
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

    super();

    this.app = options.app;
    this.host = options.host;
    this.port = options.port;

    process.nextTick(() => this.emit('connect'));
  }

  sendCommand (command) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    return new Promise(async (resolve, reject) => {
      const { app, host, port } = this;

      const headers = {
        'content-type': 'application/json'
      };

      const token = await app.auth.getToken();

      if (token) {
        headers.authorization = `Bearer ${token}`;
      }

      request({
        method: 'POST',
        hostname: host,
        port,
        path: '/v1/command',
        headers,
        withCredentials: false
      }, JSON.stringify(command), (err, res) => {
        if (err) {
          return reject(err);
        }
        if (res.statusCode === 401) {
          this.emit('authentication-required');

          return reject(new Error('Authentication required.'));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(res.body));
        }
        resolve();
      });
    });
  }

  async subscribeToEvents (filter) {
    filter = filter || {};

    const { app, host, port } = this;

    const headers = {},
          token = await app.auth.getToken();

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const subscriptionStream = new PassThrough({ objectMode: true });

    const cancelSubscription = () => {
      subscriptionStream.end();
    };

    // This needs to be deferred to the next tick so that the user has a chance
    // to attach to the error event of the subscriptionStream that is returned synchronously.
    process.nextTick(() => {
      jsonLinesClient({
        protocol: 'https',
        headers,
        host,
        port,
        path: '/v1/events',
        body: filter
      }, server => {
        let hadError = false;

        let onServerData,
            onServerEnd,
            onServerError,
            onSubscriptionFinish;

        const unsubscribe = () => {
          server.stream.removeListener('data', onServerData);
          server.stream.removeListener('end', onServerEnd);
          server.stream.removeListener('error', onServerError);
          subscriptionStream.removeListener('finish', onSubscriptionFinish);
        };

        onServerData = data => {
          subscriptionStream.write(data);
        };

        onServerEnd = () => {
          unsubscribe();
          server.disconnect();
          subscriptionStream.end();
        };

        onServerError = err => {
          hadError = true;
          unsubscribe();
          server.disconnect();

          if (err.statusCode === 401) {
            subscriptionStream.end();
            this.emit('authentication-required');

            return;
          }

          subscriptionStream.emit('error', err);
        };

        onSubscriptionFinish = () => {
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
        process.nextTick(() => {
          if (hadError) {
            return;
          }

          subscriptionStream.emit('start');
        });
      });
    });

    return { stream: subscriptionStream, cancel: cancelSubscription };
  }

  async readModel (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.modelName) {
      throw new Error('Model name is missing.');
    }
    if (!options.modelType) {
      throw new Error('Model type is missing.');
    }

    const { app, host, port } = this;
    const { modelName, modelType } = options;

    options.query = options.query || {};

    const query = {};

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

    const headers = {},
          token = await app.auth.getToken();

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const modelStream = new PassThrough({ objectMode: true });

    const cancelModel = () => {
      modelStream.end();
    };

    // This needs to be deferred to the next tick so that the user has a chance
    // to attach to the error event of the modelStream that is returned synchronously.
    process.nextTick(() => {
      jsonLinesClient({
        protocol: 'https',
        headers,
        host,
        port,
        path: `/v1/read/${modelType}/${modelName}`,
        query
      }, server => {
        let onModelFinish,
            onServerData,
            onServerEnd,
            onServerError;

        const unsubscribe = () => {
          server.stream.removeListener('data', onServerData);
          server.stream.removeListener('end', onServerEnd);
          server.stream.removeListener('error', onServerError);
          modelStream.removeListener('finish', onModelFinish);
        };

        onServerData = data => {
          modelStream.write(data);
        };

        onServerEnd = () => {
          unsubscribe();
          server.disconnect();
          modelStream.end();
        };

        onServerError = err => {
          unsubscribe();
          server.disconnect();

          if (err.statusCode === 401) {
            modelStream.end();
            this.emit('authentication-required');

            return;
          }

          modelStream.emit('error', err);
        };

        onModelFinish = () => {
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
}

module.exports = Https;
