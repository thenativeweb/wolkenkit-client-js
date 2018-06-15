'use strict';

var defekt = require('defekt');

var errors = defekt(['CommandFailed', 'CommandRejected']);

module.exports = errors;