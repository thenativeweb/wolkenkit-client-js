'use strict';

var assign = require('lodash/assign');

var isEventIn = require('./isEventIn');

var EventsAggregate = function EventsAggregate(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.wire) {
    throw new Error('Wire is missing.');
  }

  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  this.wire = options.wire;
  this.writeModel = options.writeModel;
};

EventsAggregate.prototype.observe = function (options) {
  var wire = this.wire,
      writeModel = this.writeModel;
  options = options || {};
  options.where = assign({}, {
    type: 'domain'
  }, options.where);

  if (!isEventIn(writeModel, options.where)) {
    throw new Error('Unknown event.');
  }

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    started: function started() {},
    received: function received() {}
  }; // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.

  process.nextTick(function () {
    var events = wire.subscribeToEvents(options.where);
    var onData, onEnd, onError, onStart;

    var cancel = function cancel() {
      events.cancel();
    };

    var unsubscribe = function unsubscribe() {
      events.stream.removeListener('start', onStart);
      events.stream.removeListener('data', onData);
      events.stream.removeListener('end', onEnd);
      events.stream.removeListener('error', onError);
    };

    onStart = function onStart() {
      callbacks.started(cancel);
    };

    onData = function onData(event) {
      callbacks.received(event, cancel);
    };

    onEnd = function onEnd() {
      unsubscribe();
    };

    onError = function onError(err) {
      cancel();
      unsubscribe();
      callbacks.failed(err);
    };

    events.stream.on('start', onStart);
    events.stream.on('data', onData);
    events.stream.on('end', onEnd);
    events.stream.on('error', onError);
  });
  return {
    failed: function failed(callback) {
      callbacks.failed = callback;
      return this;
    },
    started: function started(callback) {
      callbacks.started = callback;
      return this;
    },
    received: function received(callback) {
      callbacks.received = callback;
      return this;
    }
  };
};

module.exports = EventsAggregate;