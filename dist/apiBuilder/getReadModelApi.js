'use strict';

const createReadModelAggregate = require('./aggregates/readModel/create');

const getReadModelApi = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.readModel) {
    throw new Error('Read model is missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }

  const { readModel, modelStore, wire } = options;

  const api = {};

  Object.keys(readModel).forEach(modelType => {
    api[modelType] = {};

    Object.keys(readModel[modelType]).forEach(modelName => {
      api[modelType][modelName] = createReadModelAggregate({
        modelStore,
        modelType,
        modelName,
        wire
      });
    });
  });

  return api;
};

module.exports = getReadModelApi;