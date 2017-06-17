'use strict';

const eachSeries = require('async/eachSeries'),
      parallel = require('async/parallel');

const ModelStore = function () {
  this.stores = {};
};

ModelStore.prototype.initialize = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.stores) {
    throw new Error('Stores are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.stores = options.stores;

  parallel(Object.keys(this.stores).map(storeType =>
    done => this.stores[storeType].initialize({}, done)
  ), err => {
    if (err) {
      return callback(err);
    }

    callback(null);
  });
};

ModelStore.prototype.processEvents = function (events, callback) {
  if (!events) {
    throw new Error('Events are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (events.length === 0) {
    return callback(null);
  }

  const storeSpecificEvents = {};

  Object.keys(this.stores).forEach(storeType => {
    storeSpecificEvents[storeType] = [];
  });

  events.forEach(event => {
    const modelType = event.context.name;

    if (!storeSpecificEvents[modelType]) {
      return;
    }

    storeSpecificEvents[modelType].push(event);
  });

  parallel(Object.keys(this.stores).map(storeType =>
    done => this.processEventsInStore(this.stores[storeType], storeSpecificEvents[storeType], done)
  ), callback);
};

ModelStore.prototype.processEventsInStore = function (store, events, callback) {
  if (!store) {
    throw new Error('Store is missing.');
  }
  if (!events) {
    throw new Error('Events are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (events.length === 0) {
    return callback(null);
  }

  eachSeries(events, (event, done) => {
    store[event.name]({
      modelName: event.aggregate.name,
      selector: event.data.selector,
      payload: event.data.payload
    }, done);
  }, callback);
};

ModelStore.prototype.read = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  options.query = options.query || {};

  this.stores[options.modelType].read(options, callback);
};

ModelStore.prototype.readOne = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!options.query) {
    throw new Error('Query is missing.');
  }
  if (!options.query.where) {
    throw new Error('Where is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.read({
    modelType: options.modelType,
    modelName: options.modelName,
    query: {
      where: options.query.where,
      take: 1
    }
  }, (err, model) => {
    if (err) {
      return callback(err);
    }

    const items = [];
    const onData = function (item) {
      items.push(item);
    };
    const onEnd = function () {
      model.stream.removeListener('data', onData);
      model.stream.removeListener('end', onEnd);

      const firstItem = items[0];

      if (!firstItem) {
        return callback(new Error('Item not found.'));
      }
      callback(null, firstItem);
    };

    model.stream.on('data', onData);
    model.stream.once('end', onEnd);
  });
};

module.exports = ModelStore;
