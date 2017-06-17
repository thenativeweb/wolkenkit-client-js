'use strict';

const events = require('events');

const request = require('./request');

const EventEmitter = events.EventEmitter;

class NetworkConnection extends EventEmitter {
  constructor (options) {
    super();

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }
    if (!options.port) {
      throw new Error('Port is missing.');
    }

    this.host = options.host;
    this.port = options.port;

    this.isOnline = undefined;
    this.wasOnline = undefined;
    this.interval = 2 * 1000;
    this.timeoutId = undefined;

    this.test();
  }

  online () {
    this.wasOnline = this.isOnline;
    this.isOnline = true;

    if (this.isOnline !== this.wasOnline) {
      this.emit('online');
    }
  }

  offline () {
    this.wasOnline = this.isOnline;
    this.isOnline = false;

    if (this.isOnline !== this.wasOnline) {
      this.emit('offline');
    }
  }

  test () {
    const { host, port } = this;

    request({
      method: 'GET',
      hostname: host,
      port,
      path: `/v1/ping?_=${Date.now()}`,
      withCredentials: false
    }, err => {
      if (err) {
        this.offline();
      } else {
        this.online();
      }

      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => this.test(), this.interval);
    });
  }

  destroy () {
    clearTimeout(this.timeoutId);
  }
}

module.exports = NetworkConnection;
