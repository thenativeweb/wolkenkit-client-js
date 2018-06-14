'use strict';

const polyfill = {
  data: {},

  setItem(key, value) {
    this.data[key] = String(value);
  },

  getItem(key) {
    if (!this.data.hasOwnProperty(key)) {
      return undefined;
    }

    return this.data[key];
  },

  removeItem(key) {
    Reflect.deleteProperty(this.data, key);
  },

  clear() {
    this.data = {};
  }
};

/* eslint-disable no-undef */
const localStorage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : polyfill;
/* eslint-enable no-undef */

module.exports = localStorage;