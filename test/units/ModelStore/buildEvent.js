'use strict';

const Event = require('commands-events').Event,
      uuid = require('uuidv4');

const buildEvent = function (modelType, modelName, eventType, data) {
  return new Event({
    context: { name: modelType },
    aggregate: { name: modelName, id: uuid() },
    name: eventType,
    data,
    metadata: { correlationId: uuid(), causationId: uuid() }
  });
};

module.exports = buildEvent;
