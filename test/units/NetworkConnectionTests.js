'use strict';

const assert = require('assertthat'),
      nock = require('nock');

const NetworkConnection = require('../../src/NetworkConnection');

suite('NetworkConnection', () => {
  test('is a function.', done => {
    assert.that(NetworkConnection).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new NetworkConnection();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if host is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new NetworkConnection({ autoStart: false });
      /* eslint-enable no-new */
    }).is.throwing('Host is missing.');
    done();
  });

  test('throws an error if port is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new NetworkConnection({ autoStart: false, host: 'local.wolkenkit.io' });
      /* eslint-enable no-new */
    }).is.throwing('Port is missing.');
    done();
  });

  suite('initially', () => {
    test('emits an online event if the client can reach the /v1/ping route.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        /* eslint-disable no-confusing-arrow */
        filteringPath(path => path.startsWith('/v1/ping?_=') ? '/v1/ping?_=1489419597755' : path).
        /* eslint-enable no-confusing-arrow */
        get('/v1/ping?_=1489419597755').
        delay(0.1 * 1000).
        reply(200);

      const networkConnection = new NetworkConnection({ host: 'local.wolkenkit.io', port: 9000 });

      const onOffline = function () {
        done(new Error('Should never be called.'));
      };

      const onOnline = function () {
        assert.that(request.isDone()).is.true();
        assert.that(networkConnection.isOnline).is.true();

        nock.cleanAll();
        networkConnection.removeListener('online', onOnline);
        networkConnection.removeListener('offline', onOffline);
        networkConnection.destroy();
        done();
      };

      networkConnection.once('offline', onOffline);
      networkConnection.once('online', onOnline);
    });

    test('emits an offline event if the client can not reach the /v1/ping route.', done => {
      nock.disableNetConnect();

      const networkConnection = new NetworkConnection({ host: 'local.wolkenkit.io', port: 9000 });

      const onOnline = function () {
        done(new Error('Should never be called.'));
      };

      const onOffline = function () {
        assert.that(networkConnection.isOnline).is.false();

        nock.enableNetConnect();
        networkConnection.removeListener('online', onOnline);
        networkConnection.removeListener('offline', onOffline);
        networkConnection.destroy();
        done();
      };

      networkConnection.on('online', onOnline);
      networkConnection.on('offline', onOffline);
    });
  });

  suite('when offline', () => {
    test('emits an online event when the client comes back online.', done => {
      const request = nock('https://local.wolkenkit.io:9000').
        /* eslint-disable no-confusing-arrow */
        filteringPath(path => path.startsWith('/v1/ping?_=') ? '/v1/ping?_=1489419597755' : path).
        /* eslint-enable no-confusing-arrow */
        get('/v1/ping?_=1489419597755').
        delay(0.1 * 1000).
        reply(200);

      const networkConnection = new NetworkConnection({ host: 'local.wolkenkit.io', port: 9000 });

      const onOffline = function () {
        done('Should never be called.');
      };

      const onOnline = function () {
        assert.that(request.isDone()).is.true();
        nock.cleanAll();
        networkConnection.removeListener('online', onOnline);
        networkConnection.removeListener('offline', onOffline);
        networkConnection.destroy();
        done();
      };

      networkConnection.offline();
      networkConnection.once('offline', onOffline);
      networkConnection.once('online', onOnline);
    });
  });

  suite('when online', () => {
    test('emits an offline event when the client cannot reach the /v1/ping route.', done => {
      nock.disableNetConnect();

      const networkConnection = new NetworkConnection({ host: 'local.wolkenkit.io', port: 9000 });

      const onOnline = function () {
        done('Should never be called.');
      };

      const onOffline = function () {
        assert.that(networkConnection.isOnline).is.false();
        nock.enableNetConnect();
        networkConnection.removeListener('online', onOnline);
        networkConnection.removeListener('offline', onOffline);
        networkConnection.destroy();
        done();
      };

      networkConnection.online();
      networkConnection.once('offline', onOffline);
      networkConnection.once('online', onOnline);
    });
  });
});
