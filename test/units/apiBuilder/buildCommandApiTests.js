'use strict';

const stream = require('stream');

const assert = require('assertthat'),
      merge = require('lodash/merge'),
      uuid = require('uuidv4');

const buildCommandApi = require('../../../src/apiBuilder/buildCommandApi'),
      CommandRunner = require('../../../src/apiBuilder/CommandRunner'),
      FakeWire = require('../../shared/FakeWire'),
      getApp = require('../../../src/getApp'),
      getEventsApi = require('../../../src/apiBuilder/getEventsApi'),
      getWriteModelApi = require('../../../src/apiBuilder/getWriteModelApi'),
      None = require('../../../src/authentication/None');

const sampleConfiguration = require('../../shared/data/sampleConfiguration.json');

const PassThrough = stream.PassThrough;

suite('buildCommandApi', () => {
  let app,
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
        done();
      }).
      catch(done);
  });

  test('is a function.', done => {
    assert.that(buildCommandApi).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      buildCommandApi();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if app is missing.', done => {
    assert.that(() => {
      buildCommandApi({});
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      buildCommandApi({ app });
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if context name is missing.', done => {
    assert.that(() => {
      buildCommandApi({ app, wire: {}});
    }).is.throwing('Context name is missing.');
    done();
  });

  test('throws an error if aggregate name is missing.', done => {
    assert.that(() => {
      buildCommandApi({ app, wire: {}, contextName: 'network' });
    }).is.throwing('Aggregate name is missing.');
    done();
  });

  test('throws an error if command name is missing.', done => {
    assert.that(() => {
      buildCommandApi({
        app,
        wire: {},
        contextName: 'network',
        aggregateName: 'node',
        aggregateId: uuid()
      });
    }).is.throwing('Command name is missing.');
    done();
  });

  test('returns a function.', done => {
    const ping = buildCommandApi({
      app,
      wire: {},
      contextName: 'network',
      aggregateName: 'node',
      commandName: 'ping',
      aggregateId: uuid()
    });

    assert.that(ping).is.ofType('function');
    done();
  });

  test('returns a function even when no aggregate id is given.', done => {
    const ping = buildCommandApi({
      app,
      wire: {},
      contextName: 'network',
      aggregateName: 'node',
      commandName: 'ping'
    });

    assert.that(ping).is.ofType('function');
    done();
  });

  test('returns a function that returns a command runner.', done => {
    const aggregateId = uuid();

    wire.subscribeToEvents = function () {
      const fakeEventStream = new PassThrough({ objectMode: true });

      return {
        stream: fakeEventStream
      };
    };

    const ping = buildCommandApi({
      app,
      wire,
      contextName: 'network',
      aggregateName: 'node',
      commandName: 'ping',
      aggregateId
    });

    const commandRunner = ping();

    assert.that(commandRunner).is.instanceOf(CommandRunner);
    assert.that(commandRunner.app).is.sameAs(app);
    assert.that(commandRunner.command).is.ofType('object');
    assert.that(commandRunner.command.context.name).is.equalTo('network');
    assert.that(commandRunner.command.aggregate.name).is.equalTo('node');
    assert.that(commandRunner.command.aggregate.id).is.equalTo(aggregateId);
    assert.that(commandRunner.command.name).is.equalTo('ping');
    assert.that(commandRunner.command.data).is.equalTo({});
    done();
  });

  test('sets correct command data.', done => {
    const aggregateId = uuid();

    wire.subscribeToEvents = function () {
      const fakeEventStream = new PassThrough({ objectMode: true });

      return {
        stream: fakeEventStream
      };
    };

    const ping = buildCommandApi({
      app,
      wire,
      contextName: 'network',
      aggregateName: 'node',
      commandName: 'ping',
      aggregateId
    });
    const commandRunner = ping({ ip: '127.0.0.1' });

    assert.that(commandRunner).is.instanceOf(CommandRunner);
    assert.that(commandRunner.app).is.sameAs(app);
    assert.that(commandRunner.command).is.ofType('object');
    assert.that(commandRunner.command.context.name).is.equalTo('network');
    assert.that(commandRunner.command.aggregate.name).is.equalTo('node');
    assert.that(commandRunner.command.aggregate.id).is.equalTo(aggregateId);
    assert.that(commandRunner.command.name).is.equalTo('ping');
    assert.that(commandRunner.command.data).is.equalTo({ ip: '127.0.0.1' });
    done();
  });

  test('supports impersonation.', done => {
    const aggregateId = uuid();

    wire.subscribeToEvents = function () {
      const fakeEventStream = new PassThrough({ objectMode: true });

      return {
        stream: fakeEventStream
      };
    };

    const ping = buildCommandApi({
      app,
      wire,
      contextName: 'network',
      aggregateName: 'node',
      commandName: 'ping',
      aggregateId
    });
    const commandRunner = ping({}, { asUser: 'Jane Doe' });

    assert.that(commandRunner).is.instanceOf(CommandRunner);
    assert.that(commandRunner.app).is.sameAs(app);
    assert.that(commandRunner.command).is.ofType('object');
    assert.that(commandRunner.command.context.name).is.equalTo('network');
    assert.that(commandRunner.command.aggregate.name).is.equalTo('node');
    assert.that(commandRunner.command.aggregate.id).is.equalTo(aggregateId);
    assert.that(commandRunner.command.name).is.equalTo('ping');
    assert.that(commandRunner.command.data).is.equalTo({});
    assert.that(commandRunner.command.custom.asUser).is.equalTo('Jane Doe');
    done();
  });
});
