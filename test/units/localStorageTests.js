'use strict';

const assert = require('assertthat');

const localStorage = require('../../lib/localStorage');

suite('localStorage', () => {
  setup(() => {
    localStorage.clear();
  });

  test('is an object.', done => {
    assert.that(localStorage).is.ofType('object');
    done();
  });

  suite('getItem', () => {
    test('returns undefined if the requested key has not been stored.', done => {
      assert.that(localStorage.getItem('foo')).is.undefined();
      done();
    });

    test('returns the previously stored item.', done => {
      localStorage.setItem('foo', 'bar');

      assert.that(localStorage.getItem('foo')).is.equalTo('bar');
      done();
    });
  });

  suite('setItem', () => {
    test('sets an item.', done => {
      localStorage.setItem('foo', 'bar');

      assert.that(localStorage.getItem('foo')).is.equalTo('bar');
      done();
    });

    test('replaces the previous item with the same key.', done => {
      localStorage.setItem('foo', 'bar');
      localStorage.setItem('foo', 'baz');

      assert.that(localStorage.getItem('foo')).is.equalTo('baz');
      done();
    });
  });

  suite('removeItem', () => {
    test('removes an item.', done => {
      localStorage.setItem('foo', 'bar');
      localStorage.removeItem('foo');

      assert.that(localStorage.getItem('foo')).is.undefined();
      done();
    });

    test('does not throw an error when the item does not exist.', done => {
      assert.that(() => {
        localStorage.removeItem('foo');
      }).is.not.throwing();
      done();
    });
  });

  suite('clear', () => {
    test('removes all items.', done => {
      localStorage.setItem('foo', 'bar');
      localStorage.setItem('baz', 'bas');
      localStorage.clear();

      assert.that(localStorage.getItem('foo')).is.undefined();
      assert.that(localStorage.getItem('baz')).is.undefined();
      done();
    });
  });
});
