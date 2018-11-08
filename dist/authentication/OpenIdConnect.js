'use strict';
/* global window */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var uuid = require('uuidv4');

var OpenIdConnect =
/*#__PURE__*/
function () {
  function OpenIdConnect(options) {
    _classCallCheck(this, OpenIdConnect);

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
    this.redirectUrl = options.redirectUrl || "".concat(window.location.protocol, "//").concat(window.location.host);
    this.responseType = 'id_token token';
    this.scope = "openid ".concat(options.scope || '').trim();
    this.strictMode = options.strictMode !== false;
    this.onAuthenticating = options.onAuthenticating || this.onAuthenticating;
    this.onAuthenticated = options.onAuthenticated || this.onAuthenticated;
    this.onError = options.onError || this.onError; // Only set the token if a hash is given, and if the hash contains a token.

    this.handleReturnFromRedirect();
  }

  _createClass(OpenIdConnect, [{
    key: "onAuthenticating",

    /* eslint-disable class-methods-use-this */
    value: function onAuthenticating(proceed) {
      proceed();
    }
  }, {
    key: "onAuthenticated",
    value: function onAuthenticated() {}
  }, {
    key: "onError",
    value: function onError(err) {
      throw err;
    }
    /* eslint-enable class-methods-use-this */

  }, {
    key: "getKey",
    value: function getKey() {
      return "id_token_".concat(this.clientId);
    }
  }, {
    key: "handleReturnFromRedirect",
    value: function handleReturnFromRedirect() {
      var nonce = window.localStorage.getItem('nonce'),
          previousUrl = window.localStorage.getItem('redirectTo');
      window.localStorage.removeItem('nonce');
      window.localStorage.removeItem('redirectTo');

      if (!window.location.hash) {
        return;
      }

      var hash = window.location.hash;
      var token;

      try {
        token = hash.match(/(#|&)id_token=([^&]+)/)[2];
      } catch (ex) {
        return;
      }

      if (this.strictMode && !nonce) {
        return this.onError(new Error('Nonce is missing.'));
      }

      var body = OpenIdConnect.decodeBodyFromToken(token);

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
  }, {
    key: "login",
    value: function login() {
      var _this = this;

      this.onAuthenticating(function () {
        var clientId = window.encodeURIComponent(_this.clientId),
            identityProviderUrl = _this.identityProviderUrl,
            redirectUrl = window.encodeURIComponent(_this.redirectUrl),
            responseType = window.encodeURIComponent(_this.responseType),
            scope = window.encodeURIComponent(_this.scope);
        var nonce = uuid();
        window.localStorage.setItem('nonce', nonce);
        window.localStorage.setItem('redirectTo', window.location.href);
        window.location.href = "".concat(identityProviderUrl, "?client_id=").concat(clientId, "&redirect_uri=").concat(redirectUrl, "&scope=").concat(scope, "&response_type=").concat(responseType, "&nonce=").concat(nonce);
      });
    }
  }, {
    key: "logout",
    value: function logout() {
      window.localStorage.removeItem(this.getKey());
    }
  }, {
    key: "isLoggedIn",
    value: function isLoggedIn() {
      var profile = this.getProfile();

      if (!profile) {
        return false;
      }

      if (!profile.exp) {
        return false;
      }

      var expiresAt = profile.exp * 1000;
      var now = Date.now();

      if (expiresAt < now) {
        return false;
      }

      return true;
    }
  }, {
    key: "getToken",
    value: function getToken() {
      var token = window.localStorage.getItem(this.getKey());

      if (!token) {
        return;
      }

      return token;
    }
  }, {
    key: "getProfile",
    value: function getProfile() {
      var token = this.getToken();

      if (!token) {
        return;
      }

      return OpenIdConnect.decodeBodyFromToken(token);
    }
  }], [{
    key: "decodeBodyFromToken",
    value: function decodeBodyFromToken(token) {
      try {
        var bodyBase64Url = token.split('.')[1];
        var bodyBase64 = bodyBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
            bodyDecoded = window.atob(bodyBase64);
        return JSON.parse(bodyDecoded);
      } catch (ex) {
        return undefined;
      }
    }
  }]);

  return OpenIdConnect;
}();

module.exports = OpenIdConnect;