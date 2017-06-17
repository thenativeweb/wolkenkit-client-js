'use strict';

const stream = require('stream');

const assert = require('assertthat');

const buildEvent = require('./buildEvent'),
      ModelStore = require('../../../lib/ModelStore');

const PassThrough = stream.PassThrough;

suite('ModelStore', () => {
  test('is a function.', done => {
    assert.that(ModelStore).is.ofType('function');
    done();
  });

  suite('initialize', () => {
    let modelStore;

    setup(() => {
      modelStore = new ModelStore();
    });

    test('is a function.', done => {
      assert.that(modelStore.initialize).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        modelStore.initialize();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if stores are missing.', done => {
      assert.that(() => {
        modelStore.initialize({});
      }).is.throwing('Stores are missing.');
      done();
    });

    test('throws an error if callback is missing.', done => {
      assert.that(() => {
        modelStore.initialize({
          stores: {}
        });
      }).is.throwing('Callback is missing.');
      done();
    });

    test('initializes the given stores.', done => {
      let isListStoreInitialized = false,
          isTreeStoreInitialized = false;

      const listStore = {
        initialize (options, callback) {
          isListStoreInitialized = true;
          callback(null);
        }
      };
      const treeStore = {
        initialize (options, callback) {
          isTreeStoreInitialized = true;
          callback(null);
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore,
          trees: treeStore
        }
      }, err => {
        assert.that(err).is.null();
        assert.that(isListStoreInitialized).is.true();
        assert.that(isTreeStoreInitialized).is.true();
        done();
      });
    });

    test('returns an error if a store can not be initialized.', done => {
      const listStore = {
        initialize (options, callback) {
          callback(new Error('Error from list store.'));
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore
        }
      }, err => {
        assert.that(err).is.not.null();
        assert.that(err.message).is.equalTo('Error from list store.');
        done();
      });
    });
  });

  suite('processEvents', () => {
    let modelStore;

    setup(() => {
      modelStore = new ModelStore();
    });

    test('is a function.', done => {
      assert.that(modelStore.processEvents).is.ofType('function');
      done();
    });

    test('throws an error if events are missing.', done => {
      assert.that(() => {
        modelStore.processEvents();
      }).is.throwing('Events are missing.');
      done();
    });

    test('throws an error if callback is missing.', done => {
      assert.that(() => {
        modelStore.processEvents([]);
      }).is.throwing('Callback is missing.');
      done();
    });

    test('does not call processEvents of any store if no events are given.', done => {
      const listStore = {
        initialize (options, callback) {
          callback(null);
        },
        processEvents (events, callback) {
          callback(new Error('Error from list store.'));
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore
        }
      }, err => {
        assert.that(err).is.null();

        modelStore.processEvents([], errProcessEvents => {
          assert.that(errProcessEvents).is.null();
          done();
        });
      });
    });

    test('handles store specific events in each store.', done => {
      const listStore = {
        items: [],
        initialize (options, callback) {
          callback(null);
        },
        added (options, callback) {
          this.items.push(options.payload);
          callback(null);
        }
      };
      const treeStore = {
        items: [],
        initialize (options, callback) {
          callback(null);
        },
        added (options, callback) {
          this.items.push(options.payload);
          callback(null);
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore,
          trees: treeStore
        }
      }, err => {
        assert.that(err).is.null();

        const events = [
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 1 }}),
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 2 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 3 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 4 }})
        ];

        modelStore.processEvents(events, errProcessEvents => {
          assert.that(errProcessEvents).is.null();
          assert.that(listStore.items).is.equalTo([
            { value: 1 },
            { value: 2 }
          ]);
          assert.that(treeStore.items).is.equalTo([
            { value: 3 },
            { value: 4 }
          ]);
          done();
        });
      });
    });

    test('ignores events for non-existent stores.', done => {
      const listStore = {
        items: [],
        initialize (options, callback) {
          callback(null);
        },
        added (options, callback) {
          this.items.push(options.payload);
          callback(null);
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore
        }
      }, err => {
        assert.that(err).is.null();

        const events = [
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 1 }}),
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 2 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 3 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 4 }})
        ];

        modelStore.processEvents(events, errProcessEvents => {
          assert.that(errProcessEvents).is.null();
          assert.that(listStore.items).is.equalTo([
            { value: 1 },
            { value: 2 }
          ]);
          done();
        });
      });
    });

    test('returns an error if a store fails.', done => {
      const listStore = {
        items: [],
        initialize (options, callback) {
          callback(null);
        },
        added (options, callback) {
          this.items.push(options.payload);
          callback(null);
        }
      };
      const treeStore = {
        initialize (options, callback) {
          callback(null);
        },
        added (options, callback) {
          callback(new Error('Error from tree store.'));
        }
      };

      modelStore.initialize({
        stores: {
          lists: listStore,
          trees: treeStore
        }
      }, err => {
        assert.that(err).is.null();

        const events = [
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 1 }}),
          buildEvent('lists', 'peerGroups', 'added', { payload: { value: 2 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 3 }}),
          buildEvent('trees', 'peerGroups', 'added', { payload: { value: 4 }})
        ];

        modelStore.processEvents(events, errProcessEvents => {
          assert.that(errProcessEvents).is.not.null();
          assert.that(errProcessEvents.message).is.equalTo('Error from tree store.');
          done();
        });
      });
    });
  });

  suite('read', () => {
    let modelStore;

    setup(() => {
      modelStore = new ModelStore();
    });

    test('is a function.', done => {
      assert.that(modelStore.read).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        modelStore.read();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if model type is missing.', done => {
      assert.that(() => {
        modelStore.read({});
      }).is.throwing('Model type is missing.');
      done();
    });

    test('throws an error if model name is missing.', done => {
      assert.that(() => {
        modelStore.read({ modelType: 'lists' });
      }).is.throwing('Model name is missing.');
      done();
    });

    test('throws an error if callback is missing.', done => {
      assert.that(() => {
        modelStore.read({ modelType: 'lists', modelName: 'peerGroups' });
      }).is.throwing('Callback is missing.');
      done();
    });

    test('calls read on the appropriate store.', done => {
      const listStore = {
        options: undefined,
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          this.options = options;
          callback(null, 'this should be a stream');
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.read({
          modelType: 'lists',
          modelName: 'peerGroups',
          query: {
            where: { foo: 'bar' }
          }
        }, (errRead, peerGroups) => {
          assert.that(errRead).is.null();
          assert.that(peerGroups).is.equalTo('this should be a stream');
          assert.that(listStore.options).is.equalTo({
            modelType: 'lists',
            modelName: 'peerGroups',
            query: {
              where: { foo: 'bar' }
            }
          });
          done();
        });
      });
    });

    test('sets a default query if no query is given.', done => {
      const listStore = {
        options: undefined,
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          this.options = options;
          callback(null, 'this should be a stream');
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.read({ modelType: 'lists', modelName: 'peerGroups' }, errRead => {
          assert.that(errRead).is.null();
          assert.that(listStore.options.query).is.equalTo({});
          done();
        });
      });
    });

    test('forwards errors from the store.', done => {
      const listStore = {
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          callback(new Error('Error from list store.'));
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.read({ modelType: 'lists', modelName: 'peerGroups' }, errRead => {
          assert.that(errRead).is.not.null();
          assert.that(errRead.message).is.equalTo('Error from list store.');
          done();
        });
      });
    });
  });

  suite('readOne', () => {
    let modelStore;

    setup(() => {
      modelStore = new ModelStore();
    });

    test('is a function.', done => {
      assert.that(modelStore.readOne).is.ofType('function');
      done();
    });

    test('throws an error if options are missing.', done => {
      assert.that(() => {
        modelStore.readOne();
      }).is.throwing('Options are missing.');
      done();
    });

    test('throws an error if model type is missing.', done => {
      assert.that(() => {
        modelStore.readOne({});
      }).is.throwing('Model type is missing.');
      done();
    });

    test('throws an error if model name is missing.', done => {
      assert.that(() => {
        modelStore.readOne({ modelType: 'lists' });
      }).is.throwing('Model name is missing.');
      done();
    });

    test('throws an error if query is missing.', done => {
      assert.that(() => {
        modelStore.readOne({ modelType: 'lists', modelName: 'peerGroups' });
      }).is.throwing('Query is missing.');
      done();
    });

    test('throws an error if where is missing.', done => {
      assert.that(() => {
        modelStore.readOne({ modelType: 'lists', modelName: 'peerGroups', query: {}});
      }).is.throwing('Where is missing.');
      done();
    });

    test('throws an error if callback is missing.', done => {
      assert.that(() => {
        modelStore.readOne({ modelType: 'lists', modelName: 'peerGroups', query: { where: {}}});
      }).is.throwing('Callback is missing.');
      done();
    });

    test('returns the first found item.', done => {
      const listStore = {
        options: undefined,
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          this.options = options;

          const passThrough = new PassThrough({ objectMode: true });

          passThrough.write('this should be an item');
          passThrough.write('this is another item');
          passThrough.end();

          callback(null, { stream: passThrough, cancel () {} });
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.readOne({
          modelType: 'lists',
          modelName: 'peerGroups',
          query: { where: { foo: 'bar' }}
        }, (errRead, item) => {
          assert.that(errRead).is.null();
          assert.that(item).is.equalTo('this should be an item');
          assert.that(listStore.options).is.equalTo({
            modelType: 'lists',
            modelName: 'peerGroups',
            query: {
              where: { foo: 'bar' },
              take: 1
            }
          });
          done();
        });
      });
    });

    test('returns an error if no item matches the query.', done => {
      const listStore = {
        options: undefined,
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          this.options = options;

          const passThrough = new PassThrough();

          passThrough.end();

          callback(null, { stream: passThrough, cancel () {} });
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.readOne({
          modelType: 'lists',
          modelName: 'peerGroups',
          query: { where: { foo: 'bar' }}
        }, errRead => {
          assert.that(errRead).is.not.null();
          assert.that(errRead.message).is.equalTo('Item not found.');
          done();
        });
      });
    });

    test('forwards errors from the store.', done => {
      const listStore = {
        initialize (options, callback) {
          callback(null);
        },
        read (options, callback) {
          callback(new Error('Error from list store.'));
        }
      };

      modelStore.initialize({
        application: 'foo',
        readModel: {},
        stores: {
          lists: listStore
        }
      }, errInitialize => {
        assert.that(errInitialize).is.null();

        modelStore.readOne({
          modelType: 'lists',
          modelName: 'peerGroups',
          query: {
            where: { foo: 'bar' }
          }
        }, errRead => {
          assert.that(errRead).is.not.null();
          assert.that(errRead.message).is.equalTo('Error from list store.');
          done();
        });
      });
    });
  });
});
