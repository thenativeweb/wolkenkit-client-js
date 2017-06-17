'use strict';

const Command = require('commands-events').Command,
      uuid = require('uuidv4');

const CommandRunner = require('./CommandRunner');

const buildCommandApi = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.contextName) {
    throw new Error('Context name is missing.');
  }
  if (!options.aggregateName) {
    throw new Error('Aggregate name is missing.');
  }
  if (!options.commandName) {
    throw new Error('Command name is missing.');
  }

  const { app, wire, contextName, aggregateName, aggregateId = uuid(), commandName } = options;

  return function (data, commandOptions) {
    const { asUser } = commandOptions || {};

    const command = new Command({
      context: {
        name: contextName
      },
      aggregate: {
        name: aggregateName,
        id: aggregateId
      },
      name: commandName,
      data,
      custom: {
        asUser
      }
    });

    return new CommandRunner({ app, wire, command });
  };
};

module.exports = buildCommandApi;
