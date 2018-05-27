'use strict';

const ListStore = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }

  this.wire = options.wire;
};

ListStore.prototype.initialize = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  process.nextTick(() => {
    callback(null);
  });
};

ListStore.prototype.read = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!options.query) {
    throw new Error('Query is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  const { wire } = this;
  const { modelName, query } = options;

  const model = wire.readModel({ modelType: 'lists', modelName, query });

  process.nextTick(() => {
    callback(null, model);
  });
};

module.exports = ListStore;
