'use strict';

const assign = require('lodash/assign');

const isEventIn = require('./isEventIn');

const EventsAggregate = function (options) {
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
  const { wire, writeModel } = this;

  options = options || {};
  options.where = assign({}, { type: 'domain' }, options.where);

  if (!isEventIn(writeModel, options.where)) {
    throw new Error('Unknown event.');
  }

  const callbacks = {
    failed(err) {
      throw err;
    },
    started() {},
    received() {}
  };

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.
  process.nextTick(() => {
    const events = wire.subscribeToEvents(options.where);

    let onData, onEnd, onError, onStart;

    const cancel = function () {
      events.cancel();
    };

    const unsubscribe = function () {
      events.stream.removeListener('start', onStart);
      events.stream.removeListener('data', onData);
      events.stream.removeListener('end', onEnd);
      events.stream.removeListener('error', onError);
    };

    onStart = function () {
      callbacks.started(cancel);
    };

    onData = function (event) {
      callbacks.received(event, cancel);
    };

    onEnd = function () {
      unsubscribe();
    };

    onError = function (err) {
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
    failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    started(callback) {
      callbacks.started = callback;

      return this;
    },
    received(callback) {
      callbacks.received = callback;

      return this;
    }
  };
};

module.exports = EventsAggregate;