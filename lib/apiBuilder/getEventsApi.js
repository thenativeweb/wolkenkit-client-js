'use strict';

const EventsAggregate = require('./aggregates/events/EventsAggregate');

const getEventsApi = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  const { wire, writeModel } = options;

  const api = {
    events: new EventsAggregate({ wire, writeModel })
  };

  return api;
};

module.exports = getEventsApi;
