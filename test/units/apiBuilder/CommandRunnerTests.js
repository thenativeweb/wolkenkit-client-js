'use strict';

const stream = require('stream');

const assert = require('assertthat'),
      { Command, Event } = require('commands-events'),
      merge = require('lodash/merge'),
      uuid = require('uuidv4');

const CommandRunner = require('../../../src/apiBuilder/CommandRunner'),
      FakeWire = require('../../shared/FakeWire'),
      getApp = require('../../../src/getApp'),
      getEventsApi = require('../../../src/apiBuilder/getEventsApi'),
      getWriteModelApi = require('../../../src/apiBuilder/getWriteModelApi'),
      None = require('../../../src/authentication/None');

const sampleConfiguration = require('../../shared/data/sampleConfiguration.json');

const PassThrough = stream.PassThrough;

suite('CommandRunner', () => {
  let app,
      command,
      wire;

  setup(done => {
    getApp({
      host: 'local.wolkenkit.io',
      port: 443,
      protocol: 'https',
      authentication: new None(),
      configuration: sampleConfiguration
    }).
      then(_app => {
        wire = new FakeWire({});

        const eventsApi = getEventsApi({ wire, writeModel: sampleConfiguration.writeModel }),
              writeModelApi = getWriteModelApi({ app: _app, wire, writeModel: sampleConfiguration.writeModel });

        app = merge({}, _app, eventsApi, writeModelApi);

        command = new Command({
          context: {
            name: 'network'
          },
          aggregate: {
            name: 'node',
            id: uuid()
          },
          name: 'ping'
        });
        done();
      }).
      catch(done);
  });

  test('is a function.', done => {
    assert.that(CommandRunner).is.ofType('function');
    done();
  });

  test('throws an error when options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new CommandRunner();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error when app is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new CommandRunner({});
      /* eslint-enable no-new */
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an error when wire is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new CommandRunner({ app });
      /* eslint-enable no-new */
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error when command is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new CommandRunner({ app, wire: {}});
      /* eslint-enable no-new */
    }).is.throwing('Command is missing.');
    done();
  });

  test('sends the command to the wire.', done => {
    const fakeEventStream = new PassThrough({ objectMode: true });

    wire.subscribeToEvents = function () {
      return {
        stream: fakeEventStream,
        cancel () {}
      };
    };

    wire.sendCommand = function (sentCommand) {
      assert.that(sentCommand.context.name).is.equalTo(command.context.name);
      assert.that(sentCommand.aggregate.name).is.equalTo(command.aggregate.name);
      assert.that(sentCommand.aggregate.id).is.equalTo(command.aggregate.id);
      assert.that(sentCommand.name).is.equalTo(command.name);

      // Resolve the promise in order to simulate an http request
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
          done();
        }, 0.1 * 1000);
      });
    };

    // In a minute, start the event stream so that the command runner detects
    // a connection.
    setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

    /* eslint-disable no-new */
    new CommandRunner({ app, wire, command });
    /* eslint-enable no-new */
  });

  suite('delivered', () => {
    test('runs the delivered callback once the command has been sent to the server.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      new CommandRunner({ app, wire, command }).delivered(deliveredCommand => {
        assert.that(deliveredCommand.context.name).is.equalTo(command.context.name);
        assert.that(deliveredCommand.aggregate.name).is.equalTo(command.aggregate.name);
        assert.that(deliveredCommand.aggregate.id).is.equalTo(command.aggregate.id);
        assert.that(deliveredCommand.name).is.equalTo(command.name);
        fakeEventStream.end();
        done();
      });
    });
  });

  suite('await', () => {
    test('runs the await callback if the awaited event was received.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      setTimeout(() => {
        fakeEventStream.write(new Event({
          context: command.context,
          aggregate: command.aggregate,
          name: 'pinged',
          type: 'domain',
          metadata: command.metadata
        }));
        fakeEventStream.end();
      }, 0.2 * 1000);

      new CommandRunner({ app, wire, command }).
        await('pinged', (event, sentCommand) => {
          assert.that(event.context.name).is.equalTo(command.context.name);
          assert.that(event.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(event.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(event.name).is.equalTo('pinged');

          assert.that(sentCommand.context.name).is.equalTo(command.context.name);
          assert.that(sentCommand.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(sentCommand.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(sentCommand.name).is.equalTo(command.name);

          done();
        });
    });

    test('runs the await callback if one of the awaited events was received.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      setTimeout(() => {
        fakeEventStream.write(new Event({
          context: command.context,
          aggregate: command.aggregate,
          name: 'pinged',
          type: 'domain',
          metadata: command.metadata
        }));
        fakeEventStream.end();
      }, 0.2 * 1000);

      new CommandRunner({ app, wire, command }).
        await([ 'pinged', 'ponged' ], (event, sentCommand) => {
          assert.that(event.context.name).is.equalTo(command.context.name);
          assert.that(event.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(event.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(event.name).is.equalTo('pinged');

          assert.that(sentCommand.context.name).is.equalTo(command.context.name);
          assert.that(sentCommand.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(sentCommand.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(sentCommand.name).is.equalTo(command.name);

          done();
        });
    });

    test('does not run await callback when no matching event is received.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });
      let isPinged = false;

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      setTimeout(() => {
        fakeEventStream.write(new Event({
          context: command.context,
          aggregate: command.aggregate,
          name: 'ponged',
          type: 'domain',
          metadata: command.metadata
        }));

        setTimeout(() => {
          assert.that(isPinged).is.false();
        }, 0.1 * 1000);
      }, 0.2 * 1000);

      new CommandRunner({ app, wire, command }).
        await('pinged', () => {
          // Should never happen since we only send a ponged event.
          isPinged = true;
        }).
        timeout('250ms', () => {
          fakeEventStream.end();
          done();
        });
    });
  });

  suite('failed', () => {
    test('runs the failed callback if the command could not be sent to the server.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.reject(new Error());
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      new CommandRunner({ app, wire, command }).
        failed((err, notDeliveredCommand) => {
          assert.that(err.message).is.equalTo('Failed to deliver command.');
          assert.that(notDeliveredCommand.context.name).is.equalTo(command.context.name);
          assert.that(notDeliveredCommand.aggregate.name).is.equalTo(command.aggregate.name);
          assert.that(notDeliveredCommand.aggregate.id).is.equalTo(command.aggregate.id);
          assert.that(notDeliveredCommand.name).is.equalTo(command.name);
          fakeEventStream.end();
          done();
        });
    });
  });

  suite('timeout', () => {
    test('runs the timeout callback if no event was received within the specified time.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      new CommandRunner({ app, wire, command }).timeout('100ms', sentCommand => {
        assert.that(sentCommand.context.name).is.equalTo(command.context.name);
        assert.that(sentCommand.aggregate.name).is.equalTo(command.aggregate.name);
        assert.that(sentCommand.aggregate.id).is.equalTo(command.aggregate.id);
        assert.that(sentCommand.name).is.equalTo(command.name);
        fakeEventStream.end();
        done();
      });
    });

    test('does not run the timeout callback if an event was received within the specified time.', done => {
      const fakeEventStream = new PassThrough({ objectMode: true });

      wire.subscribeToEvents = function () {
        return {
          stream: fakeEventStream,
          cancel () {}
        };
      };

      wire.sendCommand = function () {
        return Promise.resolve();
      };

      let wasTimeoutCallbackRun = false;

      // In a minute, start the event stream so that the command runner detects
      // a connection.
      setTimeout(() => fakeEventStream.emit('start'), 0.1 * 1000);

      setTimeout(() => {
        fakeEventStream.write(new Event({
          context: command.context,
          aggregate: command.aggregate,
          name: 'pinged',
          metadata: command.metadata
        }));

        setTimeout(() => {
          assert.that(wasTimeoutCallbackRun).is.false();
          done();
        }, 0.2 * 1000);
      }, 0.2 * 1000);

      new CommandRunner({ app, wire, command }).
        await('pinged', () => {
          // Intentionally left blank.
        }).
        timeout('200ms', () => {
          wasTimeoutCallbackRun = true;
        });
    });
  });
});
