'use strict';

var ListAggregate = require('./ListAggregate');

var create = function create(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
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

  var modelName = options.modelName,
      modelStore = options.modelStore,
      modelType = options.modelType,
      wire = options.wire;


  switch (modelType) {
    case 'lists':
      return new ListAggregate.Readable({ wire: wire, modelStore: modelStore, modelName: modelName });
    default:
      throw new Error('Invalid operation.');
  }
};

module.exports = create;