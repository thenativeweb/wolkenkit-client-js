'use strict';

const buildCommandApi = require('./buildCommandApi');

const getWriteModelApi = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  const { app, wire, writeModel } = options;

  const api = {};

  Object.keys(writeModel).forEach(contextName => {
    api[contextName] = {};

    Object.keys(writeModel[contextName]).forEach(aggregateName => {
      api[contextName][aggregateName] = function (aggregateId) {
        const commands = {};

        Object.keys(writeModel[contextName][aggregateName].commands).forEach(commandName => {
          commands[commandName] = buildCommandApi({ api, app, wire, contextName, aggregateName, aggregateId, commandName });
        });

        return commands;
      };
    });
  });

  return api;
};

module.exports = getWriteModelApi;
