'use strict';

const assert = require('assertthat');

const FakeWire = require('../../../shared/FakeWire'),
      ListStore = require('../../../../src/modelStoreBroker/ListStore');

suite('ListStore', () => {
  test('is a function.', done => {
    assert.that(ListStore).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ListStore();
      /* eslint-enable no-new */
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if wire is missing.', done => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ListStore({});
      /* eslint-enable no-new */
    }).is.throwing('Wire is missing.');
    done();
  });

  suite('initialize', () => {
    let listStore;

    setup(() => {
      listStore = new ListStore({ wire: {}});
    });

    test('is a function.', done => {
      assert.that(listStore.initialize).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        listStore.initialize();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if callback is missing.', done => {
      assert.that(() => {
        listStore.initialize({});
      }).is.throwing('Callback is missing.');
      done();
    });
  });

  suite('event handlers', () => {
    let listStore,
        wire;

    setup(() => {
      wire = new FakeWire({});
      listStore = new ListStore({ wire });
    });

    suite('read', () => {
      test('is a function.', done => {
        assert.that(listStore.read).is.ofType('function');
        done();
      });

      test('throws an error if options are missing.', done => {
        assert.that(() => {
          listStore.read();
        }).is.throwing('Options are missing.');
        done();
      });

      test('throws an error if model name is missing.', done => {
        assert.that(() => {
          listStore.read({});
        }).is.throwing('Model name is missing.');
        done();
      });

      test('throws an error if query is missing.', done => {
        assert.that(() => {
          listStore.read({ modelName: 'foo' });
        }).is.throwing('Query is missing.');
        done();
      });

      test('throws an error if callback is missing.', done => {
        assert.that(() => {
          listStore.read({ modelName: 'foo', query: {}});
        }).is.throwing('Callback is missing.');
        done();
      });

      test('requests the given model from the cloud.', done => {
        wire.readModel = function (options) {
          assert.that(options.modelType).is.equalTo('lists');
          assert.that(options.modelName).is.equalTo('peerGroups');
          assert.that(options.query).is.equalTo({
            where: { foo: 'bar' }
          });

          done();
        };

        listStore.read({
          modelName: 'peerGroups',
          query: {
            where: { foo: 'bar' }
          }
        }, () => {
          // Intentionally left blank.
        });
      });
    });
  });
});
