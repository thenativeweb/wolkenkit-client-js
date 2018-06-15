'use strict';

var areDifferent = function areDifferent(left, right) {
  if (!left) {
    throw new Error('Left is missing.');
  }
  if (!right) {
    throw new Error('Right is missing.');
  }

  if (left.length !== right.length) {
    return true;
  }

  for (var i = 0; i < left.length; i++) {
    if (left[i].id !== right[i].id) {
      return true;
    }

    if (JSON.stringify(left) !== JSON.stringify(right)) {
      return true;
    }
  }

  return false;
};

module.exports = areDifferent;