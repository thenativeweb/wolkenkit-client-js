'use strict';

const assert = require('assertthat'),
      nock = require('nock');

const request = require('../../lib/request');

suite('request', () => {
  test('is a function.', done => {
    assert.that(request).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      request();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if callback is missing.', done => {
    assert.that(() => {
      request({});
    }).is.throwing('Callback is missing.');
    done();
  });

  test('returns the status code of the response.', done => {
    const localhost = nock('https://localhost:3000').
      get('/foo').
      reply(200);

    request({
      protocol: 'https:',
      hostname: 'localhost',
      port: 3000,
      path: '/foo'
    }, (err, res) => {
      assert.that(err).is.null();
      assert.that(res.statusCode).is.equalTo(200);
      assert.that(localhost.isDone()).is.true();
      done();
    });
  });

  test('returns the body of the response.', done => {
    const localhost = nock('https://localhost:3000').
      get('/foo').
      reply(200, { foo: 'bar' });

    request({
      protocol: 'https:',
      hostname: 'localhost',
      port: 3000,
      path: '/foo'
    }, (err, res) => {
      assert.that(err).is.null();
      assert.that(res.body).is.equalTo(JSON.stringify({ foo: 'bar' }));
      assert.that(localhost.isDone()).is.true();
      done();
    });
  });

  test('emits an error event if the host is not reachable.', done => {
    nock.disableNetConnect();

    request({
      protocol: 'https:',
      hostname: 'localhost',
      port: 3000,
      path: '/foo'
    }, err => {
      assert.that(err).is.not.null();
      nock.enableNetConnect();
      done();
    });
  });

  test('emits an error event if the host does not exist.', done => {
    request({
      protocol: 'https:',
      hostname: 'localhost.non-existent',
      port: 3000,
      path: '/foo'
    }, err => {
      assert.that(err).is.not.null();
      done();
    });
  });
});
