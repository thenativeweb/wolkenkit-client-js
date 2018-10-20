'use strict';

/* global window */

const uuid = require('uuidv4');

class OpenIdConnect {
  constructor (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.identityProviderUrl) {
      throw new Error('Identity provider url is missing.');
    }
    if (!options.clientId) {
      throw new Error('Client id is missing.');
    }

    this.identityProviderUrl = options.identityProviderUrl;
    this.clientId = options.clientId;
    this.redirectUrl = options.redirectUrl || `${window.location.protocol}//${window.location.host}`;
    this.responseType = 'id_token token';
    this.scope = `openid ${options.scope || ''}`.trim();
    this.strictMode = options.strictMode !== false;

    this.onAuthenticating = options.onAuthenticating || this.onAuthenticating;
    this.onAuthenticated = options.onAuthenticated || this.onAuthenticated;
    this.onError = options.onError || this.onError;

    // Only set the token if a hash is given, and if the hash contains a token.
    this.handleReturnFromRedirect();
  }

  static decodeBodyFromToken (token) {
    try {
      const bodyBase64Url = token.split('.')[1];

      const bodyBase64 = bodyBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
            bodyDecoded = window.atob(bodyBase64);

      return JSON.parse(bodyDecoded);
    } catch (ex) {
      return undefined;
    }
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

  getKey () {
    return `id_token_${this.clientId}`;
  }

  handleReturnFromRedirect () {
    const nonce = window.localStorage.getItem('nonce'),
          previousUrl = window.localStorage.getItem('redirectTo');

    window.localStorage.removeItem('nonce');
    window.localStorage.removeItem('redirectTo');

    if (!window.location.hash) {
      return;
    }

    const hash = window.location.hash;
    let token;

    try {
      token = hash.match(/(#|&)id_token=([^&]+)/)[2];
    } catch (ex) {
      return;
    }

    if (this.strictMode && !nonce) {
      return this.onError(new Error('Nonce is missing.'));
    }

    const body = OpenIdConnect.decodeBodyFromToken(token);

    if (!body) {
      return this.onError(new Error('Invalid token.'));
    }
    if (this.strictMode && !body.nonce) {
      return this.onError(new Error('Nonce is missing.'));
    }
    if (this.strictMode && body.nonce !== nonce) {
      return this.onError(new Error('Nonce mismatch.'));
    }

    window.localStorage.setItem(this.getKey(), token);
    window.location.replace(previousUrl);

    this.onAuthenticated(this.getProfile());
  }

  async login () {
    this.onAuthenticating(() => {
      const clientId = window.encodeURIComponent(this.clientId),
            identityProviderUrl = this.identityProviderUrl,
            redirectUrl = window.encodeURIComponent(this.redirectUrl),
            responseType = window.encodeURIComponent(this.responseType),
            scope = window.encodeURIComponent(this.scope);

      const nonce = uuid();

      window.localStorage.setItem('nonce', nonce);
      window.localStorage.setItem('redirectTo', window.location.href);
      window.location.href = `${identityProviderUrl}?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scope}&response_type=${responseType}&nonce=${nonce}`;
    });
  }

  logout () {
    window.localStorage.removeItem(this.getKey());
  }

  async isLoggedIn () {
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

  async getToken () {
    const token = window.localStorage.getItem(this.getKey());

    if (!token) {
      return;
    }

    return token;
  }

  async getProfile () {
    const token = this.getToken();

    if (!token) {
      return;
    }

    return OpenIdConnect.decodeBodyFromToken(token);
  }
}

module.exports = OpenIdConnect;
