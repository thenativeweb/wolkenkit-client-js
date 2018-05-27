'use strict';

const assert = require('assertthat');

const isEventIn = require('../../../../../src/apiBuilder/aggregates/events/isEventIn'),
      sampleConfiguration = require('../../../../shared/data/sampleConfiguration.json');

const sampleWriteModel = sampleConfiguration.writeModel;

suite('isEventIn', () => {
  test('is a function.', done => {
    assert.that(isEventIn).is.ofType('function');
    done();
  });

  suite('returns true', () => {
    test('if the write model contains *::*::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {})).is.true();
      done();
    });

    test('if the write model contains *::*::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        name: 'pinged'
      })).is.true();
      done();
    });

    test('if the write model contains *::aggregate::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        aggregate: { name: 'node' }
      })).is.true();
      done();
    });

    test('if the write model contains context::*::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: 'network' }
      })).is.true();
      done();
    });

    test('if the write model contains *::aggregate::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        aggregate: { name: 'node' },
        name: 'pinged'
      })).is.true();
      done();
    });

    test('if the write model contains context::*::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: 'network' },
        name: 'pinged'
      })).is.true();
      done();
    });

    test('if the write model contains context::aggregate::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: 'network' },
        aggregate: { name: 'node' }
      })).is.true();
      done();
    });

    test('if the write model contains context::aggregate::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: 'network' },
        aggregate: { name: 'node' },
        name: 'pinged'
      })).is.true();
      done();
    });
  });

  suite('returns false', () => {
    test('if the write model does not contain *::*::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        name: '$pinged'
      })).is.false();
      done();
    });

    test('if the write model does not contain *::aggregate::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        aggregate: { name: '$node' }
      })).is.false();
      done();
    });

    test('if the write model does not contain context::*::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: '$network' }
      })).is.false();
      done();
    });

    test('if the write model does not contain *::aggregate::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        aggregate: { name: '$node' },
        name: '$pinged'
      })).is.false();
      done();
    });

    test('if the write model does not contain context::*::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: '$network' },
        name: '$pinged'
      })).is.false();
      done();
    });

    test('if the write model does not contain context::aggregate::*.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: '$network' },
        aggregate: { name: '$node' }
      })).is.false();
      done();
    });

    test('if the write model does not contain context::aggregate::event.', done => {
      assert.that(isEventIn(sampleWriteModel, {
        context: { name: '$network' },
        aggregate: { name: '$node' },
        name: '$pinged'
      })).is.false();
      done();
    });
  });
});
