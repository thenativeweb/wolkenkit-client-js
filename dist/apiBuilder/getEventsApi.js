'use strict';

var EventsAggregate = require('./aggregates/events/EventsAggregate');

var getEventsApi = function getEventsApi(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  var wire = options.wire,
      writeModel = options.writeModel;


  var api = {
    events: new EventsAggregate({ wire: wire, writeModel: writeModel })
  };

  return api;
};

module.exports = getEventsApi;