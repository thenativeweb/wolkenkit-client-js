'use strict';

const assert = require('assertthat'),
      async = require('async'),
      request = require('superagent'),
      retry = require('retry'),
      uuid = require('uuidv4');

const env = require('../shared/env'),
      wolkenkit = require('../../src/wolkenkitClient');

const getTestsFor = function (testOptions) {
  if (!testOptions) {
    throw new Error('Options are missing.');
  }
  if (!testOptions.protocol) {
    throw new Error('Protocol is missing.');
  }

  const { protocol } = testOptions;

  suite(`${protocol} integration tests`, function () {
    this.timeout(10 * 1000);

    let plcr;

    const issueToken = function (options, callback) {
      if (!options) {
        throw new Error('Options are missing.');
      }
      if (!options.subject) {
        throw new Error('Subject is missing.');
      }

      request.
        post(`${env.REMOTE_URL}/issue-token`).
        send(options).
        end((err, res) => {
          if (err) {
            return callback(err);
          }
          if (res.status !== 200) {
            return callback(new Error(`Unexpected status code ${res.status}`));
          }
          if (!res.body.token) {
            return callback(new Error('Token is missing.'));
          }

          callback(null, res.body.token);
        });
    };

    suiteSetup(done => {
      wolkenkit.connect({ protocol, host: 'local.wolkenkit.io', port: 9000 }).
        then(app => {
          plcr = app;
          done();
        }).
        catch(done);
    });

    setup(done => {
      request.
        post(`${env.REMOTE_URL}/reset-mongo-db`).
        end((err, res) => {
          if (err) {
            return done(err);
          }
          if (res.status !== 200) {
            return done(new Error(`Unexpected status code ${res.status}`));
          }

          done(null);
        });
    });

    suite('commands and events', () => {
      test('throws an error when trying to subscribe to an unknown event.', done => {
        assert.that(() => {
          plcr.events.observe({
            where: { name: 'unknownEvent' }
          });
        }).is.throwing('Unknown event.');
        done();
      });

      test('sends a command and receives the corresponding events.', done => {
        let counter = 0;

        plcr.events.observe().
          failed(done).
          received((event, cancel) => {
            counter += 1;
            switch (counter) {
              case 1:
                assert.that(event.context.name).is.equalTo('planning');
                assert.that(event.aggregate.name).is.equalTo('peerGroup');
                assert.that(event.name).is.equalTo('transferredOwnership');
                break;
              case 2:
                assert.that(event.context.name).is.equalTo('planning');
                assert.that(event.aggregate.name).is.equalTo('peerGroup');
                assert.that(event.name).is.equalTo('started');
                assert.that(event.data.initiator).is.equalTo('John Doe');
                assert.that(event.data.destination).is.equalTo('Somewhere over the rainbow');
                break;
              case 3:
                assert.that(event.context.name).is.equalTo('planning');
                assert.that(event.aggregate.name).is.equalTo('peerGroup');
                assert.that(event.name).is.equalTo('joined');
                assert.that(event.data.participant).is.equalTo('John Doe');
                cancel();

                return done();
              default:
                throw new Error('Invalid operation.');
            }
          });

        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done);
      });

      test('sends a command and calls the delivered callback.', done => {
        plcr.events.observe().
          failed(done).
          received((event, cancel) => {
            if (event.name !== 'joined') {
              return;
            }
            cancel();
            done();
          });

        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done).
          delivered(command => {
            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('start');
            assert.that(command.data).is.equalTo({
              initiator: 'John Doe',
              destination: 'Somewhere over the rainbow'
            });
          });
      });

      test('sends a command and receives an error event if the command was rejected.', done => {
        plcr.events.observe({
          where: {
            name: 'joinRejected'
          }
        }).
          failed(done).
          received((event, cancel) => {
            assert.that(event.context.name).is.equalTo('planning');
            assert.that(event.aggregate.name).is.equalTo('peerGroup');
            assert.that(event.name).is.equalTo('joinRejected');
            assert.that(event.data.reason).is.equalTo('Peer group does not exist.');
            cancel();
            done();
          });

        plcr.planning.peerGroup().join({
          participant: 'Jane Doe'
        }).
          failed(() => {
            // We don't want to get an error here, as we handle the rejected event
            // already in the events route above.
          });
      });

      test('sends a command and calls the failed callback if the command was rejected.', done => {
        plcr.planning.peerGroup().join({
          participant: 'Jane Doe'
        }).
          failed((err, command) => {
            assert.that(err).is.not.null();
            assert.that(err.message).is.equalTo('Peer group does not exist.');

            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('join');
            assert.that(command.data).is.equalTo({
              participant: 'Jane Doe'
            });

            done();
          });
      });

      test('does not receive rejected events from other users.', done => {
        const oldGetToken = plcr.auth.getToken;

        issueToken({ subject: uuid() }, (errToken, token) => {
          if (errToken) {
            return done(errToken);
          }

          // Observe events as public user ...
          plcr.events.observe().
            failed(done).
            received(() => {
              done(new Error('Invalid operation.'));
            }).
            started(cancel => {
              // ... but send commands as authenticated user.
              plcr.auth.getToken = function () {
                return token;
              };

              // If no event was received for one second, cancel.
              setTimeout(() => {
                cancel();
                plcr.auth.getToken = oldGetToken;
                done();
              }, 1 * 1000);

              plcr.planning.peerGroup().joinAndReject().
                failed(() => {
                  // Intentionally left blank.
                });
            });
        });
      });

      test('sends a command and receives an error event if the command handler failed.', done => {
        plcr.events.observe().
          failed(done).
          received((event, cancel) => {
            assert.that(event.context.name).is.equalTo('planning');
            assert.that(event.aggregate.name).is.equalTo('peerGroup');
            assert.that(event.name).is.equalTo('joinAndFailFailed');
            assert.that(event.data.reason).is.equalTo('Something, somewhere went horribly wrong...');
            cancel();
            done();
          });

        plcr.planning.peerGroup().joinAndFail().
          failed(() => {
            // We don't want to get an error here, as we handle the rejected event
            // already in the events route above.
          });
      });

      test('sends a command and calls the failed callback if the command handler failed.', done => {
        plcr.planning.peerGroup().joinAndFail().
          failed((err, command) => {
            assert.that(err).is.not.null();
            assert.that(err.message).is.equalTo('Something, somewhere went horribly wrong...');

            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('joinAndFail');
            assert.that(command.data).is.equalTo({});

            done();
          });
      });

      test('does not receive failed events from other users.', done => {
        const oldGetToken = plcr.auth.getToken;

        issueToken({ subject: uuid() }, (errToken, token) => {
          if (errToken) {
            return done(errToken);
          }

          // Observe events as public user ...
          plcr.events.observe().
            failed(done).
            received(() => {
              done(new Error('Invalid operation.'));
            }).
            started(cancel => {
              // ... but send commands as authenticated user.
              plcr.auth.getToken = function () {
                return token;
              };

              // If no event was received for one second, cancel.
              setTimeout(() => {
                cancel();
                plcr.auth.getToken = oldGetToken;
                done();
              }, 1 * 1000);

              plcr.planning.peerGroup().joinAndFail().
                failed(() => {
                  // Intentionally left blank.
                });
            });
        });
      });

      test('sends a command and awaits an event.', done => {
        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done).
          await('joined', (event, command) => {
            assert.that(event.context.name).is.equalTo('planning');
            assert.that(event.aggregate.name).is.equalTo('peerGroup');
            assert.that(event.name).is.equalTo('joined');
            assert.that(event.data.participant).is.equalTo('John Doe');

            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('start');
            assert.that(command.data).is.equalTo({
              initiator: 'John Doe',
              destination: 'Somewhere over the rainbow'
            });
            done();
          });
      });

      test('sends a command and awaits multiple events.', done => {
        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done).
          await([ 'joined', 'left' ], (event, command) => {
            assert.that(event.context.name).is.equalTo('planning');
            assert.that(event.aggregate.name).is.equalTo('peerGroup');
            assert.that(event.name).is.equalTo('joined');
            assert.that(event.data.participant).is.equalTo('John Doe');

            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('start');
            assert.that(command.data).is.equalTo({
              initiator: 'John Doe',
              destination: 'Somewhere over the rainbow'
            });
            done();
          });
      });

      test('sends a command and times out if the event does not arrive in time.', done => {
        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done).
          await('left', () => {
            done(new Error('This event should never occur.'));
          }).
          timeout('1s', command => {
            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('start');
            assert.that(command.data).is.equalTo({
              initiator: 'John Doe',
              destination: 'Somewhere over the rainbow'
            });
            done();
          });
      });
    });

    suite('events', () => {
      test('retrieves events.', done => {
        plcr.events.observe().
          failed(done).
          received((event, cancel) => {
            if (event.name === 'started') {
              assert.that(event.data).is.equalTo({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              });
            }
            if (event.name === 'joined') {
              assert.that(event.data).is.equalTo({
                participant: 'John Doe'
              });
              cancel();

              return done();
            }
          });

        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done);
      });

      test('retrieves filtered events.', done => {
        plcr.events.observe({
          where: { name: 'joined' }
        }).
          failed(done).
          received((event, cancel) => {
            if (event.name !== 'joined') {
              return done(new Error('Invalid operation.'));
            }

            cancel();
            done();
          });

        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed(done);
      });

      suite('authorization', () => {
        test('does not receive authenticated events for public users.', done => {
          const oldGetToken = plcr.auth.getToken;

          issueToken({ subject: uuid() }, (errToken, token) => {
            if (errToken) {
              return done(errToken);
            }

            // Observe events as public user ...
            plcr.events.observe().
              failed(done).
              received((event, cancel) => {
                if (event.name === 'publishedForAuthenticated') {
                  return done(new Error('Invalid operation.'));
                }
                if (event.name === 'publishedForPublic') {
                  plcr.auth.getToken = oldGetToken;
                  cancel();

                  return done();
                }
              }).
              started(() => {
                // ... but send commands as authenticated user.
                plcr.auth.getToken = function () {
                  return token;
                };

                plcr.planning.peerGroup().publishForAuthenticated().
                  failed(done).
                  delivered(() => {
                    plcr.planning.peerGroup().publishForPublic().
                      failed(done);
                  });
              });
          });
        });

        test('receives authenticated events for authenticated users.', done => {
          const oldGetToken = plcr.auth.getToken;

          const ownerId = uuid();
          const otherOwnerId = uuid();

          issueToken({ subject: ownerId, payload: { 'can-impersonate': true }}, (errToken, token) => {
            if (errToken) {
              return done(errToken);
            }

            plcr.auth.getToken = function () {
              return token;
            };

            // Observe events using ownerId ...
            plcr.events.observe().
              failed(done).
              received((event, cancel) => {
                assert.that(event.name).is.equalTo('publishedForAuthenticated');
                plcr.auth.getToken = oldGetToken;
                cancel();
                done();
              }).
              started(() => {
                // but send command using otherOwnerId. This way we make sure that
                // we receive the event because we are authenticated, and not by
                // accident because we are the owner of the aggregate.
                plcr.planning.peerGroup().publishForAuthenticated({}, {
                  asUser: otherOwnerId
                }).
                  failed(done);
              });
          });
        });

        test('does not receive owner events for authenticated users.', done => {
          const oldGetToken = plcr.auth.getToken;

          const ownerId = uuid();
          const otherOwnerId = uuid();

          issueToken({ subject: ownerId, payload: { 'can-impersonate': true }}, (errToken, token) => {
            if (errToken) {
              return done(errToken);
            }

            plcr.auth.getToken = function () {
              return token;
            };

            // Observe events using ownerId ...
            plcr.events.observe().
              failed(done).
              received((event, cancel) => {
                if (event.name === 'publishedForOwner') {
                  return done(new Error('Invalid operation.'));
                }
                if (event.name === 'publishedForPublic') {
                  plcr.auth.getToken = oldGetToken;
                  cancel();

                  return done();
                }
              }).
              started(() => {
                // ... but send commands using otherOwnerId.
                plcr.planning.peerGroup().publishForOwner({}, { asUser: otherOwnerId }).
                  failed(done).
                  delivered(() => {
                    plcr.planning.peerGroup().publishForPublic().
                      failed(done);
                  });
              });
          });
        });
      });
    });

    suite('lists', () => {
      suite('read', () => {
        test('retrieves a list.', done => {
          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', event => {
                  callback(null, event);
                });
            },
            (event, callback) => {
              plcr.planning.peerGroup(event.aggregate.id).join({
                participant: 'Jane Doe'
              }).
                failed(callback).
                await('joined', () => {
                  callback(null);
                });
            },
            callback => {
              plcr.lists.peerGroups.read().
                failed(callback).
                finished(peerGroups => {
                  assert.that(peerGroups.length).is.equalTo(1);
                  assert.that(peerGroups[0].initiator).is.equalTo('John Doe');
                  assert.that(peerGroups[0].destination).is.equalTo('Somewhere over the rainbow');
                  assert.that(peerGroups[0].participants).is.equalTo([ 'John Doe', 'Jane Doe' ]);
                  callback(null);
                });
            }
          ], done);
        });

        test('retrieves a filtered list.', done => {
          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', event => {
                  callback(null, event);
                });
            },
            (event, callback) => {
              plcr.planning.peerGroup(event.aggregate.id).join({
                participant: 'Jane Doe'
              }).
                failed(callback).
                await('joined', () => {
                  callback(null);
                });
            },
            callback => {
              plcr.lists.peerGroups.read({
                where: { initiator: 'Jane Doe' }
              }).
                failed(callback).
                finished(peerGroups => {
                  assert.that(peerGroups.length).is.equalTo(0);
                  callback(null);
                });
            }
          ], done);
        });

        test('retrieves a sorted list.', done => {
          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', () => callback(null));
            },
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'Jane Doe',
                destination: 'Oz'
              }).
                failed(callback).
                await('joined', () => callback(null));
            },
            callback => {
              plcr.lists.peerGroups.read({
                orderBy: { initiator: 'ascending' }
              }).
                failed(callback).
                finished(peerGroups => {
                  assert.that(peerGroups.length).is.equalTo(2);
                  assert.that(peerGroups[0].initiator).is.equalTo('Jane Doe');
                  assert.that(peerGroups[1].initiator).is.equalTo('John Doe');
                  callback(null);
                });
            }
          ], done);
        });
      });

      suite('readOne', () => {
        test('retrieves a list item.', done => {
          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', () => {
                  callback(null);
                });
            },
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'Jane Doe',
                destination: 'Oz'
              }).
                failed(callback).
                await('joined', () => {
                  callback(null);
                });
            },
            callback => {
              plcr.lists.peerGroups.readOne({
                where: { initiator: 'Jane Doe' }
              }).
                failed(callback).
                finished(peerGroup => {
                  assert.that(peerGroup.initiator).is.equalTo('Jane Doe');
                  assert.that(peerGroup.destination).is.equalTo('Oz');
                  assert.that(peerGroup.participants).is.equalTo([ 'Jane Doe' ]);
                  callback(null);
                });
            }
          ], done);
        });

        test('calls the failed callback if no item could be found.', done => {
          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', () => {
                  callback(null);
                });
            },
            callback => {
              plcr.lists.peerGroups.readOne({
                where: { initiator: 'Jane Doe' }
              }).
                failed(err => {
                  assert.that(err).is.not.null();
                  assert.that(err.message).is.equalTo('Item not found.');
                  callback();
                }).
                finished(() => callback(new Error('Invalid operation.')));
            }
          ], done);
        });
      });

      suite('readAndObserve', () => {
        test('retrieves a list and updates it continuously.', done => {
          async.series([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'Jenny Doe',
                destination: 'Neverland'
              }).
                failed(callback).
                await('joined', () => callback(null));
            },
            callback => {
              let list;

              plcr.lists.peerGroups.readAndObserve().
                failed(done).
                started((peerGroups, cancel) => {
                  assert.that(peerGroups).is.equalTo([]);
                  assert.that(cancel).is.ofType('function');
                  list = peerGroups;
                }).
                updated((peerGroups, cancel) => {
                  assert.that(peerGroups).is.sameAs(list);
                  try {
                    assert.that(peerGroups.length).is.equalTo(2);
                    assert.that(peerGroups[0].initiator).is.equalTo('Jenny Doe');
                    assert.that(peerGroups[0].destination).is.equalTo('Neverland');
                    assert.that(peerGroups[0].participants).is.equalTo([ 'Jenny Doe' ]);
                    assert.that(peerGroups[1].initiator).is.equalTo('John Doe');
                    assert.that(peerGroups[1].destination).is.equalTo('Somewhere over the rainbow');
                    assert.that(peerGroups[1].participants).is.equalTo([ 'John Doe', 'Jane Doe' ]);
                    cancel();

                    return done();
                  } catch (ex) {
                    // Continue and wait for the next update event...
                  }
                });

              async.waterfall([
                callbackWaterfall => {
                  plcr.planning.peerGroup().start({
                    initiator: 'John Doe',
                    destination: 'Somewhere over the rainbow'
                  }).
                    failed(callbackWaterfall).
                    await('joined', event => callbackWaterfall(null, event));
                },
                (event, callbackWaterfall) => {
                  plcr.planning.peerGroup(event.aggregate.id).join({
                    participant: 'Jane Doe'
                  }).
                    failed(callbackWaterfall).
                    await('joined', () => callbackWaterfall());
                }
              ], callback);
            }
          ]);
        });

        test('retrieves a filtered list and updates it continuously.', done => {
          plcr.lists.peerGroups.readAndObserve({
            where: { initiator: 'Jane Doe' }
          }).
            failed(done).
            updated((peerGroups, cancel) => {
              try {
                assert.that(peerGroups.length).is.equalTo(1);
                assert.that(peerGroups[0].initiator).is.equalTo('Jane Doe');
                assert.that(peerGroups[0].destination).is.equalTo('Oz');
                assert.that(peerGroups[0].participants).is.equalTo([ 'Jane Doe' ]);
                cancel();

                return done();
              } catch (ex) {
                // Continue and wait for the next update event...
              }
            });

          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', () => callback(null));
            },
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'Jane Doe',
                destination: 'Oz'
              }).
                failed(callback).
                await('joined', callback);
            }
          ], () => {
            // Intentionally left blank.
          });
        });

        test('retrieves a sorted list and updates it continuously.', done => {
          plcr.lists.peerGroups.readAndObserve({
            orderBy: { initiator: 'ascending' }
          }).
            failed(done).
            updated((peerGroups, cancel) => {
              try {
                assert.that(peerGroups.length).is.equalTo(2);
                assert.that(peerGroups[0].initiator).is.equalTo('Jane Doe');
                assert.that(peerGroups[0].destination).is.equalTo('Oz');
                assert.that(peerGroups[0].participants).is.equalTo([ 'Jane Doe' ]);
                assert.that(peerGroups[1].initiator).is.equalTo('John Doe');
                assert.that(peerGroups[1].destination).is.equalTo('Somewhere over the rainbow');
                assert.that(peerGroups[1].participants).is.equalTo([ 'John Doe' ]);
                cancel();

                return done();
              } catch (ex) {
                // Continue and wait for the next update event...
              }
            });

          async.waterfall([
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'John Doe',
                destination: 'Somewhere over the rainbow'
              }).
                failed(callback).
                await('joined', () => callback(null));
            },
            callback => {
              plcr.planning.peerGroup().start({
                initiator: 'Jane Doe',
                destination: 'Oz'
              }).
                failed(callback).
                await('joined', callback);
            }
          ], () => {
            // Intentionally left blank.
          });
        });
      });
    });

    suite('flows', () => {
      test('sends a command and awaits an event caused by a flow.', done => {
        plcr.planning.peerGroup().triggerFlow().
          failed(done).
          await('notifiedFromFlow', (event, command) => {
            assert.that(event.context.name).is.equalTo('planning');
            assert.that(event.aggregate.name).is.equalTo('peerGroup');
            assert.that(event.name).is.equalTo('notifiedFromFlow');
            assert.that(event.metadata.correlationId).is.equalTo(command.metadata.correlationId);
            done();
          });
      });
    });

    suite('application events', () => {
      test('logs the user in when the server denies access.', done => {
        const oldGetToken = plcr.auth.getToken,
              oldLogin = plcr.auth.login;

        plcr.auth.getToken = function () {
          return 'invalid-token';
        };

        plcr.auth.login = function () {
          plcr.auth.getToken = oldGetToken;
          plcr.auth.login = oldLogin;
          done();
        };

        // This is currently a workaround, since we need to trigger some kind of
        // HTTP request to make sure that some network traffic is happening.
        // This should be done in another way in the future, as this basically
        // has nothing to do with reading lists.
        plcr.lists.peerGroups.read().
          failed(() => {
            // Intentionally left blank.
          }).
          finished(() => {
            // Intentionally left blank.
          });
      });
    });

    suite('offline', () => {
      suiteTeardown(done => {
        request.
          post(`${env.REMOTE_URL}/start-broker`).
          end((err, res) => {
            if (err) {
              return done(err);
            }
            if (res.status !== 200) {
              return done(new Error(`Unexpected status code ${res.status}`));
            }

            const operation = retry.operation();

            operation.attempt(() => {
              request.get(`https://local.wolkenkit.io:9000/v1/ping?_=${Date.now()}`).end(errPing => {
                if (operation.retry(errPing)) {
                  return;
                }

                if (errPing) {
                  return done(operation.mainError());
                }

                done(null);
              });
            });
          });
      });

      // This test *has* to come first in the offline suite, as it disconnects
      // the application from the broker. The suite only works when this test
      // runs at all, and if it runs first.
      test('raises a disconnected event if the connection is lost.', done => {
        plcr.once('disconnected', () => {
          done();
        });

        request.
          post(`${env.REMOTE_URL}/stop-broker`).
          end((err, res) => {
            if (err) {
              return done(err);
            }
            if (res.status !== 200) {
              return done(new Error(`Unexpected status code ${res.status}`));
            }
          });
      });

      test('sends a command and calls the failed callback if the command could not be delivered.', done => {
        plcr.planning.peerGroup().start({
          initiator: 'John Doe',
          destination: 'Somewhere over the rainbow'
        }).
          failed((err, command) => {
            assert.that(err).is.not.null();
            assert.that(err.message).is.equalTo('Failed to deliver command.');

            assert.that(command.context.name).is.equalTo('planning');
            assert.that(command.aggregate.name).is.equalTo('peerGroup');
            assert.that(command.aggregate.id).is.ofType('string');
            assert.that(command.name).is.equalTo('start');
            assert.that(command.data).is.equalTo({
              initiator: 'John Doe',
              destination: 'Somewhere over the rainbow'
            });

            done();
          });
      });
    });
  });
};

module.exports = getTestsFor;
