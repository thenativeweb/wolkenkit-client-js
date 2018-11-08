'use strict';

var flatten = require('lodash/flatten'),
    parseDuration = require('parse-duration');

var errors = require('../errors');

var defaultTimeoutDuration = parseDuration('120s'),
    disabledTimeoutDuration = parseDuration('0s');

var CommandRunner = function CommandRunner(options) {
  var _this = this;

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

  var app = options.app,
      wire = options.wire,
      command = options.command;
  this.app = app;
  this.command = command;
  this.aggregate = app[command.context.name][command.aggregate.name];
  this.callbacks = {
    delivered: function delivered() {},
    await: function _await() {},
    failed: function failed(err) {
      throw err;
    },
    timeout: function timeout() {}
  };
  this.cancelEvents = undefined;
  this.callbacks.timeout.duration = disabledTimeoutDuration; // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as delivered, await, failed and timeout
  // to this instance.

  process.nextTick(function () {
    app.events.observe({
      where: {
        type: 'domain',
        metadata: {
          correlationId: _this.command.metadata.correlationId
        }
      }
    }).failed(function (err) {
      _this.clearEventsAndTimers();

      _this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
    }).started(function (cancel) {
      _this.cancelEvents = cancel;
      wire.sendCommand(command).then(function () {
        process.nextTick(function () {
          _this.callbacks.delivered(command);

          _this.callbacks.timeout.id = setTimeout(function () {
            _this.clearEventsAndTimers();

            _this.callbacks.timeout(command);
          }, _this.callbacks.timeout.duration);
        });
      }).catch(function (err) {
        _this.clearEventsAndTimers();

        _this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
      });
    }).received(function (event) {
      _this.handleEvent(event);
    });
  });
};

CommandRunner.prototype.fail = function (err, command) {
  if (!this.callbacks.failed) {
    return;
  }

  this.callbacks.failed(err, command); // Remove failed callback to avoid that it is being called twice for the same
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
  var _this2 = this;

  if (this.callbacks.timeout.duration === 0) {
    this.callbacks.timeout.duration = defaultTimeoutDuration;
  }

  flatten([eventNames]).forEach(function (eventName) {
    _this2.callbacks.await[eventName] = callback;
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