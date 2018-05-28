'use strict';

const Limes = require('limes');

class Local {
  constructor ({ identityProviderName, certificate, privateKey, onAuthenticating, onAuthenticated, onError }) {
    if (!identityProviderName) {
      throw new Error('Identity provider name is missing.');
    }
    if (!certificate) {
      throw new Error('Certificate is missing.');
    }
    if (!privateKey) {
      throw new Error('Private key is missing.');
    }

    this.identityProvider = new Limes({ identityProviderName, certificate, privateKey });

    this.onAuthenticating = onAuthenticating || this.onAuthenticating;
    this.onAuthenticated = onAuthenticated || this.onAuthenticated;
    this.onError = onError || this.onError;

    this.token = undefined;
  }

  static decodeBodyFromToken (token) {
    try {
      const bodyBase64Url = token.split('.')[1];

      const bodyBase64 = bodyBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
            bodyDecoded = Buffer.from(bodyBase64, 'base64').toString('utf8');

      return JSON.parse(bodyDecoded);
    } catch (ex) {
      return undefined;
    }
  }

  login (userName, claims = {}) {
    if (!userName) {
      throw new Error('User name is missing.');
    }

    const token = this.identityProvider.issueTokenFor(userName, claims);

    this.token = token;
  }

  logout () {
    this.token = undefined;
  }

  /* eslint-disable class-methods-use-this */
  onAuthenticating (proceed) {
    proceed();
  }

  onAuthenticated () {}

  onError (err) {
    throw err;
  }
  /* eslint-enable class-methods-use-this */

  isLoggedIn () {
    const profile = this.getProfile();

    if (!profile) {
      return false;
    }

    if (!profile.exp) {
      return false;
    }

    const expiresAt = profile.exp * 1000;
    const now = Date.now();

    if (expiresAt < now) {
      return false;
    }

    return true;
  }

  getToken () {
    if (!this.token) {
      return undefined;
    }

    return this.token;
  }

  getProfile () {
    const token = this.getToken();

    if (!token) {
      return;
    }

    return Local.decodeBodyFromToken(token);
  }
}

module.exports = Local;
