'use strict';

const events = require('events');

const EventEmitter = events.EventEmitter;

class FakeWire extends EventEmitter {
  constructor (options) {
    super();

    this.sendCommand = options.sendCommand;
    this.subscribeToEvents = options.subscribeToEvents;
    this.readModel = options.readModel;
  }
}

module.exports = FakeWire;
