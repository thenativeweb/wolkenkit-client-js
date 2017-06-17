'use strict';

const assert = require('assertthat');

const None = require('../../../lib/authentication/None');

suite('None', () => {
  test('is a function.', done => {
    assert.that(None).is.ofType('function');
    done();
  });

  suite('instance', () => {
    let none;

    setup(() => {
      none = new None();
    });

    suite('login', () => {
      test('is a function.', done => {
        assert.that(none.login).is.ofType('function');
        done();
      });

      test('throws an error.', done => {
        assert.that(() => {
          none.login();
        }).is.throwing('Invalid operation.');
        done();
      });
    });

    suite('logout', () => {
      test('is a function.', done => {
        assert.that(none.logout).is.ofType('function');
        done();
      });

      test('throws an error.', done => {
        assert.that(() => {
          none.logout();
        }).is.throwing('Invalid operation.');
        done();
      });
    });

    suite('isLoggedIn', () => {
      test('is a function.', done => {
        assert.that(none.isLoggedIn).is.ofType('function');
        done();
      });

      test('returns false.', done => {
        assert.that(none.isLoggedIn()).is.false();
        done();
      });
    });

    suite('getToken', () => {
      test('is a function.', done => {
        assert.that(none.getToken).is.ofType('function');
        done();
      });

      test('returns undefined.', done => {
        assert.that(none.getToken()).is.undefined();
        done();
      });
    });

    suite('getProfile', () => {
      test('is a function.', done => {
        assert.that(none.getProfile).is.ofType('function');
        done();
      });

      test('returns undefined.', done => {
        assert.that(none.getProfile()).is.undefined();
        done();
      });
    });
  });
});
