'use strict';

var toArray = require('streamtoarray');

var readSnapshot = function readSnapshot(options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
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

  var modelName = options.modelName,
      modelStore = options.modelStore,
      modelType = options.modelType,
      query = options.query;


  modelStore.read({ modelType: modelType, modelName: modelName, query: query }, function (errRead, model) {
    if (errRead) {
      return callback(errRead);
    }
    toArray(model.stream, function (errToArray, array) {
      if (errToArray) {
        return callback(errToArray);
      }
      callback(null, array);
    });
  });
};

module.exports = readSnapshot;