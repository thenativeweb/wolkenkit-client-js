'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Limes = require('limes');

var Local =
/*#__PURE__*/
function () {
  function Local(_ref) {
    var identityProviderName = _ref.identityProviderName,
        certificate = _ref.certificate,
        privateKey = _ref.privateKey,
        onAuthenticating = _ref.onAuthenticating,
        onAuthenticated = _ref.onAuthenticated,
        onError = _ref.onError;

    _classCallCheck(this, Local);

    if (!identityProviderName) {
      throw new Error('Identity provider name is missing.');
    }

    if (!certificate) {
      throw new Error('Certificate is missing.');
    }

    if (!privateKey) {
      throw new Error('Private key is missing.');
    }

    this.identityProvider = new Limes({
      identityProviderName: identityProviderName,
      certificate: certificate,
      privateKey: privateKey
    });
    this.onAuthenticating = onAuthenticating || this.onAuthenticating;
    this.onAuthenticated = onAuthenticated || this.onAuthenticated;
    this.onError = onError || this.onError;
    this.token = undefined;
  }

  _createClass(Local, [{
    key: "login",
    value: function login(userName) {
      var claims = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!userName) {
        throw new Error('User name is missing.');
      }

      var token = this.identityProvider.issueTokenFor(userName, claims);
      this.token = token;
    }
  }, {
    key: "logout",
    value: function logout() {
      this.token = undefined;
    }
    /* eslint-disable class-methods-use-this */

  }, {
    key: "onAuthenticating",
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
      if (!this.token) {
        return undefined;
      }

      return this.token;
    }
  }, {
    key: "getProfile",
    value: function getProfile() {
      var token = this.getToken();

      if (!token) {
        return;
      }

      return Local.decodeBodyFromToken(token);
    }
  }], [{
    key: "decodeBodyFromToken",
    value: function decodeBodyFromToken(token) {
      try {
        var bodyBase64Url = token.split('.')[1];
        var bodyBase64 = bodyBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
            bodyDecoded = Buffer.from(bodyBase64, 'base64').toString('utf8');
        return JSON.parse(bodyDecoded);
      } catch (ex) {
        return undefined;
      }
    }
  }]);

  return Local;
}();

module.exports = Local;