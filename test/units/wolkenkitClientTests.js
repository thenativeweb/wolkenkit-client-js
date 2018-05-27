'use strict';

const assert = require('assertthat'),
      nock = require('nock');

const sampleConfiguration = require('../shared/data/sampleConfiguration.json'),
      wolkenkitClient = require('../../src/wolkenkitClient');

suite('wolkenkitClient', () => {
  let actualConfiguration;

  teardown(() => {
    wolkenkitClient.reset();
  });

  test('is an object.', done => {
    assert.that(wolkenkitClient).is.ofType('object');
    done();
  });

  suite('connect', () => {
    test('is a function.', done => {
      assert.that(wolkenkitClient.connect).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        wolkenkitClient.connect();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if host is missing.', done => {
      assert.that(() => {
        wolkenkitClient.connect({});
      }).is.throwing('Host is missing.');
      done();
    });

    test('loads the configuration from the given host.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        reply(200, sampleConfiguration);

      wolkenkitClient.connect({
        host: 'local.wolkenkit.io',
        port: 9000
      }).
        then(() => {
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('returns an application.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        reply(200, sampleConfiguration);

      wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 }).
        then(app => {
          assert.that(app).is.ofType('object');
          assert.that(app.network).is.ofType('object');
          assert.that(app.network.node).is.ofType('function');
          assert.that(app.lists).is.ofType('object');
          assert.that(app.lists.pings).is.ofType('object');
          assert.that(app.lists.pings.read).is.ofType('function');
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('returns the same application if it is requested multiple times.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        reply(200, sampleConfiguration);

      let firstApp;

      wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 }).
        then(app => {
          firstApp = app;

          return wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 });
        }).
        then(secondApp => {
          assert.that(firstApp).is.sameAs(secondApp);
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('loads the configuration from local storage when the client is offline.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        reply(200, sampleConfiguration);

      wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 }).
        then(() => {
          wolkenkitClient.reset({ keepLocalStorage: true });
          nock.disableNetConnect();

          return wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 });
        }).
        then(app => {
          nock.enableNetConnect();
          assert.that(app).is.ofType('object');
          assert.that(app.lists).is.ofType('object');
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });

    test('favors the manually given configuration if one exists.', done => {
      nock.disableNetConnect();

      wolkenkitClient.connect({
        host: 'local.wolkenkit.io',
        port: 9000,
        configuration: sampleConfiguration
      }).
        then(app => {
          nock.enableNetConnect();
          assert.that(app).is.ofType('object');
          assert.that(app.network).is.ofType('object');
          assert.that(app.network.node).is.ofType('function');
          assert.that(app.lists).is.ofType('object');
          assert.that(app.lists.pings).is.ofType('object');
          assert.that(app.lists.pings.read).is.ofType('function');
          done();
        }).
        catch(done);
    });

    test('returns an error when the client is offline and there is no configuration in local storage.', done => {
      nock.disableNetConnect();

      wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 }).
        catch(err => {
          nock.enableNetConnect();
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Failed to get configuration.');
          done();
        }).
        catch(done);
    });

    test('returns an error when the host does not exist.', done => {
      wolkenkitClient.connect({ host: 'local.wolkenkit.non-existent' }).
        catch(err => {
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Failed to get configuration.');
          done();
        }).
        catch(done);
    });

    test('returns an error when the host does not have a configuration.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        reply(404, actualConfiguration);

      wolkenkitClient.connect({ host: 'local.wolkenkit.io', port: 9000 }).
        catch(err => {
          assert.that(err).is.not.null();
          assert.that(err.message).is.equalTo('Failed to get configuration.');
          assert.that(request.isDone()).is.true();
          nock.cleanAll();
          done();
        }).
        catch(done);
    });
  });
});
