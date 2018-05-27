'use strict';

const assert = require('assertthat');

const EventsAggregate = require('../../../src/apiBuilder/aggregates/events/EventsAggregate'),
      getEventsApi = require('../../../src/apiBuilder/getEventsApi'),
      sampleConfiguration = require('../../shared/data/sampleConfiguration.json');

suite('getEventsApi', () => {
  test('is a function.', done => {
    assert.that(getEventsApi).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      getEventsApi();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      getEventsApi({});
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if write model is missing.', done => {
    assert.that(() => {
      getEventsApi({ wire: {}});
    }).is.throwing('Write model is missing.');
    done();
  });

  test('returns an events object.', done => {
    const eventsApi = getEventsApi({ wire: {}, writeModel: sampleConfiguration.writeModel });

    assert.that(eventsApi).is.ofType('object');
    assert.that(eventsApi.events).is.instanceOf(EventsAggregate);
    done();
  });
});
