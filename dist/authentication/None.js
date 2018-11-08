'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var None =
/*#__PURE__*/
function () {
  function None() {
    _classCallCheck(this, None);
  }

  _createClass(None, [{
    key: "login",
    value: function login() {
      this.onError(new Error('Invalid operation.'));
    }
  }, {
    key: "logout",
    value: function logout() {
      this.onError(new Error('Invalid operation.'));
    }
    /* eslint-disable class-methods-use-this */

  }, {
    key: "willAuthenticate",
    value: function willAuthenticate(proceed) {
      proceed();
    }
  }, {
    key: "onAuthenticating",
    value: function onAuthenticating() {}
  }, {
    key: "onAuthenticated",
    value: function onAuthenticated() {}
  }, {
    key: "onError",
    value: function onError(err) {
      throw err;
    }
  }, {
    key: "isLoggedIn",
    value: function isLoggedIn() {
      return false;
    }
  }, {
    key: "getToken",
    value: function getToken() {
      return undefined;
    }
  }, {
    key: "getProfile",
    value: function getProfile() {
      return undefined;
    }
    /* eslint-enable class-methods-use-this */

  }]);

  return None;
}();

module.exports = None;