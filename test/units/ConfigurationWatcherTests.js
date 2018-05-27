'use strict';

const _ = require('lodash'),
      assert = require('assertthat'),
      nock = require('nock');

const EventEmitter = require('events').EventEmitter;

const ConfigurationWatcher = require('../../src/ConfigurationWatcher'),
      localStorage = require('../../src/localStorage'),
      sampleConfiguration = require('../shared/data/sampleConfiguration.json');

suite('ConfigurationWatcher', () => {
  const storageKey = 'wolkenkit_local.wolkenkit.io:9000_configuration';
  let networkConnection;

  setup(() => {
    networkConnection = new EventEmitter();
    networkConnection.host = 'local.wolkenkit.io';
    networkConnection.port = 9000;
  });

  test('is a function.', done => {
    assert.that(ConfigurationWatcher).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ConfigurationWatcher();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if NetworkConnection is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ConfigurationWatcher({});
      /* eslint-enable no-new */
    }).is.throwing('Network connection is missing.');
    done();
  });

  test('should emit a \'fetched\' event when configuration has been fetched from the server.', done => {
    const requestConfiguration = nock('https://local.wolkenkit.io:9000').
      get('/v1/configuration.json').
      delay(100).
      reply(200, sampleConfiguration);

    const configurationWatcher = new ConfigurationWatcher({ networkConnection });

    configurationWatcher.once('fetched', configuration => {
      assert.that(requestConfiguration.isDone()).is.true();
      assert.that(configuration.writeModel.network).is.ofType('object');
      assert.that(configuration.writeModel.network.node).is.ofType('object');
      assert.that(configuration.readModel.lists).is.ofType('object');
      assert.that(configuration.readModel.lists.pings).is.ofType('object');

      nock.cleanAll();
      configurationWatcher.destroy();
      done();
    });
  });

  test('should store the fetched configuration in localStorage.', done => {
    const requestConfiguration = nock('https://local.wolkenkit.io:9000').
      get('/v1/configuration.json').
      delay(100).
      reply(200, sampleConfiguration);

    assert.that(localStorage.getItem(storageKey)).is.undefined();

    const configurationWatcher = new ConfigurationWatcher({ networkConnection });

    configurationWatcher.once('fetched', () => {
      assert.that(requestConfiguration.isDone()).is.true();
      assert.that(localStorage.getItem(storageKey)).is.equalTo(JSON.stringify(sampleConfiguration));

      nock.cleanAll();
      configurationWatcher.destroy();
      done();
    });
  });

  test('should use the configuration stored in localStorage if it cannot be requested online.', done => {
    nock.disableNetConnect();

    assert.that(localStorage.getItem(storageKey)).is.undefined();
    localStorage.setItem(storageKey, JSON.stringify(sampleConfiguration));

    const configurationWatcher = new ConfigurationWatcher({ networkConnection });

    configurationWatcher.once('fetched', configuration => {
      assert.that(configuration).is.equalTo(sampleConfiguration);

      nock.enableNetConnect();
      configurationWatcher.destroy();
      done();
    });
  });

  test('should emit an error when configuration could not be requested from server or local storage.', done => {
    nock.disableNetConnect();

    const configurationWatcher = new ConfigurationWatcher({ networkConnection });

    configurationWatcher.once('error', err => {
      assert.that(err.message).is.equalTo('Failed to get configuration.');

      nock.enableNetConnect();
      configurationWatcher.destroy();
      done();
    });
  });

  suite('manual configuration', () => {
    test('should be preferred without requesting the online configuration.', done => {
      let configuration,
          fetchEmitted = 0;

      const requestConfiguration = nock('https://local.wolkenkit.io:9000').
        get('/v1/configuration.json').
        delay(100).
        reply(200, sampleConfiguration);

      const configurationWatcher = new ConfigurationWatcher({ networkConnection, configuration: sampleConfiguration });

      configurationWatcher.on('fetched', fetchedConfiguration => {
        fetchEmitted += 1;
        configuration = fetchedConfiguration;
      });

      setTimeout(() => {
        assert.that(fetchEmitted).is.equalTo(1);
        assert.that(requestConfiguration.isDone()).is.false();
        assert.that(configuration.writeModel.network).is.ofType('object');
        assert.that(configuration.writeModel.network.node).is.ofType('object');
        assert.that(configuration.readModel.lists).is.ofType('object');
        assert.that(configuration.readModel.lists.pings).is.ofType('object');

        nock.cleanAll();
        configurationWatcher.destroy();

        return done();
      }, 200);
    });
  });

  suite('offline', () => {
    test('should emit an \'outdated\' event when configuration has changed after the client goes online again.', done => {
      nock.disableNetConnect();

      const outdatedConfiguration = _.cloneDeep(sampleConfiguration);

      Reflect.deleteProperty(outdatedConfiguration.readModel.lists, 'pongs');
      localStorage.setItem(storageKey, JSON.stringify(outdatedConfiguration));

      const configurationWatcher = new ConfigurationWatcher({ networkConnection });

      configurationWatcher.once('fetched', () => {
        const requestUpdatedConfiguration = nock('https://local.wolkenkit.io:9000').
          get('/v1/configuration.json').
          delay(100).
          reply(200, sampleConfiguration);

        configurationWatcher.once('outdated', newConfiguration => {
          assert.that(newConfiguration.readModel.lists.pongs).is.ofType('object');
          assert.that(requestUpdatedConfiguration.isDone()).is.true();

          configurationWatcher.destroy();
          nock.cleanAll();
          done();
        });

        nock.enableNetConnect();

        networkConnection.emit('online');
      });
    });

    test('should not emit an \'outdated\' event when configuration has not been changed.', done => {
      nock.disableNetConnect();

      localStorage.setItem(storageKey, JSON.stringify(sampleConfiguration));

      const configurationWatcher = new ConfigurationWatcher({ networkConnection });

      configurationWatcher.once('fetched', () => {
        const requestUpdatedConfiguration = nock('https://local.wolkenkit.io:9000').
          get('/v1/configuration.json').
          delay(100).
          reply(200, sampleConfiguration);

        configurationWatcher.once('outdated', () => {
          done(new Error('Should never be called.'));
        });

        configurationWatcher.once('fetched', () => {
          assert.that(requestUpdatedConfiguration.isDone()).is.true();
          configurationWatcher.destroy();
          nock.cleanAll();
          done();
        });

        nock.enableNetConnect();

        networkConnection.emit('online');
      });
    });
  });
});
