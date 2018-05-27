'use strict';

const stream = require('stream');

const assert = require('assertthat');

const FakeWire = require('../../../../shared/FakeWire'),
      ListAggregate = require('../../../../../src/apiBuilder/aggregates/readModel/ListAggregate');

const PassThrough = stream.PassThrough;

suite('ListAggregate', () => {
  test('is an object.', done => {
    assert.that(ListAggregate).is.ofType('object');
    done();
  });

  suite('Readable', () => {
    test('is a function.', done => {
      assert.that(ListAggregate.Readable).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        /* eslint-disable no-new */
        new ListAggregate.Readable();
        /* eslint-enable no-new */
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if wire is missing.', done => {
      assert.that(() => {
        /* eslint-disable no-new */
        new ListAggregate.Readable({});
        /* eslint-enable no-new */
      }).is.throwing('Wire is missing.');
      done();
    });

    test('throws an error if model store is missing.', done => {
      assert.that(() => {
        /* eslint-disable no-new */
        new ListAggregate.Readable({ wire: {}});
        /* eslint-enable no-new */
      }).is.throwing('Model store is missing.');
      done();
    });

    test('throws an error if model name is missing.', done => {
      assert.that(() => {
        /* eslint-disable no-new */
        new ListAggregate.Readable({ wire: {}, modelStore: {}});
        /* eslint-enable no-new */
      }).is.throwing('Model name is missing.');
      done();
    });

    suite('read', () => {
      test('is a function.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {},
          modelName: 'peerGroups'
        });

        assert.that(listAggregate.read).is.ofType('function');
        done();
      });

      test('calls read on the model store.', done => {
        const fakeStream = new PassThrough({ objectMode: true });

        fakeStream.write('foo');
        fakeStream.end();

        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {
            read (options, callback) {
              assert.that(options).is.ofType('object');
              assert.that(options.modelType).is.equalTo('lists');
              assert.that(options.modelName).is.equalTo('peerGroups');
              assert.that(options.query).is.equalTo({ foo: 'bar' });
              callback(null, { stream: fakeStream, cancel () {} });
            }
          },
          modelName: 'peerGroups'
        });

        listAggregate.read({ foo: 'bar' }).
          failed(done).
          finished(result => {
            assert.that(result).is.equalTo([ 'foo' ]);
            done();
          });
      });

      test('calls read on the model store with an empty query if no query is given.', done => {
        const fakeStream = new PassThrough({ objectMode: true });

        fakeStream.write('foo');
        fakeStream.end();

        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {
            read (options, callback) {
              assert.that(options.query).is.equalTo({});
              callback(null, { stream: fakeStream, cancel () {} });
            }
          },
          modelName: 'peerGroups'
        });

        listAggregate.read().
          failed(done).
          finished(() => done());
      });
    });

    suite('readOne', () => {
      test('is a function.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {},
          modelName: 'peerGroups'
        });

        assert.that(listAggregate.readOne).is.ofType('function');
        done();
      });

      test('throws an error if query is missing.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {},
          modelName: 'peerGroups'
        });

        assert.that(() => {
          listAggregate.readOne();
        }).is.throwing('Query is missing.');
        done();
      });

      test('throws an error if where is missing.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {},
          modelName: 'peerGroups'
        });

        assert.that(() => {
          listAggregate.readOne({});
        }).is.throwing('Where is missing.');
        done();
      });

      test('calls readOne on the model store.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {
            readOne (options, callback) {
              assert.that(options).is.ofType('object');
              assert.that(options.modelType).is.equalTo('lists');
              assert.that(options.modelName).is.equalTo('peerGroups');
              assert.that(options.query).is.equalTo({ where: { foo: 'bar' }});
              callback(null, 'foo');
            }
          },
          modelName: 'peerGroups'
        });

        listAggregate.readOne({
          where: { foo: 'bar' }
        }).
          failed(done).
          finished(result => {
            assert.that(result).is.equalTo('foo');
            done();
          });
      });
    });

    suite('readAndObserve', () => {
      test('is a function.', done => {
        const listAggregate = new ListAggregate.Readable({
          wire: {},
          modelStore: {},
          modelName: 'peerGroups'
        });

        assert.that(listAggregate.readAndObserve).is.ofType('function');
        done();
      });

      suite('started', () => {
        test('returns an empty array as inital snapshot.', done => {
          const fakeEventStream = new PassThrough({ objectMode: true });
          const wire = new FakeWire({
            subscribeToEvents () {
              return {
                stream: fakeEventStream,
                cancel () {
                  fakeEventStream.end();
                }
              };
            }
          });

          const fakeSnapshotStream = new PassThrough({ objectMode: true });

          const listAggregate = new ListAggregate.Readable({
            wire,
            modelStore: {
              read (options, callback) {
                callback(null, { stream: fakeSnapshotStream, cancel () {} });
              }
            },
            modelName: 'peerGroups'
          });

          listAggregate.readAndObserve().
            failed(done).
            started((list, cancel) => {
              assert.that(list).is.equalTo([]);
              cancel();
              done();
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });

        suite('cancel', () => {
          test('closes the underlying connection.', done => {
            const fakeEventStream = new PassThrough({ objectMode: true });

            const wire = new FakeWire({
              subscribeToEvents () {
                return {
                  stream: fakeEventStream,
                  cancel () {
                    fakeEventStream.end();
                    done();
                  }
                };
              }
            });

            const fakeSnapshotStream = new PassThrough({ objectMode: true });

            const listAggregate = new ListAggregate.Readable({
              wire,
              modelStore: {
                read (options, callback) {
                  callback(null, { stream: fakeSnapshotStream, cancel () {} });
                }
              },
              modelName: 'peerGroups'
            });

            listAggregate.readAndObserve().
              failed(done).
              started((list, cancel) => {
                cancel();
              });

            // In a minute, start the event stream so that the event aggregate
            // detects a connection.
            setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
          });
        });
      });

      suite('updated', () => {
        test('returns the updated model.', done => {
          const fakeEventStream = new PassThrough({ objectMode: true });
          const wire = new FakeWire({
            subscribeToEvents () {
              return {
                stream: fakeEventStream,
                cancel () {
                  fakeEventStream.end();
                }
              };
            }
          });

          const fakeSnapshotStream = new PassThrough({ objectMode: true });

          fakeSnapshotStream.write('foo');
          fakeSnapshotStream.end();

          const listAggregate = new ListAggregate.Readable({
            wire,
            modelStore: {
              read (options, callback) {
                callback(null, { stream: fakeSnapshotStream, cancel () {} });
              }
            },
            modelName: 'peerGroups'
          });

          listAggregate.readAndObserve().
            failed(done).
            updated((list, cancel) => {
              assert.that(list).is.equalTo([ 'foo' ]);
              cancel();
              done();
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });

        suite('cancel', () => {
          test('closes the underlying connection.', done => {
            const fakeEventStream = new PassThrough({ objectMode: true });

            const wire = new FakeWire({
              subscribeToEvents () {
                return {
                  stream: fakeEventStream,
                  cancel () {
                    fakeEventStream.end();
                    done();
                  }
                };
              }
            });

            const fakeSnapshotStream = new PassThrough({ objectMode: true });

            fakeSnapshotStream.write('foo');
            fakeSnapshotStream.end();

            const listAggregate = new ListAggregate.Readable({
              wire,
              modelStore: {
                read (options, callback) {
                  callback(null, { stream: fakeSnapshotStream, cancel () {} });
                }
              },
              modelName: 'peerGroups'
            });

            listAggregate.readAndObserve().
              failed(done).
              updated((list, cancel) => {
                cancel();
              });

            // In a minute, start the event stream so that the event aggregate
            // detects a connection.
            setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
          });
        });
      });

      suite('failed', () => {
        test('is called if the server sends an error.', done => {
          const fakeEventStream = new PassThrough({ objectMode: true });
          const wire = new FakeWire({
            subscribeToEvents () {
              return {
                stream: fakeEventStream,
                cancel () {
                  fakeEventStream.end();
                }
              };
            }
          });

          const fakeSnapshotStream = new PassThrough({ objectMode: true });

          const listAggregate = new ListAggregate.Readable({
            wire,
            modelStore: {
              read (options, callback) {
                callback(null, { stream: fakeSnapshotStream, cancel () {} });
              }
            },
            modelName: 'peerGroups'
          });

          listAggregate.readAndObserve().
            failed(err => {
              assert.that(err.message).is.equalTo('foo');
              done();
            }).
            started(() => {
              process.nextTick(() => {
                fakeSnapshotStream.emit('error', new Error('foo'));
              });
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });

        test('closes the underlying connection.', done => {
          const fakeEventStream = new PassThrough({ objectMode: true });
          const wire = new FakeWire({
            subscribeToEvents () {
              return {
                stream: fakeEventStream,
                cancel () {
                  fakeEventStream.end();
                  done();
                }
              };
            }
          });

          const fakeSnapshotStream = new PassThrough({ objectMode: true });

          const listAggregate = new ListAggregate.Readable({
            wire,
            modelStore: {
              read (options, callback) {
                callback(null, { stream: fakeSnapshotStream, cancel () {} });
              }
            },
            modelName: 'peerGroups'
          });

          listAggregate.readAndObserve().
            failed(err => {
              assert.that(err.message).is.equalTo('foo');
            }).
            started(() => {
              process.nextTick(() => {
                fakeSnapshotStream.emit('error', new Error('foo'));
              });
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });

        test('throws an uncaught exception when there is no failed callback.', done => {
          const fakeEventStream = new PassThrough({ objectMode: true });
          const wire = new FakeWire({
            subscribeToEvents () {
              return {
                stream: fakeEventStream,
                cancel () {
                  fakeEventStream.end();
                }
              };
            }
          });

          const fakeSnapshotStream = new PassThrough({ objectMode: true });

          const listAggregate = new ListAggregate.Readable({
            wire,
            modelStore: {
              read (options, callback) {
                callback(null, { stream: fakeSnapshotStream, cancel () {} });
              }
            },
            modelName: 'peerGroups'
          });

          const exceptionHandlers = process.listeners('uncaughtException');

          process.removeAllListeners('uncaughtException');

          process.once('uncaughtException', err => {
            assert.that(err.message).is.equalTo('foo');
            exceptionHandlers.forEach(handler => {
              process.on('uncaughtException', handler);
            });
            done();
          });

          listAggregate.readAndObserve().
            started(() => {
              process.nextTick(() => {
                fakeSnapshotStream.emit('error', new Error('foo'));
              });
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });
      });
    });
  });
});
