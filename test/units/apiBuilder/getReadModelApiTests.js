'use strict';

const assert = require('assertthat');

const getReadModelApi = require('../../../lib/apiBuilder/getReadModelApi'),
      ListAggregate = require('../../../lib/apiBuilder/aggregates/readModel/ListAggregate'),
      ModelStore = require('../../../lib/ModelStore'),
      sampleConfiguration = require('../../data/sampleConfiguration.json');

suite('getReadModelApi', () => {
  let modelStore;

  suiteSetup(() => {
    modelStore = new ModelStore();
  });

  test('is a function.', done => {
    assert.that(getReadModelApi).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      getReadModelApi();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      getReadModelApi({});
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if read model is missing.', done => {
    assert.that(() => {
      getReadModelApi({ wire: {}});
    }).is.throwing('Read model is missing.');
    done();
  });

  test('throws an error if model store is missing.', done => {
    assert.that(() => {
      getReadModelApi({ wire: {}, readModel: sampleConfiguration.readModel });
    }).is.throwing('Model store is missing.');
    done();
  });

  test('returns the read model API.', done => {
    const readModelApi = getReadModelApi({ wire: {}, readModel: sampleConfiguration.readModel, modelStore });

    assert.that(readModelApi).is.ofType('object');
    assert.that(readModelApi.lists).is.ofType('object');
    assert.that(readModelApi.lists.pings).is.instanceOf(ListAggregate.Readable);
    assert.that(readModelApi.lists.pongs).is.instanceOf(ListAggregate.Readable);
    done();
  });
});
