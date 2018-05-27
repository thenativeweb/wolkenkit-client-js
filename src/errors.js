'use strict';

const defekt = require('defekt');

const errors = defekt([
  'CommandFailed',
  'CommandRejected'
]);

module.exports = errors;
