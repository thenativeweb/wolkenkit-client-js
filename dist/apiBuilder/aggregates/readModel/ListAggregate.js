'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var areDifferent = require('./areDifferent'),
    IsDirty = require('./IsDirty'),
    readSnapshot = require('./readSnapshot');

var Readable = function Readable(options) {
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
  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType;


  query = query || {};

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    finished: function finished() {}
  };

  process.nextTick(function () {
    readSnapshot({ modelStore: modelStore, modelType: modelType, modelName: modelName, query: query }, function (err, result) {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(result);
    });
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    finished: function finished(callback) {
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

  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType;


  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    finished: function finished() {}
  };

  process.nextTick(function () {
    modelStore.readOne({ modelType: modelType, modelName: modelName, query: query }, function (err, item) {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(item);
    });
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    finished: function finished(callback) {
      callbacks.finished = callback;

      return this;
    }
  };
};

Readable.prototype.readAndObserve = function (query) {
  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType,
      wire = this.wire;


  query = query || {};

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    started: function started() {},
    updated: function updated() {}
  };

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.
  process.nextTick(function () {
    var events = wire.subscribeToEvents({
      context: { name: modelType },
      aggregate: { name: modelName },
      type: 'readModel'
    });

    var observeStream = events.stream;

    var isDirty = new IsDirty(),
        result = [];

    isDirty.set(false);

    var cancel = void 0,
        onObserveStreamData = void 0,
        onObserveStreamEnd = void 0,
        onObserveStreamError = void 0,
        onObserveStreamStart = void 0;

    var unsubscribeObserveStream = function unsubscribeObserveStream() {
      observeStream.removeListener('start', onObserveStreamStart);
      observeStream.removeListener('data', onObserveStreamData);
      observeStream.removeListener('end', onObserveStreamEnd);
      observeStream.removeListener('error', onObserveStreamError);
    };

    var readAndWaitForUpdates = function readAndWaitForUpdates() {
      isDirty.set(false);

      readSnapshot({ modelStore: modelStore, modelType: modelType, modelName: modelName, query: query }, function (err, snapshot) {
        if (err) {
          cancel();

          return callbacks.failed(err);
        }

        if (areDifferent(result, snapshot)) {
          result.length = 0;
          result.push.apply(result, _toConsumableArray(snapshot));

          callbacks.updated(result, cancel);
        }

        var onIsDirty = function onIsDirty() {
          process.nextTick(function () {
            return readAndWaitForUpdates();
          });
        };

        if (isDirty.get()) {
          onIsDirty();
        } else {
          isDirty.once('set', onIsDirty);
        }
      });
    };

    cancel = function cancel() {
      isDirty.removeAllListeners();
      events.cancel();
    };

    onObserveStreamStart = function onObserveStreamStart() {
      callbacks.started(result, cancel);
      readAndWaitForUpdates();
    };

    onObserveStreamData = function onObserveStreamData() {
      isDirty.set(true);
    };

    onObserveStreamEnd = function onObserveStreamEnd() {
      unsubscribeObserveStream();
    };

    onObserveStreamError = function onObserveStreamError(err) {
      unsubscribeObserveStream();
      callbacks.failed(err);
    };

    observeStream.on('start', onObserveStreamStart);
    observeStream.on('data', onObserveStreamData);
    observeStream.on('end', onObserveStreamEnd);
    observeStream.on('error', onObserveStreamError);
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    started: function started(callback) {
      callbacks.started = callback;

      return this;
    },
    updated: function updated(callback) {
      callbacks.updated = callback;

      return this;
    }
  };
};

module.exports = { Readable: Readable };