'use strict';

const Https = require('./Https'),
      Wss = require('./Wss');

const wires = {
  https: Https,
  wss: Wss
};

module.exports = wires;
