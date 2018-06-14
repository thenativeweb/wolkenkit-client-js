'use strict';

const flatten = require('lodash/flatten'),
      parseDuration = require('parse-duration');

const errors = require('../errors');

const defaultTimeoutDuration = parseDuration('120s'),
      disabledTimeoutDuration = parseDuration('0s');

const CommandRunner = function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.command) {
    throw new Error('Command is missing.');
  }

  const { app, wire, command } = options;

  this.app = app;
  this.command = command;
  this.aggregate = app[command.context.name][command.aggregate.name];

  this.callbacks = {
    delivered() {},
    await() {},
    failed(err) {
      throw err;
    },
    timeout() {}
  };

  this.cancelEvents = undefined;
  this.callbacks.timeout.duration = disabledTimeoutDuration;

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as delivered, await, failed and timeout
  // to this instance.
  process.nextTick(() => {
    app.events.observe({
      where: {
        type: 'domain',
        metadata: { correlationId: this.command.metadata.correlationId }
      }
    }).failed(err => {
      this.clearEventsAndTimers();
      this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
    }).started(cancel => {
      this.cancelEvents = cancel;

      wire.sendCommand(command).then(() => {
        process.nextTick(() => {
          this.callbacks.delivered(command);

          this.callbacks.timeout.id = setTimeout(() => {
            this.clearEventsAndTimers();
            this.callbacks.timeout(command);
          }, this.callbacks.timeout.duration);
        });
      }).catch(err => {
        this.clearEventsAndTimers();
        this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
      });
    }).received(event => {
      this.handleEvent(event);
    });
  });
};

CommandRunner.prototype.fail = function (err, command) {
  if (!this.callbacks.failed) {
    return;
  }

  this.callbacks.failed(err, command);

  // Remove failed callback to avoid that it is being called twice for the same
  // command.
  this.callbacks.failed = undefined;
};

CommandRunner.prototype.handleEvent = function (event) {
  if (/Rejected$/.test(event.name) || /Failed$/.test(event.name)) {
    this.clearEventsAndTimers();
    this.fail(new errors.CommandRejected(event.data.reason), this.command);

    return;
  }

  if (this.callbacks.await[event.name]) {
    this.clearEventsAndTimers();
    this.callbacks.await[event.name](event, this.command);
  }
};

CommandRunner.prototype.clearEventsAndTimers = function () {
  clearTimeout(this.callbacks.timeout.id);
  if (this.cancelEvents) {
    this.cancelEvents();
  }
};

CommandRunner.prototype.delivered = function (callback) {
  this.callbacks.delivered = callback;

  return this;
};

CommandRunner.prototype.await = function (eventNames, callback) {
  if (this.callbacks.timeout.duration === 0) {
    this.callbacks.timeout.duration = defaultTimeoutDuration;
  }

  flatten([eventNames]).forEach(eventName => {
    this.callbacks.await[eventName] = callback;
  });

  return this;
};

CommandRunner.prototype.failed = function (callback) {
  if (this.callbacks.timeout.duration === 0) {
    this.callbacks.timeout.duration = defaultTimeoutDuration;
  }

  this.callbacks.failed = callback;

  return this;
};

CommandRunner.prototype.timeout = function (duration, callback) {
  this.callbacks.timeout = callback;
  this.callbacks.timeout.duration = parseDuration(duration);

  return this;
};

module.exports = CommandRunner;