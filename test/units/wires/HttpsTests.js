'use strict';

const Command = require('commands-events').Command;

const assert = require('assertthat'),
      nock = require('nock'),
      toArray = require('streamtoarray'),
      uuid = require('uuidv4');

const Https = require('../../../lib/wires/Https');

suite('Https', () => {
  test('is a function.', done => {
    assert.that(Https).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Https();
      /* eslint-disable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if app is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Https({});
      /* eslint-disable no-new */
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an error if host is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Https({ app: {}});
      /* eslint-disable no-new */
    }).is.throwing('Host is missing.');
    done();
  });

  test('throws an error if port is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Https({ app: {}, host: 'local.wolkenkit.io' });
      /* eslint-disable no-new */
    }).is.throwing('Port is missing.');
    done();
  });

  test('emits a connect event once the wire is ready.', done => {
    const wire = new Https({
      app: {},
      host: 'local.wolkenkit.io',
      port: 9000
    });

    wire.once('connect', () => done());
  });

  suite('sendCommand', () => {
    let command,
        wire;

    setup(() => {
      wire = new Https({
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
      assert.that(wire.sendCommand).is.ofType('function');
      done();
    });

    test('throws an error if command is missing.', done => {
      assert.that(() => {
        wire.sendCommand();
      }).is.throwing('Command is missing.');
      done();
    });

    test('sends commands to the /v1/command route of the broker.', done => {
      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json'
        }
      }).
        post('/v1/command', command).
        reply(200);

      wire.sendCommand(command).
        then(() => {
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('returns the error if the route returns a status code 400.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/command').
        reply(400, 'Unknown command name.');

      wire.sendCommand(command).
        then(() => {
          done(new Error('Should never be called'));
        }).
        catch(err => {
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Unknown command name.');
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('returns an error if the network is down.', done => {
      nock.disableNetConnect();

      wire.sendCommand(command).
        then(() => {
          done(new Error('Should never be called'));
        }).
        catch(err => {
          assert.that(err).is.not.null();
          nock.enableNetConnect();
          done();
        }).
        catch(done);
    });

    test('sends the authentication token as header.', done => {
      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json',
          authorization: 'Bearer superSecretToken'
        }
      }).
        post('/v1/command', command).
        reply(200);

      wire.sendCommand(command).
        then(() => {
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('returns an error and emits an event if authentication is required.', done => {
      let eventWasEmitted = false;

      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/command', command).
        reply(401);

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
          assert.that(request.isDone()).is.true();
          assert.that(eventWasEmitted).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });
  });

  suite('subscribeToEvents', () => {
    let wire;

    setup(() => {
      wire = new Https({
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
    });

    test('is a function.', done => {
      assert.that(wire.subscribeToEvents).is.ofType('function');
      done();
    });

    test('subscribes to events from /v1/events route of the broker.', done => {
      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json'
        }
      }).
        post('/v1/events').
        reply(200);

      const events = wire.subscribeToEvents();

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the filter as body.', done => {
      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json'
        }
      }).
        post('/v1/events', { name: 'joined' }).
        reply(200);

      const events = wire.subscribeToEvents({ name: 'joined' });

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the authentication token as header.', done => {
      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json',
          authorization: 'Bearer superSecretToken'
        }
      }).
        post('/v1/events').
        reply(200);

      const events = wire.subscribeToEvents();

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        events.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('returns an event stream.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/events').
        reply(200, [
          { context: { name: 'planning' }, aggregate: { name: 'peerGroup' }, name: 'started' },
          { context: { name: 'planning' }, aggregate: { name: 'peerGroup' }, name: 'joined' }
        ].map(event => JSON.stringify(event)).join('\n'));

      const events = wire.subscribeToEvents({});

      // Slightly delay the assertions since subscribeToEvents calls
      // process.nextTick internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        toArray(events.stream, (errToArray, data) => {
          assert.that(errToArray).is.null();
          assert.that(request.isDone()).is.true();
          nock.cleanAll();

          assert.that(data.length).is.equalTo(2);
          assert.that(data[0].context.name).is.equalTo('planning');
          assert.that(data[0].aggregate.name).is.equalTo('peerGroup');
          assert.that(data[0].name).is.equalTo('started');
          assert.that(data[1].context.name).is.equalTo('planning');
          assert.that(data[1].aggregate.name).is.equalTo('peerGroup');
          assert.that(data[1].name).is.equalTo('joined');

          events.cancel();
          done();
        });
      }, 0.1 * 1000);
    });

    test('emits an \'authentication-required\' event if authentication is required.', done => {
      let events;

      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/events').
        reply(401);

      wire.once('authentication-required', () => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        events.cancel();

        done();
      });

      events = wire.subscribeToEvents();
    });

    test('emits an error if the network is down.', done => {
      nock.disableNetConnect();

      const events = wire.subscribeToEvents();

      events.stream.once('error', err => {
        assert.that(err).is.not.null();

        nock.enableNetConnect();
        events.cancel();
        done();
      });
    });

    suite('cancel', () => {
      test('closes the stream.', done => {
        const request = nock('https://local.wolkenkit.io:9000').
          post('/v1/events').
          reply(200);

        const events = wire.subscribeToEvents();

        // Slightly delay the assertions since subscribeToEvents calls
        // process.nextTick internally.
        setTimeout(() => {
          events.cancel();

          assert.that(() => {
            events.stream.write('test');
          }).is.throwing('write after end');
          assert.that(request.isDone()).is.true();

          nock.cleanAll();
          done();
        }, 0.1 * 1000);
      });
    });
  });

  suite('readModel', () => {
    let wire;

    setup(() => {
      wire = new Https({
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
    });

    test('is a function.', done => {
      assert.that(wire.readModel).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        wire.readModel();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if model name is missing.', done => {
      assert.that(() => {
        wire.readModel({});
      }).is.throwing('Model name is missing.');
      done();
    });

    test('throws an error if model type is missing.', done => {
      assert.that(() => {
        wire.readModel({ modelName: 'peerGroups' });
      }).is.throwing('Model type is missing.');
      done();
    });

    test('subscribes to models from /v1/read route of the broker.', done => {
      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json'
        }
      }).
        post('/v1/read/lists/peerGroups?').
        reply(200);

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      // Slightly delay the assertions since readModel calls process.nextTick
      // internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends a given query as part of the URL.', done => {
      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json'
        }
      }).
        post('/v1/read/lists/peerGroups').
        query({
          where: JSON.stringify({ initiator: 'Jane Doe' }),
          orderBy: JSON.stringify({ timestamp: 'ascending' }),
          take: 10,
          skip: 10
        }).
        reply(200);

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
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('sends the authentication token as header.', done => {
      wire.app.auth = {
        getToken () {
          return 'superSecretToken';
        }
      };

      const request = nock('https://local.wolkenkit.io:9000', {
        reqheaders: {
          'content-type': 'application/json',
          authorization: 'Bearer superSecretToken'
        }
      }).
        post('/v1/read/lists/peerGroups?').
        reply(200);

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      // Slightly delay the assertions since readModel calls process.nextTick
      // internally.
      setTimeout(() => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        model.cancel();
        done();
      }, 0.1 * 1000);
    });

    test('returns a model stream.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/read/lists/peerGroups?').
        reply(200, [
          { initiator: 'Jane Doe', destination: 'Riva' }
        ].map(event => JSON.stringify(event)).join('\n'));

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      toArray(model.stream, (errToArray, models) => {
        assert.that(errToArray).is.null();
        assert.that(request.isDone()).is.true();
        nock.cleanAll();

        assert.that(models.length).is.equalTo(1);
        assert.that(models[0].initiator).is.equalTo('Jane Doe');
        assert.that(models[0].destination).is.equalTo('Riva');

        model.cancel();
        done();
      });
    });

    test('emits an \'authentication-required\' event if authentication is required.', done => {
      let model;

      const request = nock('https://local.wolkenkit.io:9000').
        post('/v1/read/lists/peerGroups?').
        reply(401);

      wire.once('authentication-required', () => {
        assert.that(request.isDone()).is.true();

        nock.cleanAll();
        model.cancel();

        done();
      });

      model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });
    });

    test('emits an error if the network is down.', done => {
      nock.disableNetConnect();

      const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

      model.stream.once('error', err => {
        assert.that(err).is.not.null();

        nock.enableNetConnect();
        model.cancel();
        done();
      });
    });

    suite('cancel', () => {
      test('closes the stream.', done => {
        const request = nock('https://local.wolkenkit.io:9000', {
          reqheaders: {
            'content-type': 'application/json'
          }
        }).
          post('/v1/read/lists/peerGroups?').
          reply(200);

        const model = wire.readModel({ modelType: 'lists', modelName: 'peerGroups' });

        // Slightly delay the assertions since readModel calls process.nextTick
        // internally.
        setTimeout(() => {
          model.cancel();

          assert.that(() => {
            model.stream.write('test');
          }).is.throwing('write after end');
          assert.that(request.isDone()).is.true();

          nock.cleanAll();
          done();
        }, 0.1 * 1000);
      });
    });
  });
});
