'use strict';

class None {
  login () {
    this.onError(new Error('Invalid operation.'));
  }

  logout () {
    this.onError(new Error('Invalid operation.'));
  }

  /* eslint-disable class-methods-use-this */
  willAuthenticate (proceed) {
    proceed();
  }

  onAuthenticating () {}

  onAuthenticated () {}

  onError (err) {
    throw err;
  }

  isLoggedIn () {
    return false;
  }

  getToken () {
    return undefined;
  }

  getProfile () {
    return undefined;
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = None;
