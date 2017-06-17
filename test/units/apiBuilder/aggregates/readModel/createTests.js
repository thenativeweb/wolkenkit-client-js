'use strict';

const assert = require('assertthat');

const create = require('../../../../../lib/apiBuilder/aggregates/readModel/create'),
      ListAggregate = require('../../../../../lib/apiBuilder/aggregates/readModel/ListAggregate');

const modelStore = {},
      wire = {};

suite('create', () => {
  test('is a function.', done => {
    assert.that(create).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      create();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      create({});
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if model store is missing.', done => {
    assert.that(() => {
      create({ wire });
    }).is.throwing('Model store is missing.');
    done();
  });

  test('throws an error if model type is missing.', done => {
    assert.that(() => {
      create({ wire, modelStore });
    }).is.throwing('Model type is missing.');
    done();
  });

  test('throws an error if model name is missing.', done => {
    assert.that(() => {
      create({ wire, modelStore, modelType: 'lists' });
    }).is.throwing('Model name is missing.');
    done();
  });

  suite('read model aggregate', () => {
    test('is an object.', done => {
      const readModelAggregate = create({
        wire,
        modelStore,
        modelType: 'lists',
        modelName: 'peerGroups'
      });

      assert.that(readModelAggregate).is.ofType('object');
      done();
    });

    test('is a list aggregate if the model type is set to list.', done => {
      const readModelAggregate = create({
        wire,
        modelStore,
        modelType: 'lists',
        modelName: 'peerGroups'
      });

      assert.that(readModelAggregate).is.instanceOf(ListAggregate.Readable);
      done();
    });
  });
});
