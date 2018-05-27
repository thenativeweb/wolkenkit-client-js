'use strict';

const stream = require('stream');

const assert = require('assertthat'),
      Event = require('commands-events').Event,
      uuid = require('uuidv4');

const EventsAggregate = require('../../../../../src/apiBuilder/aggregates/events/EventsAggregate'),
      FakeWire = require('../../../../shared/FakeWire'),
      sampleConfiguration = require('../../../../shared/data/sampleConfiguration.json');

const sampleWriteModel = sampleConfiguration.writeModel;

const PassThrough = stream.PassThrough;

suite('EventsAggregate', () => {
  test('is a function.', done => {
    assert.that(EventsAggregate).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new EventsAggregate();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new EventsAggregate({});
      /* eslint-enable no-new */
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if write model is missing.', done => {
    const wire = new FakeWire({
      subscribeToEvents () {
        return { stream: new PassThrough(), cancel () {} };
      }
    });

    assert.that(() => {
      /* eslint-disable no-new */
      new EventsAggregate({ wire });
      /* eslint-enable no-new */
    }).is.throwing('Write model is missing.');
    done();
  });

  suite('observe', () => {
    test('is a function.', done => {
      const wire = new FakeWire({
        subscribeToEvents () {
          return { stream: new PassThrough(), cancel () {} };
        }
      });
      const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

      assert.that(eventsAggregate.observe).is.ofType('function');
      done();
    });

    test('throws an error if the query describes an unknown event.', done => {
      const wire = new FakeWire({
        subscribeToEvents () {
          return { stream: new PassThrough(), cancel () {} };
        }
      });
      const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

      assert.that(() => {
        eventsAggregate.observe({ where: { name: '$pinged' }});
      }).is.throwing('Unknown event.');
      done();
    });

    test('requests events from the cloud.', done => {
      const wire = new FakeWire({
        subscribeToEvents (filter) {
          assert.that(filter).is.equalTo({
            type: 'domain'
          });
          done();
        }
      });
      const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

      eventsAggregate.observe();
    });

    test('requests events from the server using the specified filter.', done => {
      const wire = new FakeWire({
        subscribeToEvents (filter) {
          assert.that(filter).is.equalTo({
            type: 'domain',
            name: 'pinged'
          });
          done();
        }
      });
      const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

      eventsAggregate.observe({
        where: { name: 'pinged' }
      });
    });

    suite('started', () => {
      test('is called once the underlying connection has been established.', done => {
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
        const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

        eventsAggregate.observe().
          failed(done).
          started(cancel => {
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
          const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

          eventsAggregate.observe(() => {
            // Intentionally left blank.
          }).
            started(cancel => {
              cancel();
            });

          // In a minute, start the event stream so that the event aggregate
          // detects a connection.
          setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
        });
      });
    });

    suite('received', () => {
      test('is called when an event is received.', done => {
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
        const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

        const event = new Event({
          context: { name: 'network' },
          aggregate: { name: 'node', id: uuid() },
          name: 'pinged',
          metadata: { correlationId: uuid(), causationId: uuid() }
        });

        eventsAggregate.observe(() => {
          // Intentionally left blank.
        }).
          failed(done).
          started(() => {
            fakeEventStream.write(event);
          }).
          received((receivedEvent, cancel) => {
            assert.that(receivedEvent.context).is.equalTo(event.context);
            assert.that(receivedEvent.aggregate).is.equalTo(event.aggregate);
            assert.that(receivedEvent.name).is.equalTo(event.name);
            assert.that(receivedEvent.type).is.equalTo(event.type);
            assert.that(receivedEvent.data).is.equalTo(event.data);
            assert.that(receivedEvent.custom).is.equalTo(event.custom);
            assert.that(receivedEvent.user).is.equalTo(event.user);
            assert.that(receivedEvent.metadata).is.equalTo(event.metadata);
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
          const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

          const event = new Event({
            context: { name: 'network' },
            aggregate: { name: 'node', id: uuid() },
            name: 'pinged',
            metadata: { correlationId: uuid(), causationId: uuid() }
          });

          eventsAggregate.observe(() => {
            // Intentionally left blank.
          }).
            started(() => {
              fakeEventStream.write(event);
            }).
            received((receivedEvent, cancel) => {
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
              cancel () {}
            };
          }
        });
        const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

        eventsAggregate.observe(() => {
          // Intentionally left blank.
        }).
          failed(err => {
            assert.that(err.message).is.equalTo('foo');
            done();
          }).
          started(() => {
            process.nextTick(() => {
              fakeEventStream.emit('error', new Error('foo'));
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
        const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

        eventsAggregate.observe(() => {
          // Intentionally left blank.
        }).
          failed(err => {
            assert.that(err.message).is.equalTo('foo');
          }).
          started(() => {
            process.nextTick(() => {
              fakeEventStream.emit('error', new Error('foo'));
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
        const eventsAggregate = new EventsAggregate({ wire, writeModel: sampleWriteModel });

        const exceptionHandlers = process.listeners('uncaughtException');

        process.removeAllListeners('uncaughtException');

        process.once('uncaughtException', err => {
          assert.that(err.message).is.equalTo('foo');
          exceptionHandlers.forEach(handler => {
            process.on('uncaughtException', handler);
          });
          done();
        });

        eventsAggregate.observe(() => {
          // Intentionally left blank.
        }).
          started(() => {
            process.nextTick(() => {
              fakeEventStream.emit('error', new Error('foo'));
            });
          });

        // In a minute, start the event stream so that the event aggregate
        // detects a connection.
        setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);
      });
    });
  });
});
