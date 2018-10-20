'use strict';

class None {
  async login () {
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

  async isLoggedIn () {
    return false;
  }

  async getToken () {
    return undefined;
  }

  async getProfile () {
    return undefined;
  }
  /* eslint-enable class-methods-use-this */
}

module.exports = None;
