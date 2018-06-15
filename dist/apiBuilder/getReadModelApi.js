'use strict';

var createReadModelAggregate = require('./aggregates/readModel/create');

var getReadModelApi = function getReadModelApi(options) {
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

  var readModel = options.readModel,
      modelStore = options.modelStore,
      wire = options.wire;


  var api = {};

  Object.keys(readModel).forEach(function (modelType) {
    api[modelType] = {};

    Object.keys(readModel[modelType]).forEach(function (modelName) {
      api[modelType][modelName] = createReadModelAggregate({
        modelStore: modelStore,
        modelType: modelType,
        modelName: modelName,
        wire: wire
      });
    });
  });

  return api;
};

module.exports = getReadModelApi;