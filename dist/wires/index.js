'use strict';

var Https = require('./Https'),
    Wss = require('./Wss');

var wires = {
  https: Https,
  wss: Wss
};

module.exports = wires;