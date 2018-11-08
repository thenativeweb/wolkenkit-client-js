'use strict';

var buildCommandApi = require('./buildCommandApi');

var getWriteModelApi = function getWriteModelApi(options) {
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

  var app = options.app,
      wire = options.wire,
      writeModel = options.writeModel;
  var api = {};
  Object.keys(writeModel).forEach(function (contextName) {
    api[contextName] = {};
    Object.keys(writeModel[contextName]).forEach(function (aggregateName) {
      api[contextName][aggregateName] = function (aggregateId) {
        var commands = {};
        Object.keys(writeModel[contextName][aggregateName].commands).forEach(function (commandName) {
          commands[commandName] = buildCommandApi({
            api: api,
            app: app,
            wire: wire,
            contextName: contextName,
            aggregateName: aggregateName,
            aggregateId: aggregateId,
            commandName: commandName
          });
        });
        return commands;
      };
    });
  });
  return api;
};

module.exports = getWriteModelApi;