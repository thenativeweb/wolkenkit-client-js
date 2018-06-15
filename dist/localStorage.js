'use strict';

var polyfill = {
  data: {},

  setItem: function setItem(key, value) {
    this.data[key] = String(value);
  },
  getItem: function getItem(key) {
    if (!this.data.hasOwnProperty(key)) {
      return undefined;
    }

    return this.data[key];
  },
  removeItem: function removeItem(key) {
    Reflect.deleteProperty(this.data, key);
  },
  clear: function clear() {
    this.data = {};
  }
};

/* eslint-disable no-undef */
var localStorage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : polyfill;
/* eslint-enable no-undef */

module.exports = localStorage;