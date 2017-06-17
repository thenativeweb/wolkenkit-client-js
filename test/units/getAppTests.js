'use strict';

const _ = require('lodash'),
      assert = require('assertthat'),
      nock = require('nock');

const getApp = require('../../lib/getApp'),
      localStorage = require('../../lib/localStorage'),
      None = require('../../lib/authentication/None'),
      sampleConfiguration = require('../data/sampleConfiguration.json');

suite('getApp', () => {
  test('is a function.', done => {
    assert.that(getApp).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      getApp();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if host is missing.', done => {
    assert.that(() => {
      getApp({});
    }).is.throwing('Host is missing.');
    done();
  });

  test('throws an error if port is missing.', done => {
    assert.that(() => {
      getApp({ host: 'local.wolkenkit.io' });
    }).is.throwing('Port is missing.');
    done();
  });

  test('throws an error if protocol is missing.', done => {
    assert.that(() => {
      getApp({ host: 'local.wolkenkit.io', port: 443 });
    }).is.throwing('Protocol is missing.');
    done();
  });

  test('throws an error if authentication is missing.', done => {
    assert.that(() => {
      getApp({ host: 'local.wolkenkit.io', port: 443, protocol: 'https' });
    }).is.throwing('Authentication is missing.');
    done();
  });

  test('returns an application.', done => {
    const requestPing = nock('https://local.wolkenkit.io:443').
      /* eslint-disable no-confusing-arrow */
      filteringPath(path => path.startsWith('/v1/ping?_=') ? '/v1/ping?_=1489419597755' : path).
      /* eslint-enable no-confusing-arrow */
      get('/v1/ping?_=1489419597755').
      delay(0.1 * 1000).
      reply(200);

    const request = nock('https://local.wolkenkit.io:443').
      get('/v1/configuration.json').
      reply(200, sampleConfiguration);

    const authentication = new None();

    getApp({ host: 'local.wolkenkit.io', port: 443, protocol: 'https', authentication }).
      then(app => {
        assert.that(app.auth).is.sameAs(authentication);

        assert.that(app.network).is.ofType('object');
        assert.that(app.network.node).is.ofType('function');
        assert.that(app.lists).is.ofType('object');
        assert.that(app.lists.pings).is.ofType('object');
        assert.that(app.lists.pings.read).is.ofType('function');

        assert.that(request.isDone()).is.true();
        assert.that(requestPing.isDone()).is.true();
        nock.cleanAll();
        app.destroy();
        done();
      }).
      catch(done);
  });

  suite('app', () => {
    test('emits a connected event once the application is online.', done => {
      const requestPing = nock('https://local.wolkenkit.io:443').
        /* eslint-disable no-confusing-arrow */
        filteringPath(path => path.startsWith('/v1/ping?_=') ? '/v1/ping?_=1489419597755' : path).
        /* eslint-enable no-confusing-arrow */
        get('/v1/ping?_=1489419597755').
        delay(0.1 * 1000).
        reply(200);

      getApp({
        host: 'local.wolkenkit.io',
        port: 443,
        protocol: 'https',
        authentication: new None(),
        configuration: sampleConfiguration
      }).
        then(app => {
          app.once('connected', () => {
            assert.that(requestPing.isDone()).is.true();
            nock.cleanAll();
            app.destroy();
            done();
          });
        }).
        catch(done);
    });

    test('emits a disconnected event if the network connection goes offline.', done => {
      getApp({
        host: 'local.wolkenkit.non-existent',
        port: 443,
        protocol: 'https',
        authentication: new None(),
        configuration: sampleConfiguration
      }).
        then(app => {
          app.once('disconnected', () => {
            app.destroy();
            done();
          });
        }).
        catch(done);
    });

    test('emits a disconnected event if the host can be resolved, but the port is not reachable.', done => {
      getApp({
        host: 'localhost',
        port: 12345,
        protocol: 'https',
        authentication: new None(),
        configuration: sampleConfiguration
      }).
        then(app => {
          app.once('disconnected', () => {
            app.destroy();
            done();
          });
        }).
        catch(done);
    });

    test('emits an outdated event if the fetched configuration does not match the locally stored one.', done => {
      const requestPing = nock('https://local.wolkenkit.io:443').
        /* eslint-disable no-confusing-arrow */
        filteringPath(path => path.startsWith('/v1/ping?_=') ? '/v1/ping?_=1489419597755' : path).
        /* eslint-enable no-confusing-arrow */
        get('/v1/ping?_=1489419597755').
        delay(0.1 * 1000).
        reply(200);

      const outdatedSampleConfiguration = _.cloneDeep(sampleConfiguration);

      Reflect.deleteProperty(outdatedSampleConfiguration.readModel.lists, 'pongs');

      localStorage.setItem('wolkenkit_local.wolkenkit.io:443_configuration', JSON.stringify(outdatedSampleConfiguration));
      nock.disableNetConnect();

      getApp({
        host: 'local.wolkenkit.io',
        port: 443,
        protocol: 'https',
        authentication: new None()
      }).
        then(app => {
          const requestConfiguration = nock('https://local.wolkenkit.io:443').
            get('/v1/configuration.json').
            reply(200, sampleConfiguration);

          app.once('outdated', () => {
            assert.that(requestConfiguration.isDone()).is.true();
            assert.that(requestPing.isDone()).is.true();
            nock.cleanAll();
            app.destroy();
            done();
          });

          nock.enableNetConnect();
        }).
        catch(done);
    });
  });
});
