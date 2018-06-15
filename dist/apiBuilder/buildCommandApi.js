'use strict';

var Command = require('commands-events').Command,
    uuid = require('uuidv4');

var CommandRunner = require('./CommandRunner');

var buildCommandApi = function buildCommandApi(options) {
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

  var app = options.app,
      wire = options.wire,
      contextName = options.contextName,
      aggregateName = options.aggregateName,
      _options$aggregateId = options.aggregateId,
      aggregateId = _options$aggregateId === undefined ? uuid() : _options$aggregateId,
      commandName = options.commandName;


  return function (data, commandOptions) {
    var _ref = commandOptions || {},
        asUser = _ref.asUser;

    var command = new Command({
      context: {
        name: contextName
      },
      aggregate: {
        name: aggregateName,
        id: aggregateId
      },
      name: commandName,
      data: data,
      custom: {
        asUser: asUser
      }
    });

    return new CommandRunner({ app: app, wire: wire, command: command });
  };
};

module.exports = buildCommandApi;