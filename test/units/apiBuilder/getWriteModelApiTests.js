'use strict';

const assert = require('assertthat');

const CommandRunner = require('../../../src/apiBuilder/CommandRunner'),
      getApp = require('../../../src/getApp'),
      getWriteModelApi = require('../../../src/apiBuilder/getWriteModelApi'),
      None = require('../../../src/authentication/None'),
      sampleConfiguration = require('../../shared/data/sampleConfiguration.json');

suite('getWriteModelApi', () => {
  let app;

  setup(done => {
    getApp({
      host: 'local.wolkenkit.io',
      port: 443,
      protocol: 'https',
      authentication: new None(),
      configuration: sampleConfiguration
    }).
      then(_app => {
        app = _app;
        done();
      }).
      catch(done);
  });

  test('is a function.', done => {
    assert.that(getWriteModelApi).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      getWriteModelApi();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if app is missing.', done => {
    assert.that(() => {
      getWriteModelApi({});
    }).is.throwing('App is missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      getWriteModelApi({ app });
    }).is.throwing('Wire is missing.');
    done();
  });

  test('throws an error if write model is missing.', done => {
    assert.that(() => {
      getWriteModelApi({ app, wire: {}});
    }).is.throwing('Write model is missing.');
    done();
  });

  test('returns the write model API.', done => {
    const writeModelApi = getWriteModelApi({ app, wire: {}, writeModel: sampleConfiguration.writeModel });

    assert.that(writeModelApi.network).is.ofType('object');
    assert.that(writeModelApi.foo).is.ofType('object');

    assert.that(writeModelApi.network.node).is.ofType('function');
    assert.that(writeModelApi.foo.bar).is.ofType('function');
    assert.that(writeModelApi.foo.nufta).is.ofType('function');

    const aggregate = writeModelApi.foo.bar();

    assert.that(aggregate.baz).is.ofType('function');
    assert.that(aggregate.bas).is.ofType('function');

    const commandRunner = aggregate.baz();

    assert.that(commandRunner).is.instanceOf(CommandRunner);

    commandRunner.failed(err => {
      assert.that(err.code).is.equalTo('ECOMMANDFAILED');
      done();
    });
  });
});
