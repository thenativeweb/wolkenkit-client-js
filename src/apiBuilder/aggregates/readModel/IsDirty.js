'use strict';

const { EventEmitter } = require('events');

class IsDirty extends EventEmitter {
  constructor () {
    super();
    this.value = false;
  }

  set (value) {
    this.value = value;
    this.emit('set');
  }

  get () {
    return this.value;
  }
}

module.exports = IsDirty;
