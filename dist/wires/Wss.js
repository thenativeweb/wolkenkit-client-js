'use strict';

const events = require('events'),
      stream = require('stream');

const Promise = require('es6-promise').Promise,
      uuid = require('uuidv4'),
      WebSocket = require('ws');

const EventEmitter = events.EventEmitter,
      PassThrough = stream.PassThrough;

class Wss extends EventEmitter {
  constructor(options) {
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

    const webSocket = new WebSocket(`wss://${this.host}:${this.port}`);

    webSocket.onopen = () => {
      this.emit('connect');
    };

    this.socket = new EventEmitter();
    this.socket.send = function (message) {
      if (webSocket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not open.');
      }

      webSocket.send(JSON.stringify(message));
    };

    webSocket.onmessage = event => {
      try {
        const message = JSON.parse(event.data);

        if (!message.procedureId) {
          return this.emit('error', new Error(`${message.payload} (${message.statusCode})`));
        }
        this.socket.emit(message.procedureId, message);
      } catch (ex) {
        this.socket.emit('error', ex);
      }
    };
  }

  sendCommand(command) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    return new Promise((resolve, reject) => {
      const { app, socket } = this;

      const token = app.auth.getToken();

      const message = {
        type: 'sendCommand',
        version: 'v1',
        procedureId: uuid(),
        payload: command
      };

      if (token) {
        message.token = token;
      }

      const onMessage = responseMessage => {
        if (responseMessage.type === 'error') {
          if (responseMessage.statusCode === 401) {
            this.emit('authentication-required');

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

  subscribeToEvents(filter) {
    filter = filter || {};

    const { app, socket } = this;
    let hasBeenCanceledByUser = false;

    const token = app.auth.getToken();

    const message = {
      type: 'subscribeEvents',
      version: 'v1',
      procedureId: uuid(),
      payload: {
        filter
      }
    };

    if (token) {
      message.token = token;
    }

    const subscriptionStream = new PassThrough({ objectMode: true });

    let onSubscriptionFinish, onSubscriptionMessage;

    const unsubscribe = () => {
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

    const cancelSubscription = () => {
      hasBeenCanceledByUser = true;
      unsubscribe();
      subscriptionStream.end();
    };

    onSubscriptionFinish = () => {
      unsubscribe();
    };

    onSubscriptionMessage = subscriptionMessage => {
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
            this.emit('authentication-required');

            return;
          }

          subscriptionStream.emit('error', subscriptionMessage.payload);
          break;
        default:
          throw new Error('Invalid operation.');
      }
    };

    subscriptionStream.on('finish', onSubscriptionFinish);
    socket.on(message.procedureId, onSubscriptionMessage);

    // This needs to be deferred to the next tick so that the user has a chance
    // to attach to the error event of the subscriptionStream that is returned synchronously.
    process.nextTick(() => {
      try {
        socket.send(message);
      } catch (ex) {
        subscriptionStream.emit('error', ex);
      }
    });

    return { stream: subscriptionStream, cancel: cancelSubscription };
  }

  readModel(options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.modelName) {
      throw new Error('Model name is missing.');
    }
    if (!options.modelType) {
      throw new Error('Model type is missing.');
    }

    const { app, socket } = this;
    const { modelName, modelType } = options;
    let hasBeenCanceledByUser = false;

    options.query = options.query || {};

    const query = {};

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

    const token = app.auth.getToken();

    const message = {
      type: 'subscribeRead',
      version: 'v1',
      procedureId: uuid(),
      payload: {
        modelType,
        modelName,
        query
      }
    };

    if (token) {
      message.token = token;
    }

    const modelStream = new PassThrough({ objectMode: true });

    let onModelFinish, onModelMessage;

    const unsubscribe = () => {
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

    const cancelModel = () => {
      hasBeenCanceledByUser = true;
      unsubscribe();
      modelStream.end();
    };

    onModelFinish = () => {
      unsubscribe();
    };

    onModelMessage = modelMessage => {
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
            this.emit('authentication-required');

            return;
          }

          modelStream.emit('error', modelMessage.payload);
          break;
        default:
          throw new Error('Invalid operation.');
      }
    };

    modelStream.on('finish', onModelFinish);
    socket.on(message.procedureId, onModelMessage);

    // This needs to be deferred to the next tick so that the user has a chance
    // to attach to the error event of the modelStream that is returned synchronously.
    process.nextTick(() => {
      try {
        socket.send(message);
      } catch (ex) {
        modelStream.emit('error', ex);
      }
    });

    return { stream: modelStream, cancel: cancelModel };
  }
}

module.exports = Wss;