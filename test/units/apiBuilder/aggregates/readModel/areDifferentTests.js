'use strict';

const assert = require('assertthat');

const areDifferent = require('../../../../../lib/apiBuilder/aggregates/readModel/areDifferent');

suite('areDifferent', () => {
  test('is a function.', done => {
    assert.that(areDifferent).is.ofType('function');
    done();
  });

  test('throws an error if left is missing.', done => {
    assert.that(() => {
      areDifferent();
    }).is.throwing('Left is missing.');
    done();
  });

  test('throws an error if right is missing.', done => {
    assert.that(() => {
      areDifferent([]);
    }).is.throwing('Right is missing.');
    done();
  });

  test('returns true if left and right are of different length.', done => {
    assert.that(areDifferent([ 2, 3 ], [ 5 ])).is.true();
    done();
  });

  test('returns true if the i-th elements have different ids.', done => {
    assert.that(areDifferent([
      { id: 1, value: 'foo' },
      { id: 2, value: 'bar' }
    ], [
      { id: 1, value: 'foo' },
      { id: 3, value: 'bar' }
    ])).is.true();
    done();
  });

  test('returns true if the i-th elements have different values.', done => {
    assert.that(areDifferent([
      { id: 1, value: 'foo' },
      { id: 2, value: 'bar' }
    ], [
      { id: 1, value: 'foo' },
      { id: 2, value: 'baz' }
    ])).is.true();
    done();
  });

  test('returns true if left and right are equal except for the order.', done => {
    assert.that(areDifferent([
      { id: 1, value: 'foo' },
      { id: 2, value: 'bar' }
    ], [
      { id: 2, value: 'bar' },
      { id: 1, value: 'foo' }
    ])).is.true();
    done();
  });

  test('returns false if left and right are equal.', done => {
    assert.that(areDifferent([
      { id: 1, value: 'foo' },
      { id: 2, value: 'bar' }
    ], [
      { id: 1, value: 'foo' },
      { id: 2, value: 'bar' }
    ])).is.false();
    done();
  });
});
