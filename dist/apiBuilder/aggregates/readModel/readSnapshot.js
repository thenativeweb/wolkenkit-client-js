'use strict';

const toArray = require('streamtoarray');

const readSnapshot = function (options, callback) {
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

  const { modelName, modelStore, modelType, query } = options;

  modelStore.read({ modelType, modelName, query }, (errRead, model) => {
    if (errRead) {
      return callback(errRead);
    }
    toArray(model.stream, (errToArray, array) => {
      if (errToArray) {
        return callback(errToArray);
      }
      callback(null, array);
    });
  });
};

module.exports = readSnapshot;