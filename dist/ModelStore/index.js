'use strict';

var eachSeries = require('async/eachSeries'),
    parallel = require('async/parallel');

var ModelStore = function ModelStore() {
  this.stores = {};
};

ModelStore.prototype.initialize = function (options, callback) {
  var _this = this;

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
  parallel(Object.keys(this.stores).map(function (storeType) {
    return function (done) {
      return _this.stores[storeType].initialize({}, done);
    };
  }), function (err) {
    if (err) {
      return callback(err);
    }

    callback(null);
  });
};

ModelStore.prototype.processEvents = function (events, callback) {
  var _this2 = this;

  if (!events) {
    throw new Error('Events are missing.');
  }

  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (events.length === 0) {
    return callback(null);
  }

  var storeSpecificEvents = {};
  Object.keys(this.stores).forEach(function (storeType) {
    storeSpecificEvents[storeType] = [];
  });
  events.forEach(function (event) {
    var modelType = event.context.name;

    if (!storeSpecificEvents[modelType]) {
      return;
    }

    storeSpecificEvents[modelType].push(event);
  });
  parallel(Object.keys(this.stores).map(function (storeType) {
    return function (done) {
      return _this2.processEventsInStore(_this2.stores[storeType], storeSpecificEvents[storeType], done);
    };
  }), callback);
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

  eachSeries(events, function (event, done) {
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
  }, function (err, model) {
    if (err) {
      return callback(err);
    }

    var items = [];

    var onData = function onData(item) {
      items.push(item);
    };

    var onEnd = function onEnd() {
      model.stream.removeListener('data', onData);
      model.stream.removeListener('end', onEnd);
      var firstItem = items[0];

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