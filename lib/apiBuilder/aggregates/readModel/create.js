'use strict';

const ListAggregate = require('./ListAggregate');

const create = function (options) {
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

  const { modelName, modelStore, modelType, wire } = options;

  switch (modelType) {
    case 'lists':
      return new ListAggregate.Readable({ wire, modelStore, modelName });
    default:
      throw new Error('Invalid operation.');
  }
};

module.exports = create;
