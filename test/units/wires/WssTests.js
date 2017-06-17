'use strict';

const Command = require('commands-events').Command;

const assert = require('assertthat'),
      mockery = require('mockery'),
      toArray = require('streamtoarray'),
      uuid = require('uuidv4');

/* eslint-disable global-require */
suite('Wss', () => {
  setup(() => {
    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
  });

  teardown(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  test('is a function.', done => {
    const FakeWebSocket = function () {
      // Intentionally left blank.
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    assert.that(Wss).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    const FakeWebSocket = function () {
      // Intentionally left blank.
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    assert.that(() => {
      /* eslint-disable no-new */
      new Wss();
      /* eslint-disable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if app is missing.', done => {
    const FakeWebSocket = function () {
      // Intentionally left blank.
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    assert.that(() => {
      /* eslint-disable no-new */
      new Wss({});
      /* eslint-disable no-new */
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an error if host is missing.', done => {
    const FakeWebSocket = function () {
      // Intentionally left blank.
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    assert.that(() => {
      /* eslint-disable no-new */
      new Wss({ app: {}});
      /* eslint-disable no-new */
    }).is.throwing('Host is missing.');
    done();
  });

  test('throws an error if port is missing.', done => {
    const FakeWebSocket = function () {
      // Intentionally left blank.
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    assert.that(() => {
      /* eslint-disable no-new */
      new Wss({ app: {}, host: 'local.wolkenkit.io' });
      /* eslint-disable no-new */
    }).is.throwing('Port is missing.');
    done();
  });

  test('emits a connect event once the wire is ready.', done => {
    const FakeWebSocket = function (url) {
      assert.that(url).is.equalTo('wss://local.wolkenkit.io:9000');
      process.nextTick(() => this.onopen());
    };

    mockery.registerMock('ws', FakeWebSocket);

    const Wss = require('../../../lib/wires/Wss');

    const wire = new Wss({
      app: {},
      host: 'local.wolkenkit.io',
      port: 9000
    });

    wire.once('connect', () => done());
  });

  suite('sendCommand', () => {
    let command;

    const getWire = function (Wss) {
      const wire = new Wss({
        app: {
          auth: {
            getToken () {
              return uuid();
            }
          }
        },
        host: 'local.wolkenkit.io',
        port: 9000
      });

      return wire;
    };

    setup(() => {
      command = new Command({
        context: {
          name: 'planning'
        },
        aggregate: {
          name: 'peerGroup',
          id: uuid()
        },
        name: 'join',
        data: {
          participant: 'Jane Doe'
        }
      });
    });

    test('is a function.', done => {
      const FakeWebSocket = function () {
        // Intentionally left blank.
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(wire.sendCommand).is.ofType('function');
      done();
    });

    test('throws an error if command is missing.', done => {
      const FakeWebSocket = function () {
        // Intentionally left blank.
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(() => {
        wire.sendCommand();
      }).is.throwing('Command is missing.');
      done();
    });

    test('sends commands using the \'sendCommand\' message.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.type).is.equalTo('sendCommand');
          assert.that(message.version).is.equalTo('v1');
          assert.that(message.procedureId).is.matching(uuid.regex);
          assert.that(message.payload).is.sameJsonAs(command);

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'sentCommand',
              procedureId: message.procedureId
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.sendCommand(command).
        then(() => done()).
        catch(done);
    });

    test('returns the error if the route returns a status code 400.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'error',
              procedureId: message.procedureId,
              statusCode: 400,
              payload: 'Unknown command name.'
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.sendCommand(command).
        then(() => {
          done(new Error('Should never be called'));
        }).
        catch(err => {
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Unknown command name.');
          done();
        }).
        catch(done);
    });

    test('sends the authentication token.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.token).is.equalTo('superSecretToken');

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'sentCommand',
              procedureId: message.procedureId
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      wire.sendCommand(command).
        then(() => done()).
        catch(done);
    });

    test('returns an error and emits an event if authentication is required.', done => {
      let eventWasEmitted = false;

      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'error',
              procedureId: message.procedureId,
              statusCode: 401
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.once('authentication-required', () => {
        eventWasEmitted = true;
      });

      wire.sendCommand(command).
        then(() => {
          done(new Error('Should never be called.'));
        }).
        catch(err => {
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Authentication required.');
          assert.that(eventWasEmitted).is.true();
          done();
        }).
        catch(done);
    });
  });

  suite('subscribeToEvents', () => {
    const getWire = function (Wss) {
      const wire = new Wss({
        app: {
          auth: {
            getToken () {
              return uuid();
            }
          }
        },
        host: 'local.wolkenkit.io',
        port: 9000
      });

      return wire;
    };

    test('is a function.', done => {
      const FakeWebSocket = function () {
        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(wire.subscribeToEvents).is.ofType('function');
      done();
    });

    test('subscribes to events using the \'subscribeEvents\' message.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.type).is.equalTo('subscribeEvents');
          assert.that(message.version).is.equalTo('v1');
          assert.that(message.procedureId).is.matching(uuid.regex);
          assert.that(message.payload).is.equalTo({ filter: {}});

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'subscribedEvents',
              procedureId: message.procedureId
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const events = wire.subscribeToEvents();

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the filter as body.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.payload).is.equalTo({ filter: { name: 'joined' }});

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'subscribedEvents',
              procedureId: message.procedureId
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const events = wire.subscribeToEvents({ name: 'joined' });

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the authentication token.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.token).is.equalTo('superSecretToken');

          process.nextTick(() => this.onmessage({
            data: JSON.stringify({
              type: 'subscribedEvents',
              procedureId: message.procedureId
            })
          }));
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      const events = wire.subscribeToEvents();

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('returns an event stream.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'subscribedEvents',
                procedureId: message.procedureId
              })
            });
            this.onmessage({
              data: JSON.stringify({
                type: 'event',
                procedureId: message.procedureId,
                payload: { context: { name: 'planning' }, aggregate: { name: 'peerGroup' }, name: 'started' }
              })
            });
            this.onmessage({
              data: JSON.stringify({
                type: 'event',
                procedureId: message.procedureId,
                payload: { context: { name: 'planning' }, aggregate: { name: 'peerGroup' }, name: 'joined' }
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const events = wire.subscribeToEvents({});

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        let counter = 0;

        const onData = function (data) {
          counter += 1;

          switch (counter) {
            case 1:
              assert.that(data.context.name).is.equalTo('planning');
              assert.that(data.aggregate.name).is.equalTo('peerGroup');
              assert.that(data.name).is.equalTo('started');
              break;
            case 2:
              assert.that(data.context.name).is.equalTo('planning');
              assert.that(data.aggregate.name).is.equalTo('peerGroup');
              assert.that(data.name).is.equalTo('joined');

              events.cancel();
              events.stream.removeListener('data', onData);

              return done();
            default:
              return done(new Error('Invalid operation.'));
          }
        };

        events.stream.on('data', onData);
      }, 0.1 * 1000);
    });

    test('emits an \'authentication-required\' event if authentication is required.', done => {
      let events;

      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'error',
                procedureId: message.procedureId,
                statusCode: 401
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.once('authentication-required', () => {
        events.cancel();

        done();
      });

      events = wire.subscribeToEvents();
    });

    suite('cancel', () => {
      test('closes the stream.', done => {
        const FakeWebSocket = function () {
          this.send = function (messageAsString) {
            const message = JSON.parse(messageAsString);

            process.nextTick(() => {
              this.onmessage({
                data: JSON.stringify({
                  type: 'subscribedEvents',
                  procedureId: message.procedureId
                })
              });
            });
          };

          process.nextTick(() => this.onopen());
        };

        mockery.registerMock('ws', FakeWebSocket);

        const Wss = require('../../../lib/wires/Wss');
        const wire = getWire(Wss);

        const events = wire.subscribeToEvents();

        // Slightly delay the assertions since subscribeToEvents calls
        // process.nextTick internally.
        setTimeout(() => {
          events.cancel();

          assert.that(() => {
            events.stream.write('test');
          }).is.throwing('write after end');
          done();
        }, 0.1 * 1000);
      });
    });
  });

  suite('readModel', () => {
    const getWire = function (Wss) {
      const wire = new Wss({
        app: {
          auth: {
            getToken () {
              return uuid();
            }
          }
        },
        host: 'local.wolkenkit.io',
        port: 9000
      });

      return wire;
    };

    test('is a function.', done => {
      const FakeWebSocket = function () {
        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(wire.readModel).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      const FakeWebSocket = function () {
        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(() => {
        wire.readModel();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if model name is missing.', done => {
      const FakeWebSocket = function () {
        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(() => {
        wire.readModel({});
      }).is.throwing('Model name is missing.');
      done();
    });

    test('throws an error if model type is missing.', done => {
      const FakeWebSocket = function () {
        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      assert.that(() => {
        wire.readModel({ modelName: 'peerGroups' });
      }).is.throwing('Model type is missing.');
      done();
    });

    test('subscribes to models using the \'subscribeRead\' message.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.type).is.equalTo('subscribeRead');
          assert.that(message.version).is.equalTo('v1');
          assert.that(message.procedureId).is.matching(uuid.regex);
          assert.that(message.payload).is.equalTo({
            modelType: 'lists',
            modelName: 'peerGroups',
            query: {}
          });

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'subscribedRead',
                procedureId: message.procedureId
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      // Slightly delay the assertions since readModel calls process.nextTick
      // internally.
      setTimeout(() => {
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends a given query.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.type).is.equalTo('subscribeRead');
          assert.that(message.version).is.equalTo('v1');
          assert.that(message.procedureId).is.matching(uuid.regex);
          assert.that(message.payload.query).is.equalTo({
            where: { initiator: 'Jane Doe' },
            orderBy: { timestamp: 'ascending' },
            take: 10,
            skip: 10
          });

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'subscribedRead',
                procedureId: message.procedureId
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const model = wire.readModel({
        modelType: 'lists',
        modelName: 'peerGroups',
        query: {
          where: { initiator: 'Jane Doe' },
          orderBy: { timestamp: 'ascending' },
          take: 10,
          skip: 10
        }
      });

      // Slightly delay the assertions since readModel calls process.nextTick
      // internally.
      setTimeout(() => {
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the authentication token.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          assert.that(message.token).is.equalTo('superSecretToken');

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'subscribedRead',
                procedureId: message.procedureId
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      // Slightly delay the assertions since readModel calls process.nextTick
      // internally.
      setTimeout(() => {
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('returns a model stream.', done => {
      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'subscribedRead',
                procedureId: message.procedureId
              })
            });
            this.onmessage({
              data: JSON.stringify({
                type: 'item',
                procedureId: message.procedureId,
                payload: { initiator: 'Jane Doe', destination: 'Riva' }
              })
            });
            this.onmessage({
              data: JSON.stringify({
                type: 'finish',
                procedureId: message.procedureId
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      toArray(model.stream, (errToArray, models) => {
        assert.that(errToArray).is.null();
        assert.that(models.length).is.equalTo(1);
        assert.that(models[0].initiator).is.equalTo('Jane Doe');
        assert.that(models[0].destination).is.equalTo('Riva');

        model.cancel();
        done();
      });
    });

    test('emits an \'authentication-required\' event if authentication is required.', done => {
      let model;

      const FakeWebSocket = function () {
        this.send = function (messageAsString) {
          const message = JSON.parse(messageAsString);

          process.nextTick(() => {
            this.onmessage({
              data: JSON.stringify({
                type: 'error',
                procedureId: message.procedureId,
                statusCode: 401
              })
            });
          });
        };

        process.nextTick(() => this.onopen());
      };

      mockery.registerMock('ws', FakeWebSocket);

      const Wss = require('../../../lib/wires/Wss');
      const wire = getWire(Wss);

      wire.once('authentication-required', () => {
        model.cancel();

        done();
      });

      model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });
    });

    suite('cancel', () => {
      test('closes the stream.', done => {
        const FakeWebSocket = function () {
          this.send = function (messageAsString) {
            const message = JSON.parse(messageAsString);

            process.nextTick(() => {
              this.onmessage({
                data: JSON.stringify({
                  type: 'subscribedRead',
                  procedureId: message.procedureId
                })
              });
            });
          };

          process.nextTick(() => this.onopen());
        };

        mockery.registerMock('ws', FakeWebSocket);

        const Wss = require('../../../lib/wires/Wss');
        const wire = getWire(Wss);

        const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

        // Slightly delay the assertions since readModel calls process.nextTick
        // internally.
        setTimeout(() => {
          model.cancel();

          assert.that(() => {
            model.stream.write('test');
          }).is.throwing('write after end');
          done();
        }, 0.1 * 1000);
      });
    });
  });
});
/* eslint-enable global-require */
