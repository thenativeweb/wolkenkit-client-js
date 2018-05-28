'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const assert = require('assertthat');

const Local = require('../../../src/authentication/Local');

const readFile = promisify(fs.readFile);

suite('Local', () => {
  test('is a function.', done => {
    assert.that(Local).is.ofType('function');
    done();
  });

  suite('instance', () => {
    let local;

    setup(async () => {
      local = new Local({
        identityProviderName: 'test.wolkenkit.io',
        certificate: await readFile(path.join(__dirname, '..', '..', 'shared', 'keys', 'io.wolkenkit.test', 'certificate.pem'), { encoding: 'utf8' }),
        privateKey: await readFile(path.join(__dirname, '..', '..', 'shared', 'keys', 'io.wolkenkit.test', 'privateKey.pem'), { encoding: 'utf8' })
      });
    });

    suite('login', () => {
      test('is a function.', done => {
        assert.that(local.login).is.ofType('function');
        done();
      });

      test('throws an error if user name is missing.', done => {
        assert.that(() => {
          local.login();
        }).is.throwing('User name is missing.');
        done();
      });

      test('logs the given user in.', done => {
        local.login('Jane Doe');

        assert.that(local.isLoggedIn()).is.true();
        done();
      });
    });

    suite('logout', () => {
      test('is a function.', done => {
        assert.that(local.logout).is.ofType('function');
        done();
      });

      test('logs the user out.', done => {
        local.login('Jane Doe');
        local.logout();

        assert.that(local.isLoggedIn()).is.false();
        done();
      });
    });

    suite('isLoggedIn', () => {
      test('is a function.', done => {
        assert.that(local.isLoggedIn).is.ofType('function');
        done();
      });

      test('returns true when a user is logged in.', done => {
        local.login('Jane Doe');

        assert.that(local.isLoggedIn()).is.true();
        done();
      });

      test('returns false when no user is logged in.', done => {
        local.login('Jane Doe');
        local.logout();

        assert.that(local.isLoggedIn()).is.false();
        done();
      });
    });

    suite('getToken', () => {
      test('is a function.', done => {
        assert.that(local.getToken).is.ofType('function');
        done();
      });

      test('returns undefined when no user is logged in.', done => {
        assert.that(local.getToken()).is.undefined();
        done();
      });

      test('returns the token of the logged in user.', done => {
        local.login('Jane Doe');

        assert.that(local.getToken()).is.matching(/^(\w|-)+\.(\w|-)+\.(\w|-)+$/g);
        done();
      });
    });

    suite('getProfile', () => {
      test('is a function.', done => {
        assert.that(local.getProfile).is.ofType('function');
        done();
      });

      test('returns undefined when no user is logged in.', done => {
        assert.that(local.getProfile()).is.undefined();
        done();
      });

      test('returns the profile of the logged in user.', done => {
        local.login('Jane Doe');

        const profile = local.getProfile();

        assert.that(profile.sub).is.equalTo('Jane Doe');
        assert.that(profile.iss).is.equalTo('test.wolkenkit.io');
        done();
      });

      test('returns the profile with the claims of the logged in user.', done => {
        local.login('Jane Doe', {
          isRoot: true
        });

        const profile = local.getProfile();

        assert.that(profile.isRoot).is.true();
        done();
      });
    });
  });
});
