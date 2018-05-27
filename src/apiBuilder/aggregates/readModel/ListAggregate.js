'use strict';

const datasette = require('datasette');

const areDifferent = require('./areDifferent'),
      readSnapshot = require('./readSnapshot');

const Readable = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }

  this.wire = options.wire;
  this.modelStore = options.modelStore;
  this.modelType = 'lists';
  this.modelName = options.modelName;
};

Readable.prototype.read = function (query) {
  const { modelName, modelStore, modelType } = this;

  query = query || {};

  const callbacks = {
    failed (err) {
      throw err;
    },
    finished () {}
  };

  process.nextTick(() => {
    readSnapshot({ modelStore, modelType, modelName, query }, (err, result) => {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(result);
    });
  });

  return {
    failed (callback) {
      callbacks.failed = callback;

      return this;
    },
    finished (callback) {
      callbacks.finished = callback;

      return this;
    }
  };
};

Readable.prototype.readOne = function (query) {
  if (!query) {
    throw new Error('Query is missing.');
  }
  if (!query.where) {
    throw new Error('Where is missing.');
  }

  const { modelName, modelStore, modelType } = this;

  const callbacks = {
    failed (err) {
      throw err;
    },
    finished () {}
  };

  process.nextTick(() => {
    modelStore.readOne({ modelType, modelName, query }, (err, item) => {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(item);
    });
  });

  return {
    failed (callback) {
      callbacks.failed = callback;

      return this;
    },
    finished (callback) {
      callbacks.finished = callback;

      return this;
    }
  };
};

Readable.prototype.readAndObserve = function (query) {
  const { modelName, modelStore, modelType, wire } = this;

  query = query || {};

  const callbacks = {
    failed (err) {
      throw err;
    },
    started () {},
    updated () {}
  };

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.
  process.nextTick(() => {
    const events = wire.subscribeToEvents({
      context: { name: modelType },
      aggregate: { name: modelName },
      type: 'readModel'
    });

    const observeStream = events.stream;

    const isDirty = datasette.create(),
          result = [];

    isDirty.set('value', false);

    let cancel,
        onObserveStreamData,
        onObserveStreamEnd,
        onObserveStreamError,
        onObserveStreamStart;

    const unsubscribeObserveStream = function () {
      observeStream.removeListener('start', onObserveStreamStart);
      observeStream.removeListener('data', onObserveStreamData);
      observeStream.removeListener('end', onObserveStreamEnd);
      observeStream.removeListener('error', onObserveStreamError);
    };

    const readAndWaitForUpdates = function () {
      isDirty.set('value', false);

      readSnapshot({ modelStore, modelType, modelName, query }, (err, snapshot) => {
        if (err) {
          cancel();

          return callbacks.failed(err);
        }

        if (areDifferent(result, snapshot)) {
          result.length = 0;
          result.push(...snapshot);

          callbacks.updated(result, cancel);
        }

        const onIsDirty = function () {
          process.nextTick(() => readAndWaitForUpdates());
        };

        if (isDirty.get('value')) {
          onIsDirty();
        } else {
          isDirty.once('changed', onIsDirty);
        }
      });
    };

    cancel = function () {
      isDirty.removeAllListeners();
      events.cancel();
    };

    onObserveStreamStart = function () {
      callbacks.started(result, cancel);
      readAndWaitForUpdates();
    };

    onObserveStreamData = function () {
      isDirty.set('value', true);
    };

    onObserveStreamEnd = function () {
      unsubscribeObserveStream();
    };

    onObserveStreamError = function (err) {
      unsubscribeObserveStream();
      callbacks.failed(err);
    };

    observeStream.on('start', onObserveStreamStart);
    observeStream.on('data', onObserveStreamData);
    observeStream.on('end', onObserveStreamEnd);
    observeStream.on('error', onObserveStreamError);
  });

  return {
    failed (callback) {
      callbacks.failed = callback;

      return this;
    },
    started (callback) {
      callbacks.started = callback;

      return this;
    },
    updated (callback) {
      callbacks.updated = callback;

      return this;
    }
  };
};

module.exports = { Readable };
