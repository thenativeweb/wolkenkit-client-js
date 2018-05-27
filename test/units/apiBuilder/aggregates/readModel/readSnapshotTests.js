'use strict';

const stream = require('stream');

const assert = require('assertthat');

const readSnapshot = require('../../../../../src/apiBuilder/aggregates/readModel/readSnapshot');

const PassThrough = stream.PassThrough;

suite('readSnapshot', () => {
  test('is a function.', done => {
    assert.that(readSnapshot).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      readSnapshot();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if model store is missing.', done => {
    assert.that(() => {
      readSnapshot({});
    }).is.throwing('Model store is missing.');
    done();
  });

  test('throws an error if model type is missing.', done => {
    assert.that(() => {
      readSnapshot({ modelStore: {}});
    }).is.throwing('Model type is missing.');
    done();
  });

  test('throws an error if model name is missing.', done => {
    assert.that(() => {
      readSnapshot({ modelStore: {}, modelType: 'lists' });
    }).is.throwing('Model name is missing.');
    done();
  });

  test('throws an error if query is missing.', done => {
    assert.that(() => {
      readSnapshot({ modelStore: {}, modelType: 'lists', modelName: 'peerGroups' });
    }).is.throwing('Query is missing.');
    done();
  });

  test('reads from the model store.', done => {
    const fakeStream = new PassThrough({ objectMode: true });

    fakeStream.write('foo');
    fakeStream.write('bar');
    fakeStream.end();

    readSnapshot({
      modelStore: {
        read (options, callback) {
          assert.that(options.query).is.equalTo({});
          callback(null, { stream: fakeStream, cancel () {} });
        }
      },
      modelType: 'lists',
      modelName: 'peerGroups',
      query: {}
    }, (err, result) => {
      assert.that(err).is.null();
      assert.that(result).is.equalTo([ 'foo', 'bar' ]);
      done();
    });
  });

  test('passes the given options to the model store.', done => {
    readSnapshot({
      modelStore: {
        read (options) {
          assert.that(options.modelType).is.equalTo('lists');
          assert.that(options.modelName).is.equalTo('peerGroups');
          assert.that(options.query).is.equalTo({
            where: {
              initiator: 'Jane Doe'
            }
          });
          done();
        }
      },
      modelType: 'lists',
      modelName: 'peerGroups',
      query: {
        where: {
          initiator: 'Jane Doe'
        }
      }
    });
  });

  test('returns an error if reading from the model store fails.', done => {
    readSnapshot({
      modelStore: {
        read (options, callback) {
          callback(new Error('foo'));
        }
      },
      modelType: 'lists',
      modelName: 'peerGroups',
      query: {}
    }, err => {
      assert.that(err.message).is.equalTo('foo');
      done();
    });
  });
});
